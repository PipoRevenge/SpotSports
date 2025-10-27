import { MapPin } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

interface SelectionMarkerProps {
  latitude: number;
  longitude: number;
  color?: string;
  size?: number;
}

/**
 * Marcador para ubicaciones seleccionadas
 * Muestra un pin estilo mapa con diseño claro y profesional
 */
const SelectionMarker: React.FC<SelectionMarkerProps> = ({
  latitude,
  longitude,
  color = '#FF3B30',
  size = 32,
}) => {
  const pinTipHeight = size * 0.3;
  const totalHeight = size ;
  const borderWidth = Math.max(2.5, size * 0.07); // Borde adaptable
  const iconSize = size * 0.5; // Icono ocupa 50% del pin
  const strokeWidth = Math.max(1.5, size * 0.05); // Grosor del trazo adaptable
  
  return (
    <Marker
      coordinate={{
        latitude,
        longitude,
      }}
     
      centerOffset={{ x: 0, y: 0}}
    >
      <View style={[styles.container, { width: size , height: totalHeight }]}>
        {/* Pin principal */}
        <View
          style={[
            styles.pin,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              borderWidth: borderWidth,
            },
          ]}
        >
          {/* Icono de MapPin */}
          <MapPin
            size={iconSize}
            color="white"
            fill="white"
            strokeWidth={strokeWidth}
          />
        </View>
        
        {/* Punta del pin */}
        <View
          style={[
            styles.pinTip,
            {
              borderLeftWidth: size * 0.28,
              borderRightWidth: size * 0.28,
              borderTopWidth: pinTipHeight,
              borderTopColor: color,
              marginTop: -3,
            },
          ]}
        />
        
        {/* Sombra */}
        <View
          style={[
            styles.shadow,
            {
              width: size * 0.5,
              height: size * 0.12,
            },
          ]}
        />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pin: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 8,
    borderColor: '#FFFFFF',
  },
  pinTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  shadow: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 50,
    marginTop: 5,
  },
});

export default SelectionMarker;
