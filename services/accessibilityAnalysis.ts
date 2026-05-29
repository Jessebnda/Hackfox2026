const API_URL = 'https://t-guia-api-707178617216.us-central1.run.app/analizar-destino';

export type AccessibilityDetails = {
	rampa: boolean;
	escalones: boolean;
	estacionamiento_accesible: boolean;
	banqueta_estado: string;
	entrada_ancha: boolean;
	obstaculos: boolean;
};

export type AccessibilityResult = {
	lugar: string;
	lat: number;
	lng: number;
	fotos_analizadas: number;
	accesible: boolean;
	puntaje: number;
	puntaje_max: number;
	detalles: AccessibilityDetails;
	resumen: string;
	recomendacion: string;
};

export async function analyzeDestination(
	lat: number,
	lng: number,
	nombre_lugar: string,
): Promise<AccessibilityResult> {
	console.log(`[Accessibility] analizando "${nombre_lugar}" (${lat}, ${lng})`);

	const response = await fetch(API_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ lat, lng, nombre_lugar, idioma: 'es' }),
	});

	if (!response.ok) {
		console.warn(`[Accessibility] error HTTP ${response.status} para "${nombre_lugar}"`);
		throw new Error(`Error analizando destino: ${response.status}`);
	}

	const result = (await response.json()) as AccessibilityResult;
	console.log(
		`[Accessibility] resultado para "${nombre_lugar}": accesible=${result.accesible}, puntaje=${result.puntaje}/${result.puntaje_max}, fotos=${result.fotos_analizadas}`,
	);
	console.log(`[Accessibility] detalles:`, result.detalles);

	return result;
}
