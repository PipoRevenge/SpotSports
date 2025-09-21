import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

interface RatingStarProps {
  rating: number;
  starSize?: number | 'responsive';
  showRatingValue?: boolean;
  maxStars?: number;
  textStyle?: object;
  containerWidth?: number;
}

export const RatingStarComponent: React.FC<RatingStarProps> = ({ 
  rating, 
  starSize = 'responsive',
  showRatingValue = true,
  maxStars = 5,
  textStyle = {},
  containerWidth
}) => {
  const { width: screenWidth } = useWindowDimensions();
  
  // Calcular el tamaño dinámico de las estrellas
  const calculateStarSize = () => {
    if (starSize === 'responsive') {
      // Si se proporciona un containerWidth, úsalo, sino usa el ancho de la pantalla
      const baseWidth = containerWidth || screenWidth;
      // Calcula el tamaño basado en el espacio disponible
      // Considera el espacio para las estrellas y márgenes
      const availableWidth = baseWidth * 0.20; // Usa solo el 20% del ancho disponible
      return Math.min(Math.max(availableWidth / maxStars, 12), 30); // Mínimo 12, máximo 30
    }
    return typeof starSize === 'number' ? starSize : 20;
  };

  const dynamicStarSize = calculateStarSize();
  
  // Ensure rating is within bounds (0 to maxStars)
  const boundedRating = Math.max(0, Math.min(rating, maxStars));
  
  // Format rating to display one decimal place if it's not a whole number
  const formattedRating = Number.isInteger(boundedRating) 
    ? boundedRating.toString() 
    : boundedRating.toFixed(1);

  return (
    <View style={[styles.container, { width: containerWidth }]}>
      {showRatingValue && (
        <Text style={[styles.ratingText, { fontSize: dynamicStarSize * 0.8 }, textStyle]}>
          {formattedRating}
        </Text>
      )}
      <View style={styles.starsContainer}>
        {Array.from({ length: maxStars }).map((_, index) => {
          // Determine star type based on the rating
          const isFull = index < Math.floor(boundedRating);
          const isHalf = !isFull && index < Math.ceil(boundedRating) && (boundedRating % 1) >= 0.5;
          
          return (
            <FontAwesome
              key={`star-${index}`}
              name={isFull ? 'star' : isHalf ? 'star-half-o' : 'star-o'}
              size={dynamicStarSize}
              color="#FFD700" // Gold color for stars
              style={styles.star}
            />
          );
        })}
      </View>
      
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'auto'
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginHorizontal: 1,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
  }
});

export default RatingStarComponent;