const API_BASE = 'https://t-guia-api-707178617216.us-central1.run.app';

export type SesionRuteoInput = {
	destino_texto: string;
	destino_place_id: string;
	destino_nombre?: string;
	origen_lat: number;
	origen_lng: number;
	idioma?: string;
	ruta_elegida_idx: 0 | 1 | 2;
	barreras_ruta_0?: string[];
	barreras_ruta_1?: string[];
	barreras_ruta_2?: string[];
	explicacion: string;
};

export async function registrarSesion(input: SesionRuteoInput): Promise<void> {
	const body = { idioma: 'es', ...input };
	console.log('[API] POST /sesiones', body);
	try {
		const response = await fetch(`${API_BASE}/sesiones`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		const data = await response.json().catch(() => null);
		if (!response.ok) {
			console.warn('[API] POST /sesiones failed', response.status, data);
		} else {
			console.log('[API] POST /sesiones ok', data);
		}
	} catch (e) {
		console.error('[API] POST /sesiones error', e);
	}
}
