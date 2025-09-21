import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import MapMark from './map-mark';
import CustomMapView from './map-view';

interface PointPickerProps {
  initialRegion?: Region;
  onLocationSelect?: (location: { latitude: number; longitude: number }) => void;
  containerStyle?: ViewStyle;
  markerColor?: string;
  markerSize?: number;
}

const PointPicker: React.FC<PointPickerProps> = ({
  initialRegion,
  onLocationSelect,
  containerStyle,
  markerColor = '#FF4B4B',
  markerSize = 40,
}) => {
  const mapRef = useRef<MapView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (initialRegion) {
      setSelectedLocation({
        latitude: initialRegion.latitude,
        longitude: initialRegion.longitude,
      });
    }
  }, [initialRegion]);

  const handleRegionChange = (region: Region) => {
    setSelectedLocation({
      latitude: region.latitude,
      longitude: region.longitude,
    });

    if (onLocationSelect) {
      onLocationSelect({
        latitude: region.latitude,
        longitude: region.longitude,
      });
    }
  };

  return (
    <CustomMapView
      ref={mapRef}
      initialRegion={initialRegion}
      onRegionChangeComplete={handleRegionChange}
      containerStyle={{ ...styles.container, ...containerStyle }}
    >
      {selectedLocation && (
        <MapMark
          latitude={selectedLocation.latitude}
          longitude={selectedLocation.longitude}
          color={markerColor}
          size={markerSize}
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedLocation({ latitude, longitude });
            if (onLocationSelect) {
              onLocationSelect({ latitude, longitude });
            }
          }}
        />
      )}
    </CustomMapView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
  },
});

export default PointPicker;
