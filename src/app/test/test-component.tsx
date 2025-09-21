import React from "react";


import MapMark from "@/src/components/commons/map/map-mark";
import CustomMapView from "@/src/components/commons/map/map-view";


export const TestComponent = () => {
  return (
  <CustomMapView
      initialRegion={{
        latitude: 40.4168,
        longitude: -3.7038,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      <MapMark
        latitude={40.4168}
        longitude={-3.7038}
        color="#FF4B4B"
        size={30}
        onPress={() => console.log('Marcador presionado')}
      />
    </CustomMapView>
  );

};
export default TestComponent;
