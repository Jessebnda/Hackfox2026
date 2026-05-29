export interface PuntoRuta {
  latitude: number;
  longitude: number;
  instruccion: string;
  radio?: number;
}

let rutaActual: PuntoRuta[] = [];
let indicePuntoActual: number = 0;
let instruccionPendiente: string | null = null;

const RADIO_DEFAULT_METROS = 15;

export function cargarRuta(puntos: PuntoRuta[]): void {
  if (!puntos || puntos.length === 0) {
    console.warn('[Geofencing] Se intentó cargar una ruta vacía.');
    return;
  }

  rutaActual = puntos;
  indicePuntoActual = 0;
  instruccionPendiente = null;

  console.log(`[Geofencing] Ruta cargada con ${puntos.length} puntos ✅`);
}

export function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const RADIO_TIERRA_METROS = 6_371_000;

  const dLat = toRadianes(lat2 - lat1);
  const dLon = toRadianes(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadianes(lat1)) *
      Math.cos(toRadianes(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RADIO_TIERRA_METROS * c; // Resultado en metros
}

function toRadianes(grados: number): number {
  return grados * (Math.PI / 180);
}

export async function verificarProximidadSiguientePunto(
  latUsuario: number,
  lonUsuario: number
): Promise<boolean> {
  if (rutaActual.length === 0 || indicePuntoActual >= rutaActual.length) {
    return false;
  }

  const puntoActual = rutaActual[indicePuntoActual];
  const radio = puntoActual.radio ?? RADIO_DEFAULT_METROS;

  const distancia = calcularDistancia(
    latUsuario,
    lonUsuario,
    puntoActual.latitude,
    puntoActual.longitude
  );

  console.log(
    `[Geofencing] Distancia al punto ${indicePuntoActual}: ${distancia.toFixed(1)}m (radio: ${radio}m)`
  );

  if (distancia <= radio) {
    instruccionPendiente = puntoActual.instruccion;

    indicePuntoActual += 1;

    const esUltimoPunto = indicePuntoActual >= rutaActual.length;
    if (esUltimoPunto) {
      console.log('[Geofencing] ¡Último punto alcanzado! Ruta completada 🎉');
    }

    return true;
  }

  return false;
}

export function obtenerInstruccionActual(): string | null {
  const instruccion = instruccionPendiente;
  instruccionPendiente = null; // Limpia para no repetir
  return instruccion;
}

export function getRutaInfo(): {
  totalPuntos: number;
  puntoActual: number;
  rutaCompletada: boolean;
} {
  return {
    totalPuntos: rutaActual.length,
    puntoActual: indicePuntoActual,
    rutaCompletada: indicePuntoActual >= rutaActual.length && rutaActual.length > 0,
  };
}

export function resetRuta(): void {
  rutaActual = [];
  indicePuntoActual = 0;
  instruccionPendiente = null;
  console.log('[Geofencing] Ruta reseteada ✅');
}