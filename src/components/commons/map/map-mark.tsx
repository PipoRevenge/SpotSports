import { View } from '@components/ui/view';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';
import { MapMarkerProps, Marker } from 'react-native-maps';

interface MapMarkProps extends Omit<MapMarkerProps, 'coordinate' | 'icon'> {
  latitude: number;
  longitude: number;
  color?: string;
  size?: number;
  onPress?: () => void;
  customIcon?: {
    name: keyof typeof MaterialIcons.glyphMap;
    IconComponent?: typeof MaterialIcons;
  };
}

const MapMark: React.FC<MapMarkProps> = ({
  latitude,
  longitude,
  color = '#FF4B4B',
  size = 30,
  onPress,
  customIcon = {
    name: 'location-on',
    IconComponent: MaterialIcons,
  },
  ...props
}) => {
  return (
    <Marker
      coordinate={{
        latitude,
        longitude,
      }}
      onPress={onPress}
      {...props}
    >
      <View style={styles.markerContainer}>
        <View
          style={[
            styles.marker,
            {
              backgroundColor: color,
              width: size,
              height: size,
            },
          ]}
        >
          {customIcon.IconComponent ? (
            <customIcon.IconComponent
              name={customIcon.name}
              size={size * 0.6}
              color="white"
              style={styles.icon}
            />
          ) : (
            <MaterialIcons
              name="location-on"
              size={size * 0.6}
              color="white"
              style={styles.icon}
            />
          )}
        </View>
        <View
          style={[
            styles.shadow,
            {
              width: size * 0.8,
              height: size * 0.3,
            },
          ]}
        />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  shadow: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 50,
    marginTop: 3,
  },
});

export default MapMark;
