/**
 * Placeholder de persistencia para reportes de reruteo (foto + descripción Gemini).
 * Sustituir por POST a tu API/DB.
 */
export type RouteReportCategory =
	| 'obstaculo_vial'
	| 'ruta_bloqueada'
	| 'obra'
	| 'accesibilidad'
	| 'otro';

export type RouteReportRecord = {
	id: string;
	category: RouteReportCategory;
	description: string;
	latitude: number;
	longitude: number;
	createdAt: string;
	routeDestinationLabel?: string;
};

export type SaveRouteReportInput = {
	category: RouteReportCategory;
	description: string;
	latitude: number;
	longitude: number;
	routeDestinationLabel?: string;
};

export async function saveRouteReport(input: SaveRouteReportInput): Promise<RouteReportRecord> {
	// TODO: await fetch(`${API_URL}/route-reports`, { method: 'POST', body: JSON.stringify(input) });
	await new Promise((resolve) => setTimeout(resolve, 150));

	const record: RouteReportRecord = {
		id: `report-${Date.now()}`,
		createdAt: new Date().toISOString(),
		...input,
	};

	if (__DEV__) {
		console.log('[routeReports placeholder]', record);
	}

	return record;
}
