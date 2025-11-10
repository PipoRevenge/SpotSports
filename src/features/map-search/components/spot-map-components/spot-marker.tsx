import { MapMarker } from "@/src/components/commons/map";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Spot } from "../../../../entities/spot/model/spot";

// ==================== TIPOS ====================

interface SpotMarkerProps {
  spot: Spot;
  isSelected: boolean;
  onPress: () => void;
  onCalloutPress: () => void;
  getSportName?: (sportId: string) => string;
}

interface SpotCalloutContentProps {
  spot: Spot;
  getSportName?: (sportId: string) => string;
  onViewDetails?: () => void;
}

// ==================== COMPONENTES INTERNOS ====================

/**
 * Contenido del callout de un spot (versión solo lectura)
 * Muestra solo información esencial: nombre y rating - sin interacción
 * 
 * @internal - Usado internamente por SpotMarker
 */
const SpotCalloutContent: React.FC<SpotCalloutContentProps> = ({
  spot,
  getSportName,
  onViewDetails,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.amount}>
          <Text style={styles.calloutName} numberOfLines={2}>
            {spot.details.name || "Sin nombre"}
          </Text>

          <View style={styles.calloutInfoRow}>
            {spot.details.overallRating !== undefined && (
              <Text style={styles.ratingText}>
                ⭐ {spot.details.overallRating.toFixed(1)}
              </Text>
            )}

            {spot.metadata.isVerified && (
              <Text style={styles.verifiedText}>
                ✓ Verificado
              </Text>
            )}
          </View>
          
          <Text style={styles.tapHint}>Toca para ver más</Text>
        </View>
      </View>
      <View style={styles.arrowBorder} />
      <View style={styles.arrow} />
    </View>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

/**
 * Marcador completo de Spot para el mapa
 * 
 * Usa MapMarker abstrayendo react-native-maps con un callout informativo simple
 * 
 * Características:
 * - Marcador genérico de MapMarker con icono por defecto
 * - Callout informativo (solo lectura, sin interacción)
 * - Colores dinámicos para diferentes estados
 * 
 * @example
 * ```tsx
 * <SpotMarker
 *   spot={spot}
 *   isSelected={selectedId === spot.id}
 *   onPress={() => setSelected(spot.id)}
 *   onCalloutPress={() => {}} // No se usa, callout es solo informativo
 *   getSportName={getSportName}
 * />
 * ```
 */
export const SpotMarker: React.FC<SpotMarkerProps> = ({
  spot,
  isSelected,
  onPress,
  onCalloutPress,
  getSportName,
}) => {
  const getPinColor = () => {
    if (isSelected) return "#fbbf24";
    if (spot.metadata.isVerified) return "#10b981";
    return "#3b82f6";
  };

  return (
    <MapMarker
      coordinate={{
        latitude: spot.details.location.latitude,
        longitude: spot.details.location.longitude,
      }}
      data={spot}
      isSelected={isSelected}
      color={getPinColor()}
      size={30}
      onPress={onPress}
      onCalloutPress={onCalloutPress}
      renderCallout={(spot) => (
        <SpotCalloutContent spot={spot} getSportName={getSportName} />
      )}
      calloutConfig={{
        showDefault: false,
        tooltip: false,
      }}
    />
  );
};

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  calloutWrapper: {
    backgroundColor: "transparent",
  },
  container: {
    flexDirection: 'column',
    alignSelf: 'flex-start',
  },
  bubble: {
    minWidth: 200,
    maxWidth: 260,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  amount: {
    flex: 1,
  },
  arrow: {
    backgroundColor: 'transparent',
    borderWidth: 12,
    borderColor: 'transparent',
    borderTopColor: '#ffffff',
    alignSelf: 'center',
    marginTop: -24,
  },
  arrowBorder: {
    backgroundColor: 'transparent',
    borderWidth: 12,
    borderColor: 'transparent',
    borderTopColor: '#e5e7eb',
    alignSelf: 'center',
    marginTop: -0.5,
  },
  calloutName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#111827",
    marginBottom: 4,
  },
  calloutInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#16a34a",
  },
  tapHint: {
    fontSize: 11,
    color: "#6b7280",
    fontStyle: "italic",
  },
});

