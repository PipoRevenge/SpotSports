import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import MapView, { MapViewProps, PROVIDER_GOOGLE, Region } from 'react-native-maps';

interface CustomMapViewProps extends Omit<MapViewProps, 'style'> {
  containerStyle?: ViewStyle;
  mapStyle?: ViewStyle;
  initialRegion?: Region;
  children?: React.ReactNode;
}

const CustomMapView = React.forwardRef<MapView, CustomMapViewProps>((props, ref) => {
  const {
    containerStyle,
    mapStyle,
    initialRegion = {
      latitude: 40.4168,
      longitude: -3.7038,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
    children,
    ...otherProps
  } = props;

  return (
    <View style={[styles.container, containerStyle]}>
      <MapView
        ref={ref}
        provider={PROVIDER_GOOGLE}
        style={[styles.map, mapStyle]}
        initialRegion={initialRegion}
        customMapStyle={customMapStyle}
        {...otherProps}
      >
        {children}
      </MapView>
    </View>
  );
});

CustomMapView.displayName = 'CustomMapView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

// Estilo personalizado del mapa (tema oscuro)
const customMapStyle = [
  {
    elementType: 'geometry',
    stylers: [
      {
        color: '#212121',
      },
    ],
  },
  {
    elementType: 'labels.icon',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#757575',
      },
    ],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#212121',
      },
    ],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [
      {
        color: '#757575',
      },
    ],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#757575',
      },
    ],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      {
        color: '#181818',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#2c2c2c',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#8a8a8a',
      },
    ],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [
      {
        color: '#373737',
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [
      {
        color: '#3c3c3c',
      },
    ],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [
      {
        color: '#4e4e4e',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#000000',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#3d3d3d',
      },
    ],
  },
];

export default CustomMapView;
