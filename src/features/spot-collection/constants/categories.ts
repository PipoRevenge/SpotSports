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
    type: "Favorites", 
    label: "Favoritos", 
    icon: Heart, 
    color: "#ff6b6b" 
  },
  { 
    type: "Visited", 
    label: "Visitados", 
    icon: CheckCircle, 
    color: "#4ecdc4" 
  },
  { 
    type: "WantToVisit", 
    label: "Quiero Visitar", 
    icon: Target, 
    color: "#45b7d1" 
  },
];
