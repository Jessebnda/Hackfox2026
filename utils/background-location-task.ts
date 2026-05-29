import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { BACKGROUND_LOCATION_TASK } from '../services/locationTracking.service';
import { darInstruccion, isSpeechInitialized } from '../services/speech.service';
import {
  verificarProximidadSiguientePunto,
  obtenerInstruccionActual,
} from '../services/geofencing.service';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundTask] Error de GPS:', error.message);
    return;
  }

  if (!data) {
    console.warn('[BackgroundTask] Sin datos de ubicación.');
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  const ubicacionActual = locations[locations.length - 1];

  if (!ubicacionActual) return;

  const { latitude, longitude } = ubicacionActual.coords;
  console.log(`[BackgroundTask] Nueva ubicación: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);

  try {
    const estaCerca = await verificarProximidadSiguientePunto(latitude, longitude);

    if (estaCerca) {
      const instruccion = obtenerInstruccionActual();

      if (instruccion && isSpeechInitialized()) {
        await darInstruccion(instruccion);
        console.log(`[BackgroundTask] Instrucción disparada: "${instruccion}"`);
      }
    }

  } catch (err) {
    console.error('[BackgroundTask] Error procesando ubicación:', err);
  }
});