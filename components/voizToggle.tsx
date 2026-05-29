import React from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { useVozNavegacion } from '../hooks/useVoizNavigation';

export default function VozToggle() {
  const { vozActivada, toggleVoz, cargando } = useVozNavegacion();

  return (
    <View style={styles.contenedor}>
      <View style={styles.izquierda}>
        <Text style={styles.icono}>{vozActivada ? '🔊' : '🔇'}</Text>
        <View>
          <Text style={styles.titulo}>Instrucciones de voz</Text>
          <Text style={styles.subtitulo}>
            {vozActivada ? 'Activa — escucharás las instrucciones' : 'Desactivada'}
          </Text>
        </View>
      </View>

      {cargando ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Switch
          value={vozActivada}
          onValueChange={toggleVoz}
          trackColor={{ false: '#D1D1D6', true: '#34C759' }}
          thumbColor="#FFFFFF"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  izquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icono: {
    fontSize: 24,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  subtitulo: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});