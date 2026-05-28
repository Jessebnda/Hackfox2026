/**
 * Placeholder: zonas a evitar en rutas (polígonos ORS).
 * Sustituir por consulta real a la base de datos.
 */
export type AvoidZoneRecord = {
	id: string;
	label: string;
	polygon: number[][][];
};

const PLACEHOLDER_AVOID_ZONES: AvoidZoneRecord[] = [
	{
		id: 'obra-revolucion',
		label: 'Obra Av. Revolución',
		polygon: [
			[
				[-117.0425, 32.5168],
				[-117.0398, 32.5168],
				[-117.0398, 32.5146],
				[-117.0425, 32.5146],
				[-117.0425, 32.5168],
			],
		],
	},
	{
		id: 'escaleras-zona-rio',
		label: 'Escaleras sin rampa (Zona Río)',
		polygon: [
			[
				[-117.0368, 32.5122],
				[-117.0342, 32.5122],
				[-117.0342, 32.5104],
				[-117.0368, 32.5104],
				[-117.0368, 32.5122],
			],
		],
	},
];

export async function fetchRouteAvoidPolygons(): Promise<number[][][][]> {
	// TODO: reemplazar por fetch a tu API/DB, p. ej.:
	// const response = await fetch(`${API_URL}/avoid-zones`);
	// const zones: AvoidZoneRecord[] = await response.json();
	await new Promise((resolve) => setTimeout(resolve, 120));

	return PLACEHOLDER_AVOID_ZONES.map((zone) => zone.polygon);
}
