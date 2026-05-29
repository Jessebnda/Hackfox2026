import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSpeech, stopSpeech, setVozHabilitada } from '../services/speech.service';

const STORAGE_KEY = 'hackfox_voz_activada';


export function useVozNavegacion() {
  const [vozActivada, setVozActivada] = useState<boolean>(true);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    cargarPreferencia();
  }, []);

  const cargarPreferencia = async () => {
    try {
      const valorGuardado = await AsyncStorage.getItem(STORAGE_KEY);

      if (valorGuardado !== null) {
        const activada = valorGuardado === 'true';
        setVozActivada(activada);
        console.log(`[useVozNavegacion] Preferencia cargada: voz ${activada ? 'ON' : 'OFF'}`);
      }

    } catch (error) {
      console.error('[useVozNavegacion] Error leyendo AsyncStorage:', error);
    } finally {
      setCargando(false);
    }
  };

  const toggleVoz = useCallback(async () => {
    const nuevoValor = !vozActivada;

    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(nuevoValor));

      setVozActivada(nuevoValor);

      setVozHabilitada(nuevoValor);

      if (nuevoValor) {
        await initSpeech();
        console.log('[useVozNavegacion] Voz ACTIVADA ✅');
      } else {
        await stopSpeech();
        console.log('[useVozNavegacion] Voz DESACTIVADA 🔇');
      }

    } catch (error) {
      console.error('[useVozNavegacion] Error guardando preferencia:', error);
    }
  }, [vozActivada]);

  const setVoz = useCallback(async (activada: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(activada));
      setVozActivada(activada);
      setVozHabilitada(activada);

      if (activada) {
        await initSpeech();
      } else {
        await stopSpeech();
      }
    } catch (error) {
      console.error('[useVozNavegacion] Error en setVoz:', error);
    }
  }, []);

  return {
    vozActivada,
    toggleVoz,
    setVoz,
    cargando, 
  };
}