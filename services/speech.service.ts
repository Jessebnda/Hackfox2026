import * as Speech from 'expo-speech';

const SPEECH_OPTIONS: Speech.SpeechOptions = {
  language: 'es-MX',
  pitch: 1.0,
  rate: 0.9,
};

let isSpeechReady = false;
let vozHabilitada = true;

export async function initSpeech(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();

    if (voices.length === 0) {
      console.warn('[SpeechService] No hay voces disponibles en este dispositivo.');
      isSpeechReady = false;
      return false;
    }

    const vozEspanol = voices.find(
      (v) => v.language === 'es-MX' || v.language.startsWith('es')
    );

    if (vozEspanol) {
      SPEECH_OPTIONS.voice = vozEspanol.identifier;
      console.log(`[SpeechService] Voz seleccionada: ${vozEspanol.name} (${vozEspanol.language})`);
    } else {
      console.warn('[SpeechService] Voz en español no encontrada, usando voz por defecto.');
    }

    isSpeechReady = true;
    console.log('[SpeechService] Servicio iniciado correctamente ✅');
    return true;

  } catch (error) {
    console.error('[SpeechService] Error al inicializar:', error);
    isSpeechReady = false;
    return false;
  }
}

export function setVozHabilitada(habilitada: boolean): void {
  vozHabilitada = habilitada;
}

export async function darInstruccion(texto: string): Promise<void> {
  if (!vozHabilitada) {
    console.log('[SpeechService] Voz desactivada, instrucción omitida.');
    return;
  }

  if (!texto.trim()) {
    console.warn('[SpeechService] Se recibió un texto vacío, ignorando.');
    return;
  }

  try {
    const hablando = await Speech.isSpeakingAsync();
    if (hablando) {
      await Speech.stop();
    }

    Speech.speak(texto, {
      ...SPEECH_OPTIONS,
      onStart: () => {
        console.log(`[SpeechService] Hablando: "${texto}"`);
      },
      onDone: () => {
        console.log('[SpeechService] Instrucción completada.');
      },
      onError: (error) => {
        console.error('[SpeechService] Error al hablar:', error);
      },
    });

  } catch (error) {
    console.error('[SpeechService] Error en darInstruccion:', error);
  }
}

export async function stopSpeech(): Promise<void> {
  try {
    const hablando = await Speech.isSpeakingAsync();
    if (hablando) {
      await Speech.stop();
      console.log('[SpeechService] Audio detenido ✅');
    }
    isSpeechReady = false;
  } catch (error) {
    console.error('[SpeechService] Error al detener el audio:', error);
  }
}

export function isSpeechInitialized(): boolean {
  return isSpeechReady;
}