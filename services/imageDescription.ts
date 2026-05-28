import * as FileSystem from 'expo-file-system';

const CLASIFICAR_URL = 'https://t-guia-api-707178617216.us-central1.run.app/clasificar-barrera';

export type CapturedPhoto = {
	uri: string;
	mimeType?: string;
	base64?: string;
};

export type ClasificarResult = {
	tipo: string;
	severidad: 1 | 2 | 3;
	descripcion: string;
};

type ClasificarResponse = {
	tipo: string;
	severidad: number;
	descripcion: string;
};

function normalizeBase64(raw: string): string {
	return raw.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').replace(/\s/g, '');
}

async function resolveBase64(photo: CapturedPhoto): Promise<string> {
	if (photo.base64?.trim()) {
		return normalizeBase64(photo.base64);
	}

	if (photo.uri) {
		const fromFile = await FileSystem.readAsStringAsync(photo.uri, { encoding: 'base64' });
		return normalizeBase64(fromFile);
	}

	throw new Error('No hay imagen en base64 para analizar.');
}

export async function describeRouteObstaclePhoto(photo: CapturedPhoto): Promise<ClasificarResult> {
	const mime_type = photo.mimeType ?? 'image/jpeg';
	const foto_base64 = await resolveBase64(photo);

	const response = await fetch(CLASIFICAR_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ foto_base64, mime_type }),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Error al clasificar imagen (${response.status}): ${text.slice(0, 200)}`);
	}

	const payload = (await response.json()) as ClasificarResponse;

	if (!payload.descripcion) {
		throw new Error('La API no devolvió descripción.');
	}

	return {
		tipo: payload.tipo,
		severidad: (payload.severidad as 1 | 2 | 3) ?? 2,
		descripcion: payload.descripcion,
	};
}
