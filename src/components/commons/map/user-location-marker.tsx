import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

interface UserLocationMarkerProps {
  latitude: number;
  longitude: number;
  size?: number;
}

/**
 * Marcador especial para la ubicación del usuario
 * Muestra un punto azul con un anillo pulsante para indicar "tú estás aquí"
 */
const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  latitude,
  longitude,
  size = 24,
}) => {
  const containerSize = size + 8;
  const ringSize = size * 0.9;
  const dotSize = size * 0.35;
  const borderWidth = Math.max(2, size * 0.06);
  
  return (
    <Marker
      coordinate={{
        latitude,
        longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
    >
      <View style={[styles.container, { width: containerSize, height: containerSize }]}>
        {/* Anillo exterior */}
        <View 
          style={[
            styles.outerRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderWidth: Math.max(2, size * 0.05),
            }
          ]} 
        />
        {/* Punto central azul */}
        <View 
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              borderWidth: borderWidth,
            }
          ]} 
        />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderColor: '#007AFF',
  },
  dot: {
    backgroundColor: '#007AFF',
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default UserLocationMarker;
