import { ACCESSIBLE_POINTS } from '@/constants/accessiblePoints';
import { TIJUANA_CENTER } from '@/constants/map';

export type PlaceResult = {
	id: string;
	name: string;
	subtitle: string;
	latitude: number;
	longitude: number;
	source: 'local' | 'google';
	distanceMeters?: number;
};

export type SearchNearLocation = {
	latitude: number;
	longitude: number;
};

type GoogleTextSearchResponse = {
	places?: Array<{
		id?: string;
		displayName?: { text?: string };
		formattedAddress?: string;
		location?: { latitude?: number; longitude?: number };
	}>;
	error?: { message?: string; status?: string };
};

const NEARBY_RADIUS_METERS = 12000;
const FALLBACK_RADIUS_METERS = 40000;

function getGoogleMapsApiKey() {
	return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
}

function distanceMeters(from: SearchNearLocation, to: SearchNearLocation): number {
	const earthRadius = 6371000;
	const latDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
	const lonDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
	const fromLat = (from.latitude * Math.PI) / 180;
	const toLat = (to.latitude * Math.PI) / 180;

	const haversine =
		Math.sin(latDelta / 2) ** 2 +
		Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) ** 2;

	return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function formatDistance(meters: number): string {
	if (meters < 1000) {
		return `${Math.round(meters)} m`;
	}

	return `${(meters / 1000).toFixed(1)} km`;
}

function withDistance(
	place: Omit<PlaceResult, 'distanceMeters'>,
	near: SearchNearLocation | null,
): PlaceResult {
	if (!near) {
		return place;
	}

	const distance = distanceMeters(near, place);
	const suffix = formatDistance(distance);
	const subtitle = place.subtitle.includes('·')
		? place.subtitle
		: `${place.subtitle} · ${suffix}`;

	return { ...place, distanceMeters: distance, subtitle };
}

function sortByDistance(results: PlaceResult[]): PlaceResult[] {
	return [...results].sort((a, b) => {
		if (a.distanceMeters == null && b.distanceMeters == null) {
			return 0;
		}

		if (a.distanceMeters == null) {
			return 1;
		}

		if (b.distanceMeters == null) {
			return -1;
		}

		return a.distanceMeters - b.distanceMeters;
	});
}

function searchLocalPlaces(query: string, near: SearchNearLocation | null): PlaceResult[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized) {
		return [];
	}

	const matches = ACCESSIBLE_POINTS.filter(
		(point) =>
			point.name.toLowerCase().includes(normalized) ||
			point.description.toLowerCase().includes(normalized),
	).map((point) =>
		withDistance(
			{
				id: point.id,
				name: point.name,
				subtitle: point.description,
				latitude: point.latitude,
				longitude: point.longitude,
				source: 'local',
			},
			near,
		),
	);

	return sortByDistance(matches);
}

async function searchGooglePlaces(
	query: string,
	near: SearchNearLocation | null,
): Promise<PlaceResult[]> {
	const apiKey = getGoogleMapsApiKey();
	const textQuery = query.trim();

	if (!apiKey || textQuery.length < 2) {
		return [];
	}

	const biasCenter = near ?? TIJUANA_CENTER;
	const biasRadius = near ? NEARBY_RADIUS_METERS : FALLBACK_RADIUS_METERS;

	const body: Record<string, unknown> = {
		textQuery,
		languageCode: 'es',
		regionCode: 'MX',
		locationBias: {
			circle: {
				center: {
					latitude: biasCenter.latitude,
					longitude: biasCenter.longitude,
				},
				radius: biasRadius,
			},
		},
		maxResultCount: 10,
	};

	if (near) {
		body.rankPreference = 'DISTANCE';
	}

	const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Goog-Api-Key': apiKey,
			'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		return [];
	}

	const payload = (await response.json()) as GoogleTextSearchResponse;
	const results: PlaceResult[] = [];

	for (const place of payload.places ?? []) {
		const latitude = place.location?.latitude;
		const longitude = place.location?.longitude;

		if (latitude == null || longitude == null) {
			continue;
		}

		results.push(
			withDistance(
				{
					id: place.id ?? `google-${latitude}-${longitude}`,
					name: place.displayName?.text ?? 'Lugar',
					subtitle: place.formattedAddress ?? 'Google Places',
					latitude,
					longitude,
					source: 'google',
				},
				near,
			),
		);
	}

	return sortByDistance(results);
}

export async function searchPlaces(
	query: string,
	near?: SearchNearLocation | null,
): Promise<PlaceResult[]> {
	const trimmed = query.trim();
	if (!trimmed) {
		return [];
	}

	const anchor = near ?? null;
	const localResults = searchLocalPlaces(trimmed, anchor);
	const googleResults = await searchGooglePlaces(trimmed, anchor);

	const merged = new Map<string, PlaceResult>();
	for (const place of [...localResults, ...googleResults]) {
		merged.set(`${place.latitude.toFixed(5)}-${place.longitude.toFixed(5)}`, place);
	}

	return sortByDistance(Array.from(merged.values())).slice(0, 12);
}
