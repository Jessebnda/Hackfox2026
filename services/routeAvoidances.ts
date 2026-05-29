const API_BASE = 'https://t-guia-api-707178617216.us-central1.run.app';

export type Barrera = {
	id: string;
	lat: number;
	lng: number;
	tipo: string;
	severidad: 1 | 2 | 3;
	descripcion: string;
	foto_url: string;
	calle_aprox: string | null;
	activo: boolean;
};

// ~33m square around each barrier point for ORS avoid_polygons
function pointToSquarePolygon(lat: number, lng: number): number[][][] {
	const deltaLat = 0.0003;
	const deltaLng = deltaLat / Math.cos((lat * Math.PI) / 180);
	const ring: number[][] = [
		[lng - deltaLng, lat - deltaLat],
		[lng + deltaLng, lat - deltaLat],
		[lng + deltaLng, lat + deltaLat],
		[lng - deltaLng, lat + deltaLat],
		[lng - deltaLng, lat - deltaLat],
	];
	return [ring];
}

export async function fetchBarreras(): Promise<Barrera[]> {
	console.log('[API] GET /barreras');
	const response = await fetch(`${API_BASE}/barreras`);
	if (!response.ok) {
		console.error('[API] GET /barreras failed', response.status);
		throw new Error(`Error al obtener barreras: ${response.status}`);
	}
	const data = (await response.json()) as Barrera[];
	console.log(`[API] GET /barreras raw: ${data.length} total`, data.map((b) => ({ id: b.id, activo: b.activo, tipo: b.tipo })));
	const activas = data.filter((b) => b.activo !== false); // undefined = activo (default DB es TRUE)
	console.log(`[API] GET /barreras ok — ${activas.length} activas`);
	return activas;
}

export async function fetchRouteAvoidPolygons(): Promise<number[][][][]> {
	const barreras = await fetchBarreras();
	console.log(`[API] avoid_polygons generados: ${barreras.length}`);
	return barreras.map((b) => pointToSquarePolygon(b.lat, b.lng));
}

export async function postBarrera(input: {
	lat: number;
	lng: number;
	tipo: string;
	severidad: 1 | 2 | 3;
	descripcion: string;
	foto_url: string;
	calle_aprox: string | null;
}): Promise<void> {
	console.log('[API] POST /barreras', { tipo: input.tipo, severidad: input.severidad, lat: input.lat, lng: input.lng });
	const response = await fetch(`${API_BASE}/barreras`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	});
	const body = await response.json().catch(() => null);
	if (!response.ok) {
		console.error('[API] POST /barreras failed', response.status, body);
		throw new Error(`Error al guardar barrera: ${response.status}`);
	}
	console.log('[API] POST /barreras ok', body);
}

export async function deleteBarrera(id: string): Promise<void> {
	console.log('[API] DELETE /barreras/%s', id);
	const response = await fetch(`${API_BASE}/barreras/${id}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		const body = await response.json().catch(() => null);
		console.error('[API] DELETE /barreras failed', response.status, body);
		throw new Error(`Error al borrar barrera: ${response.status}`);
	}

	console.log('[API] DELETE /barreras ok', id);
}
