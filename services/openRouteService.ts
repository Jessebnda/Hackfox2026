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
const OSRM_BASE_URL = 'http://router.project-osrm.org';

function getApiKey() {
	return process.env.EXPO_PUBLIC_ORS_API_KEY?.trim() ?? '';
}

function toOrsCoordinate(point: LatLng): [number, number] {
	return [point.longitude, point.latitude];
}

function decodeLineString(coordinates: [number, number][]): RouteCoordinate[] {
	return coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
}

async function fetchWalkingRouteOSRM(
	origin: LatLng,
	destination: LatLng,
): Promise<{ coordinates: RouteCoordinate[]; distanceMeters: number; durationSeconds: number }> {
	const url = `${OSRM_BASE_URL}/route/v1/foot/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
	const response = await fetch(url);
	const payload = await response.json() as {
		code: string;
		routes?: Array<{
			geometry: { type: 'LineString'; coordinates: [number, number][] };
			legs: Array<{ distance: number; duration: number }>;
		}>;
	};

	if (payload.code !== 'Ok' || !payload.routes?.[0]?.geometry?.coordinates?.length) {
		throw new Error('OSRM no pudo calcular la ruta.');
	}

	const route = payload.routes[0];
	return {
		coordinates: decodeLineString(route.geometry.coordinates),
		distanceMeters: route.legs[0]?.distance ?? 0,
		durationSeconds: route.legs[0]?.duration ?? 0,
	};
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

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);

		const response = await fetch(`${ORS_BASE_URL}/v2/directions/foot-walking/geojson`, {
			method: 'POST',
			headers: {
				Authorization: apiKey,
				'Content-Type': 'application/json',
				Accept: 'application/json, application/geo+json',
			},
			body: JSON.stringify(body),
			signal: controller.signal,
		});
		clearTimeout(timeout);

		const rawText = await response.text();
		if (!response.ok || rawText.trimStart().startsWith('<')) {
			throw new Error(`ORS status ${response.status}`);
		}
		const payload = JSON.parse(rawText) as OrsDirectionsResponse;

		const feature = payload.features?.[0];
		if (!feature?.geometry?.coordinates?.length) {
			throw new Error('ORS no devolvió geometría.');
		}

		console.log('[Routing] Ruta obtenida via ORS ✅');
		return {
			coordinates: decodeLineString(feature.geometry.coordinates),
			distanceMeters: feature.properties?.summary?.distance ?? 0,
			durationSeconds: feature.properties?.summary?.duration ?? 0,
		};
	} catch (orsError) {
		console.warn('[ORS] Falló, usando OSRM como fallback:', orsError);
		const result = await fetchWalkingRouteOSRM(origin, destination);
		console.log('[Routing] Ruta obtenida via OSRM ✅');
		return result;
	}
}
