import { TIJUANA_CENTER } from '@/constants/map';

export function parseMapCenter(rawValue: string | undefined) {
	if (!rawValue) {
		return TIJUANA_CENTER;
	}

	const [latitudeValue, longitudeValue] = rawValue.split(',').map((part) => part.trim());
	const latitude = Number(latitudeValue);
	const longitude = Number(longitudeValue);

	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return TIJUANA_CENTER;
	}

	return { latitude, longitude };
}