import { View } from "@components/ui/view";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { View as RNView, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { MapCallout } from "./map-callout";
import type { CustomMarkerProps } from "./types";

/**
 * Componente de marcador genérico para mapas
 * 
 * Abstrae el Marker de react-native-maps y proporciona:
 * - Renderizado personalizado del marcador
 * - Callout personalizado mediante render props
 * - Icono por defecto personalizable
 * - Estados de selección
 * 
 * Responsabilidades:
 * - Mostrar un marcador en el mapa
 * - Soportar contenido personalizado
 * - Manejar callouts personalizados
 * - Gestionar estados visuales (seleccionado/no seleccionado)
 * 
 * @example
 * ```tsx
 * // Marcador simple con icono
 * <MapMarker
 *   coordinate={{ latitude: 40.4168, longitude: -3.7038 }}
 *   data={spot}
 *   color="#ef4444"
 *   onPress={() => console.log('Marker pressed')}
 * />
 * 
 * // Marcador con contenido personalizado
 * <MapMarker
 *   coordinate={{ latitude: 40.4168, longitude: -3.7038 }}
 *   data={spot}
 *   isSelected={selectedId === spot.id}
 *   renderMarkerContent={(spot, isSelected) => (
 *     <View className={`p-2 rounded-full ${isSelected ? 'bg-green-500' : 'bg-red-500'}`}>
 *       <Text>🏀</Text>
 *     </View>
 *   )}
 *   renderCallout={(spot) => (
 *     <View className="bg-white p-3 rounded-lg">
 *       <Text>{spot.name}</Text>
 *     </View>
 *   )}
 * />
 * ```
 */
export const MapMarker = <T,>({
  coordinate,
  data,
  color = "#FF4B4B",
  size = 30,
  onPress,
  onCalloutPress,
  isSelected = false,
  renderMarkerContent,
  renderCallout,
  calloutConfig = {
    showDefault: false,
    tooltip: true,
  },
  title,
  description,
  ...props
}: CustomMarkerProps<T>): React.ReactElement => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const handleCalloutPress = () => {
    if (onCalloutPress) {
      onCalloutPress();
    }
  };

  // Determinar el color del marcador basado en el estado de selección
  const markerColor = isSelected && color !== "#FF4B4B" 
    ? "#22c55e" // Verde si está seleccionado (puede ser configurable)
    : color;

  return (
    <Marker
      coordinate={coordinate}
      onPress={handlePress}
      title={!renderCallout && calloutConfig.showDefault ? title : undefined}
      description={!renderCallout && calloutConfig.showDefault ? description : undefined}
      {...props}
    >
      {/* Contenido personalizado del marcador o icono por defecto */}
      {renderMarkerContent ? (
        renderMarkerContent(data, isSelected)
      ) : (
        <RNView style={styles.markerContainer}>
          <RNView
            style={[
              styles.marker,
              {
                backgroundColor: markerColor,
                width: size,
                height: size,
              },
            ]}
          >
            <MaterialIcons
              name="location-on"
              size={size * 0.6}
              color="white"
              style={styles.icon}
            />
          </RNView>
          <RNView
            style={[
              styles.shadow,
              {
                width: size * 0.8,
                height: size * 0.3,
              },
            ]}
          />
        </RNView>
      )}

      {/* Callout personalizado */}
      {renderCallout && (
        <MapCallout
          data={data}
          tooltip={calloutConfig.tooltip}
          onPress={onCalloutPress ? handleCalloutPress : undefined}
          renderContent={(item) => <>{renderCallout(item)}</>}
        />
      )}

      {/* Callout vacío para evitar el callout por defecto si no se especifica */}
      {!renderCallout && !calloutConfig.showDefault && (
        <MapCallout
          data={data}
          tooltip={true}
          renderContent={() => <View />}
        />
      )}
    </Marker>
  );
};

MapMarker.displayName = "MapMarker";

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  shadow: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 50,
    marginTop: 3,
  },
});
