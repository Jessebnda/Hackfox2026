/**
 * Cliente único para Gemini (Generative Language API).
 * Usa solo API key — nunca Authorization: Bearer (eso provoca errores OAuth con keys AQ.).
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const FALLBACK_GEMINI_MODELS = [
	'gemini-2.5-flash',
	'gemini-2.5-flash-lite',
	'gemini-3.5-flash',
	'gemini-flash-latest',
	'gemini-2.5-pro',
] as const;

type GeminiModelsListResponse = {
	models?: Array<{
		name?: string;
		supportedGenerationMethods?: string[];
	}>;
};

export type GeminiGenerateResponse = {
	candidates?: Array<{
		content?: { parts?: Array<{ text?: string }> };
	}>;
	error?: { message?: string; status?: string };
};

let cachedModelIds: string[] | null = null;

const MODEL_BLOCKLIST = [
	'tts',
	'live',
	'embedding',
	'imagen',
	'veo',
	'lyria',
	'computer-use',
	'deep-research',
	'robotics',
	'aqa',
	'preview-tts',
] as const;

export function getGeminiApiKey() {
	return process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() ?? '';
}

const PHOTO_LOG_TAG = '[GeminiPhoto]';

function maskApiKey(key: string): string {
	if (!key) {
		return '(vacía)';
	}

	if (key.length <= 10) {
		return `*** (${key.length} chars)`;
	}

	return `${key.slice(0, 6)}…${key.slice(-4)} (${key.length} chars, prefijo ${key.slice(0, 3)})`;
}

export function sanitizeGeminiBodyForLog(body: Record<string, unknown>): unknown {
	return JSON.parse(
		JSON.stringify(body, (key, value) => {
			if (key === 'data' && typeof value === 'string' && value.length > 60) {
				return {
					_base64: true,
					chars: value.length,
					approxKb: Math.round((value.length * 3) / 4 / 1024),
					previewStart: value.slice(0, 48),
					previewEnd: value.slice(-24),
				};
			}

			return value;
		}),
	);
}

function photoLog(message: string, data?: unknown) {
	if (data !== undefined) {
		console.log(PHOTO_LOG_TAG, message, data);
		return;
	}

	console.log(PHOTO_LOG_TAG, message);
}

function isUsableChatModel(modelId: string): boolean {
	const id = modelId.toLowerCase();
	if (!id.startsWith('gemini')) {
		return false;
	}

	return !MODEL_BLOCKLIST.some((token) => id.includes(token));
}

function rankModels(modelIds: string[]): string[] {
	const priority = [...FALLBACK_GEMINI_MODELS, 'gemini-2.5-pro-latest', 'gemini-3-flash'];

	return [...modelIds].sort((a, b) => {
		const indexA = priority.indexOf(a as (typeof FALLBACK_GEMINI_MODELS)[number]);
		const indexB = priority.indexOf(b as (typeof FALLBACK_GEMINI_MODELS)[number]);

		if (indexA === -1 && indexB === -1) {
			return a.localeCompare(b);
		}

		if (indexA === -1) {
			return 1;
		}

		if (indexB === -1) {
			return -1;
		}

		return indexA - indexB;
	});
}

function parseGeminiError(payload: GeminiGenerateResponse, status: number): string {
	const message = payload.error?.message ?? `HTTP ${status}`;
	if (message.toLowerCase().includes('oauth') || message.toLowerCase().includes('access token')) {
		return `${message} — Usa una API key de AI Studio (AIza… o AQ.) con header x-goog-api-key, no Bearer. Regenera la key en https://aistudio.google.com/apikey si sigue fallando.`;
	}

	return message;
}

type GeminiFetchOptions = {
	verbose?: boolean;
	label?: string;
};

/**
 * Keys AQ. a veces fallan solo con header; probamos header y luego ?key= (nunca ambos a la vez).
 */
async function geminiFetch(
	path: string,
	apiKey: string,
	init: RequestInit,
	options?: GeminiFetchOptions,
): Promise<Response> {
	const url = `${GEMINI_BASE}${path}`;
	const verbose = options?.verbose ?? false;

	if (verbose) {
		photoLog(`→ REQUEST ${options?.label ?? path}`, {
			method: init.method ?? 'GET',
			url,
			apiKey: maskApiKey(apiKey),
			headers: {
				...(init.headers as Record<string, string>),
				'x-goog-api-key': maskApiKey(apiKey),
			},
			bodyPreview:
				typeof init.body === 'string'
					? init.body.length > 800
						? `${init.body.slice(0, 400)}… [${init.body.length} chars total]`
						: init.body
					: init.body,
		});
	}

	const withHeader = await fetch(url, {
		...init,
		headers: {
			...(init.headers as Record<string, string>),
			'x-goog-api-key': apiKey,
		},
	});

	if (verbose) {
		const headerText = await withHeader.clone().text();
		photoLog(`← RESPONSE (auth: x-goog-api-key) ${withHeader.status}`, {
			ok: withHeader.ok,
			status: withHeader.status,
			body: headerText.length > 2000 ? `${headerText.slice(0, 2000)}…` : headerText,
		});
	}

	if (withHeader.ok) {
		return withHeader;
	}

	if (withHeader.status === 401 || withHeader.status === 403) {
		const separator = path.includes('?') ? '&' : '?';
		const urlWithKey = `${url}${separator}key=${encodeURIComponent(apiKey)}`;

		if (verbose) {
			photoLog('↻ REINTENTO auth: ?key= en URL (sin header x-goog-api-key)', { url: urlWithKey });
		}

		const withQuery = await fetch(urlWithKey, {
			...init,
			headers: {
				...(init.headers as Record<string, string>),
			},
		});

		if (verbose) {
			const queryText = await withQuery.clone().text();
			photoLog(`← RESPONSE (auth: query key) ${withQuery.status}`, {
				ok: withQuery.ok,
				status: withQuery.status,
				body: queryText.length > 2000 ? `${queryText.slice(0, 2000)}…` : queryText,
			});
		}

		return withQuery;
	}

	return withHeader;
}

export async function listGeminiModels(): Promise<string[]> {
	const apiKey = getGeminiApiKey();
	if (!apiKey) {
		return [];
	}

	if (cachedModelIds?.length) {
		return cachedModelIds;
	}

	try {
		const response = await geminiFetch('/models', apiKey, { method: 'GET' });
		const payload = (await response.json()) as GeminiModelsListResponse;

		if (response.ok && payload.models?.length) {
			const fromApi = payload.models
				.filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
				.map((model) => model.name?.replace(/^models\//, '') ?? '')
				.filter((modelId): modelId is string => Boolean(modelId) && isUsableChatModel(modelId));

			if (fromApi.length > 0) {
				cachedModelIds = rankModels(fromApi);
				return cachedModelIds;
			}
		}
	} catch {
		// fallback
	}

	cachedModelIds = [...FALLBACK_GEMINI_MODELS];
	return cachedModelIds;
}

export function extractGeminiText(payload: GeminiGenerateResponse): string | null {
	return payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

export type GeminiGenerateOptions = {
	/** Logs detallados en consola (Metro) */
	verbose?: boolean;
	label?: string;
};

export async function geminiGenerateContent(
	model: string,
	body: Record<string, unknown>,
	options?: GeminiGenerateOptions,
): Promise<GeminiGenerateResponse> {
	const apiKey = getGeminiApiKey();
	if (!apiKey) {
		throw new Error('Configura EXPO_PUBLIC_GEMINI_API_KEY en .env');
	}

	const verbose = options?.verbose ?? false;
	const path = `/models/${model}:generateContent`;

	if (verbose) {
		photoLog(`═══ generateContent modelo: ${model} ═══`);
		photoLog('Body (sin base64 completo):', sanitizeGeminiBodyForLog(body));
	}

	const response = await geminiFetch(
		path,
		apiKey,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		},
		{ verbose, label: options?.label ?? `POST ${path}` },
	);

	const rawText = await response.text();
	let payload: GeminiGenerateResponse;

	try {
		payload = JSON.parse(rawText) as GeminiGenerateResponse;
	} catch {
		if (verbose) {
			photoLog('✗ JSON inválido en respuesta', rawText.slice(0, 500));
		}

		throw new Error(`Respuesta no JSON (${response.status}): ${rawText.slice(0, 200)}`);
	}

	if (verbose) {
		photoLog('Payload parseado:', payload);
		photoLog('Texto extraído:', extractGeminiText(payload) ?? '(null)');
	}

	if (!response.ok) {
		if (verbose) {
			photoLog('✗ ERROR HTTP', { status: response.status, error: payload.error });
		}

		throw new Error(parseGeminiError(payload, response.status));
	}

	return payload;
}

export async function geminiGenerateText(
	userText: string,
	systemInstruction: string,
): Promise<string> {
	getGeminiApiKey();

	const models = await listGeminiModels();
	console.log('[Gemini] modelos a intentar:', models);
	let lastError = 'Gemini no respondió.';

	for (const model of models) {
		try {
			const payload = await geminiGenerateContent(model, {
				systemInstruction: {
					parts: [{ text: systemInstruction }],
				},
				contents: [
					{
						role: 'user',
						parts: [{ text: userText }],
					},
				],
				generationConfig: {
					maxOutputTokens: 512,
					temperature: 0.7,
				},
			});

			const text = extractGeminiText(payload);
			if (text) {
				return text;
			}

			lastError = `Sin texto (${model})`;
		} catch (error) {
			lastError = error instanceof Error ? error.message : String(error);
		}
	}

	throw new Error(lastError);
}
