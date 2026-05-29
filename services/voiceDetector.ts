const DETECTAR_DESTINO_URL =
	'https://t-guia-api-707178617216.us-central1.run.app/detectar-destino';

export type DetectarDestinoResponse = {
	lugarDestino: string | null;
	idioma: string;
	transcripcion: string;
	confianza: string;
};

export async function detectarDestino(
	audioBase64: string,
	mimeType: string,
): Promise<DetectarDestinoResponse> {
	const response = await fetch(DETECTAR_DESTINO_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ audio_base64: audioBase64, mime_type: mimeType }),
	});

	if (!response.ok) {
		throw new Error(`Error del servidor: ${response.status}`);
	}

	return response.json() as Promise<DetectarDestinoResponse>;
}
