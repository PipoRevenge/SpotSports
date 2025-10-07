import MapMark from "@/src/components/commons/map/map-mark";
import CustomMapView from "@/src/components/commons/map/map-view";
import { GeoPoint } from "@/src/types/geopoint";
import React from "react";
import { View } from "react-native";

interface SpotMapPointProps {
  location: GeoPoint;
}

export const SpotMapPoint: React.FC<SpotMapPointProps> = ({ location }) => (
  <View className="w-full h-48 rounded-lg overflow-hidden my-4">
    <CustomMapView
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <MapMark
        latitude={location.latitude}
        longitude={location.longitude}
        color="#FF4B4B"
        size={35}
      />
    </CustomMapView>
  </View>
);