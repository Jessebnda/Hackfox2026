import * as FileSystem from 'expo-file-system';

import {
	extractGeminiText,
	geminiGenerateContent,
	getGeminiApiKey,
	listGeminiModels,
	sanitizeGeminiBodyForLog,
} from './geminiClient';

const LOG_TAG = '[GeminiPhoto]';

const VISION_PROMPT = `Eres un asistente de movilidad urbana accesible.
Describe en 1 a 3 frases cortas, en español, solo lo que se ve en la foto.
Prioriza: nombre de calle si se lee, banqueta, rampa, escaleras, obra, agua, vehículos bloqueando, señales, o ruta bloqueada.
No inventes datos que no se vean.`;

export type CapturedPhoto = {
	uri: string;
	mimeType?: string;
	base64?: string;
};

function log(message: string, data?: unknown) {
	if (data !== undefined) {
		console.log(LOG_TAG, message, data);
		return;
	}

	console.log(LOG_TAG, message);
}

function normalizeBase64(raw: string): string {
	return raw.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').replace(/\s/g, '');
}

async function resolveBase64(photo: CapturedPhoto): Promise<string> {
	if (photo.base64?.trim()) {
		log('Base64 desde cámara (asset.base64)');
		return normalizeBase64(photo.base64);
	}

	if (photo.uri) {
		log('Leyendo base64 desde uri', { uri: photo.uri });
		const fromFile = await FileSystem.readAsStringAsync(photo.uri, { encoding: 'base64' });
		return normalizeBase64(fromFile);
	}

	throw new Error('No hay imagen en base64 para analizar.');
}

export async function listEnabledGeminiModels(): Promise<string[]> {
	return listGeminiModels();
}

export async function describeRouteObstaclePhoto(photo: CapturedPhoto): Promise<string> {
	const apiKey = getGeminiApiKey();
	log('════════ INICIO describeRouteObstaclePhoto ════════');
	log('Foto recibida', {
		uri: photo.uri,
		mimeType: photo.mimeType ?? 'image/jpeg',
		hasBase64FromPicker: Boolean(photo.base64),
		base64LengthFromPicker: photo.base64?.length ?? 0,
	});
	log('API key', {
		configured: Boolean(apiKey),
		masked: apiKey
			? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)} (${apiKey.length} chars)`
			: null,
	});

	if (!apiKey) {
		throw new Error('Configura EXPO_PUBLIC_GEMINI_API_KEY (Google AI Studio).');
	}

	const mimeType = photo.mimeType ?? 'image/jpeg';
	const base64Image = await resolveBase64(photo);

	log('Base64 listo para Gemini', {
		chars: base64Image.length,
		approxKb: Math.round((base64Image.length * 3) / 4 / 1024),
		start: base64Image.slice(0, 32),
		end: base64Image.slice(-16),
	});

	const models = await listGeminiModels();
	log('Modelos a probar', models);

	let lastError = 'Gemini no devolvió descripción.';

	for (const [index, model] of models.entries()) {
		log(`─── Intento ${index + 1}/${models.length}: ${model} ───`);

		const requestBody = {
			contents: [
				{
					parts: [
						{ text: VISION_PROMPT },
						{
							inline_data: {
								mime_type: mimeType,
								data: base64Image,
							},
						},
					],
				},
			],
			generationConfig: {
				maxOutputTokens: 280,
				temperature: 0.2,
			},
		};

		log('Request body (resumido):', sanitizeGeminiBodyForLog(requestBody));

		try {
			const payload = await geminiGenerateContent(model, requestBody, {
				verbose: true,
				label: `foto-reruteo/${model}`,
			});

			const text = extractGeminiText(payload);
			log('✓ Éxito', { model, description: text });

			if (text) {
				log('════════ FIN OK ════════');
				return text;
			}

			lastError = `Sin texto (${model})`;
			log('⚠ Respuesta OK pero sin texto en candidates', payload);
		} catch (error) {
			lastError = error instanceof Error ? error.message : String(error);
			log('✗ Falló modelo', { model, error: lastError });
		}
	}

	log('════════ FIN ERROR ════════', { lastError, modelsTried: models });
	throw new Error(`${lastError} Modelos probados: ${models.join(', ')}`);
}
