import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { darInstruccion, isSpeechInitialized } from './speech.service';
import { verificarProximidadSiguientePunto, obtenerInstruccionActual } from './geofencing.service';

let foregroundSubscription: Location.LocationSubscription | null = null;

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

// Este nombre debe ser EXACTAMENTE el mismo que uses en background-location-task.ts
export const BACKGROUND_LOCATION_TASK = 'HACKFOX_BACKGROUND_LOCATION';

// Configuración del rastreo: cada cuánto se actualiza el GPS
const TRACKING_CONFIG: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.High,       // Alta precisión (GPS real, no WiFi/cell)
  distanceInterval: 5,                    // Actualiza cada 5 metros recorridos
  timeInterval: 3000,                     // O cada 3 segundos (lo que ocurra primero)
  showsBackgroundLocationIndicator: true, // iOS: muestra la barra azul "usando ubicación"
  pausesUpdatesAutomatically: false,      // No pausar aunque el usuario no se mueva
  activityType: Location.ActivityType.Fitness, // Optimizado para caminar
};

// ─────────────────────────────────────────────
// startBackgroundTracking()
// Solicita permisos y arranca el rastreo GPS
// en segundo plano vía TaskManager.
// Llama esto cuando el usuario inicia la ruta.
// ─────────────────────────────────────────────

export async function startBackgroundTracking(): Promise<boolean> {
  try {
    // 1. Verificar permiso de ubicación en primer plano
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.warn('[LocationTracking] Permiso de ubicación en primer plano denegado.');
      return false;
    }

    // 2-4. Intentar rastreo en segundo plano; si falla (ej. Expo Go en iOS), usar foreground
    try {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        throw new Error('Permiso de background denegado');
      }

      const tareaActiva = await isTrackingActive();
      if (tareaActiva) {
        console.log('[LocationTracking] El rastreo ya estaba activo, no se inicia de nuevo.');
        return true;
      }

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, TRACKING_CONFIG);
      console.log('[LocationTracking] Rastreo en segundo plano iniciado ✅');

    } catch (bgError) {
      console.warn('[LocationTracking] Background no disponible, usando foreground:', bgError);

      if (foregroundSubscription) {
        console.log('[LocationTracking] Rastreo en primer plano ya activo.');
        return true;
      }

      foregroundSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
        async (ubicacion) => {
          const { latitude, longitude } = ubicacion.coords;
          try {
            const estaCerca = await verificarProximidadSiguientePunto(latitude, longitude);
            if (estaCerca) {
              const instruccion = obtenerInstruccionActual();
              if (instruccion && isSpeechInitialized()) {
                await darInstruccion(instruccion);
              }
            }
          } catch (err) {
            console.error('[LocationTracking] Error procesando ubicación (foreground):', err);
          }
        }
      );
      console.log('[LocationTracking] Rastreo en primer plano iniciado ✅');
    }

    return true;

  } catch (error) {
    console.error('[LocationTracking] Error al iniciar el rastreo:', error);
    return false;
  }
}

// ─────────────────────────────────────────────
// stopBackgroundTracking()
// Detiene el rastreo GPS en segundo plano.
// Llama esto cuando el usuario termina/cancela la ruta.
// ─────────────────────────────────────────────

export async function stopBackgroundTracking(): Promise<void> {
  try {
    const tareaActiva = await isTrackingActive();

    if (!tareaActiva) {
      console.log('[LocationTracking] No había rastreo activo.');
      return;
    }

    if (foregroundSubscription) {
      foregroundSubscription.remove();
      foregroundSubscription = null;
      console.log('[LocationTracking] Rastreo en primer plano detenido ✅');
    } else {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[LocationTracking] Rastreo en segundo plano detenido ✅');
    }

  } catch (error) {
    console.error('[LocationTracking] Error al detener el rastreo:', error);
  }
}

// ─────────────────────────────────────────────
// isTrackingActive()
// Verifica si el TaskManager ya tiene la tarea corriendo.
// Útil para evitar iniciar dos veces o para mostrar
// estado en la UI ("Navegando..." / "En pausa").
// ─────────────────────────────────────────────

export async function isTrackingActive(): Promise<boolean> {
  if (foregroundSubscription) return true;
  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// getCurrentLocation()
// Obtiene la ubicación actual una sola vez (snapshot).
// Útil para centrar el mapa al iniciar la ruta,
// o para la posición inicial del geofencing.
// ─────────────────────────────────────────────

export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[LocationTracking] Sin permiso para obtener ubicación.');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return location;

  } catch (error) {
    console.error('[LocationTracking] Error al obtener ubicación actual:', error);
    return null;
  }
}