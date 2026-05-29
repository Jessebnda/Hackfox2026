import { useState, useCallback } from 'react';
import { fetchWalkingRoute, LatLng } from '../services/openRouteService';
import { cargarRuta, resetRuta, PuntoRuta } from '../services/geofencing.service';
import { initSpeech, stopSpeech } from '../services/speech.service';
import { startBackgroundTracking, stopBackgroundTracking } from '../services/locationTracking.service';

type EstadoNavegacion = 'idle' | 'cargando' | 'navegando' | 'error';

function transformarCoordenadas(coordinates: LatLng[]): PuntoRuta[] {
  const puntos: PuntoRuta[] = [];

  coordinates.forEach((coord, index) => {
    const esUltimo = index === coordinates.length - 1;
    const esPuntoDeControl = index % 5 === 0; // Cada 5 puntos

    if (esPuntoDeControl || esUltimo) {
      puntos.push({
        latitude: coord.latitude,
        longitude: coord.longitude,
        instruccion: esUltimo
          ? 'Has llegado a tu destino.'
          : `Continúa por la ruta.`,
        radio: esUltimo ? 10 : 15,
      });
    }
  });

  return puntos;
}

export function useNavegacion() {
  const [estado, setEstado] = useState<EstadoNavegacion>('idle');
  const [error, setError] = useState<string | null>(null);
  const [distanciaMetros, setDistanciaMetros] = useState<number>(0);
  const [duracionSegundos, setDuracionSegundos] = useState<number>(0);

  const iniciarNavegacion = useCallback(async (origen: LatLng, destino: LatLng) => {
    try {
      setEstado('cargando');
      setError(null);

      console.log('[useNavegacion] Obteniendo ruta...');
      const ruta = await fetchWalkingRoute(origen, destino);

      if (!ruta.coordinates.length) {
        throw new Error('La ruta no tiene coordenadas.');
      }

      const puntos = transformarCoordenadas(ruta.coordinates);
      console.log(`[useNavegacion] Ruta transformada: ${puntos.length} puntos de control.`);

      cargarRuta(puntos);

      const vozLista = await initSpeech();
      if (!vozLista) {
        console.warn('[useNavegacion] Motor de voz no disponible, continuando sin audio.');
      }

      const trackingIniciado = await startBackgroundTracking();
      if (!trackingIniciado) {
        throw new Error('No se pudo iniciar el rastreo GPS. Verifica los permisos de ubicación.');
      }

      setDistanciaMetros(ruta.distanceMeters);
      setDuracionSegundos(ruta.durationSeconds);
      setEstado('navegando');

      console.log('[useNavegacion] Navegación iniciada ✅');

    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[useNavegacion] Error al iniciar navegación:', mensaje);
      setError(mensaje);
      setEstado('error');

      await stopBackgroundTracking();
      await stopSpeech();
      resetRuta();
    }
  }, []);

  const cancelarNavegacion = useCallback(async () => {
    try {
      await stopBackgroundTracking();
      await stopSpeech();
      resetRuta();

      setEstado('idle');
      setError(null);
      setDistanciaMetros(0);
      setDuracionSegundos(0);

      console.log('[useNavegacion] Navegación cancelada ✅');

    } catch (err) {
      console.error('[useNavegacion] Error al cancelar:', err);
    }
  }, []);

  const distanciaTexto = distanciaMetros >= 1000
    ? `${(distanciaMetros / 1000).toFixed(1)} km`
    : `${Math.round(distanciaMetros)} m`;

  const duracionTexto = duracionSegundos >= 3600
    ? `${Math.floor(duracionSegundos / 3600)}h ${Math.floor((duracionSegundos % 3600) / 60)} min`
    : `${Math.floor(duracionSegundos / 60)} min`;

  return {
    estado,
    estaNavegando: estado === 'navegando',
    estaCargando: estado === 'cargando',
    error,
    distanciaTexto,
    duracionTexto,
    iniciarNavegacion,
    cancelarNavegacion,
  };
}