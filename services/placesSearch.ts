import { ACCESSIBLE_POINTS } from '@/constants/accessiblePoints';

export type PlaceResult = {
	id: string;
	name: string;
	subtitle: string;
	latitude: number;
	longitude: number;
	source: 'local' | 'ors';
};

type OrsGeocodeFeature = {
	properties?: {
		id?: string;
		label?: string;
		name?: string;
		locality?: string;
		region?: string;
	};
	geometry?: {
		coordinates?: [number, number];
	};
};

type OrsGeocodeResponse = {
	features?: OrsGeocodeFeature[];
};

function getApiKey() {
	return process.env.EXPO_PUBLIC_ORS_API_KEY?.trim() ?? '';
}

function searchLocalPlaces(query: string): PlaceResult[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized) {
		return [];
	}

	return ACCESSIBLE_POINTS.filter(
		(point) =>
			point.name.toLowerCase().includes(normalized) ||
			point.description.toLowerCase().includes(normalized),
	).map((point) => ({
		id: point.id,
		name: point.name,
		subtitle: point.description,
		latitude: point.latitude,
		longitude: point.longitude,
		source: 'local' as const,
	}));
}

async function searchOrsPlaces(query: string): Promise<PlaceResult[]> {
	const apiKey = getApiKey();
	if (!apiKey || query.trim().length < 3) {
		return [];
	}

	const params = new URLSearchParams({
		api_key: apiKey,
		text: query.trim(),
		'boundary.country': 'MX',
		size: '8',
	});

	const response = await fetch(`https://api.openrouteservice.org/geocode/search?${params.toString()}`);
	if (!response.ok) {
		return [];
	}

	const payload = (await response.json()) as OrsGeocodeResponse;

	const results: PlaceResult[] = [];

	for (const [index, feature] of (payload.features ?? []).entries()) {
		const coordinates = feature.geometry?.coordinates;
		if (!coordinates) {
			continue;
		}

		const [longitude, latitude] = coordinates;
		const name = feature.properties?.name ?? feature.properties?.label ?? 'Lugar';
		const locality = feature.properties?.locality ?? feature.properties?.region ?? '';

		results.push({
			id: feature.properties?.id ?? `ors-${index}-${latitude}-${longitude}`,
			name,
			subtitle: locality || feature.properties?.label || 'Resultado OpenRouteService',
			latitude,
			longitude,
			source: 'ors',
		});
	}

	return results;
}

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
	const localResults = searchLocalPlaces(query);
	const remoteResults = await searchOrsPlaces(query);

	const merged = new Map<string, PlaceResult>();
	for (const place of [...localResults, ...remoteResults]) {
		merged.set(`${place.latitude.toFixed(5)}-${place.longitude.toFixed(5)}`, place);
	}

	return Array.from(merged.values()).slice(0, 12);
}
