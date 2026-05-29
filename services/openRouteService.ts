import { fetchRouteAvoidPolygons } from './routeAvoidances';

export type LatLng = {
	latitude: number;
	longitude: number;
};

export type RouteCoordinate = LatLng;

type OrsLineString = {
	type: 'LineString';
	coordinates: [number, number][];
};

type OrsDirectionsResponse = {
	features?: Array<{
		geometry?: OrsLineString;
		properties?: {
			summary?: {
				distance?: number;
				duration?: number;
			};
		};
	}>;
	error?: {
		message?: string;
	};
};

const ORS_BASE_URL = 'https://api.openrouteservice.org';

function getApiKey() {
	return process.env.EXPO_PUBLIC_ORS_API_KEY?.trim() ?? '';
}

function toOrsCoordinate(point: LatLng): [number, number] {
	return [point.longitude, point.latitude];
}

function decodeLineString(coordinates: [number, number][]): RouteCoordinate[] {
	return coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
}

export async function fetchWalkingRoute(
	origin: LatLng,
	destination: LatLng,
): Promise<{ coordinates: RouteCoordinate[]; distanceMeters: number; durationSeconds: number }> {
	const apiKey = getApiKey();
	if (!apiKey) {
		throw new Error('Configura EXPO_PUBLIC_ORS_API_KEY en tu archivo .env');
	}

	const avoidPolygons = await fetchRouteAvoidPolygons();

	const body: Record<string, unknown> = {
		coordinates: [toOrsCoordinate(origin), toOrsCoordinate(destination)],
		preference: 'recommended',
	};

	if (avoidPolygons.length > 0) {
		body.options = {
			avoid_polygons: {
				type: 'MultiPolygon',
				coordinates: avoidPolygons,
			},
		};
		console.log(`[ORS] ruteo con ${avoidPolygons.length} zonas de evitación`);
	} else {
		console.log('[ORS] ruteo sin zonas de evitación');
	}

	const response = await fetch(`${ORS_BASE_URL}/v2/directions/foot-walking/geojson`, {
		method: 'POST',
		headers: {
			Authorization: apiKey,
			'Content-Type': 'application/json',
			Accept: 'application/json, application/geo+json',
		},
		body: JSON.stringify(body),
	});

	const payload = (await response.json()) as OrsDirectionsResponse;

	if (!response.ok) {
		throw new Error(payload.error?.message ?? `OpenRouteService respondió con ${response.status}`);
	}

	const feature = payload.features?.[0];
	if (!feature?.geometry?.coordinates?.length) {
		throw new Error('No se pudo calcular la ruta con OpenRouteService.');
	}

	return {
		coordinates: decodeLineString(feature.geometry.coordinates),
		distanceMeters: feature.properties?.summary?.distance ?? 0,
		durationSeconds: feature.properties?.summary?.duration ?? 0,
	};
}
