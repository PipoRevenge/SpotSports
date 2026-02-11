import { SpotCategory } from "@/src/entities/user/model/spot-collection";
import { CheckCircle, Heart, Target } from "lucide-react-native";

/**
 * Configuración de categorías de spots
 * Define las categorías disponibles con sus metadatos visuales
 */
export const SPOT_CATEGORIES: {
  type: SpotCategory;
  label: string;
  icon: any;
  color: string;
}[] = [
  { 
    type: "favorites", 
    label: "Favorites", 
    icon: Heart, 
    color: "#ff6b6b" 
  },
  { 
    type: "visited", 
    label: "Visited", 
    icon: CheckCircle, 
    color: "#4ecdc4" 
  },
  { 
    type: "bucketList", 
    label: "Want to Visit", 
    icon: Target, 
    color: "#45b7d1" 
  },
];
