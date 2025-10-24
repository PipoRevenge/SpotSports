import { GeoPoint } from "@/src/types/geopoint";

export interface SpotDetails {
  name: string;
  description: string;
  availableSports: string[]; //lista de deportes disponibles en el spot
  media: string[]; //imagenes o videos del spot
  location: GeoPoint;
  overallRating: number;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
}


export interface SportSpot {
  sportId: string;
  sportName: string;
}

export interface SportSpotRating {
  sportId: string;
  sportName: string;
  rating: number;
  difficulty: number;
}

export interface SpotMetadata {
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SpotActivity {
  reviewsCount: number;
  visitsCount: number;
}

// Interfaz principal de Spot
export interface Spot {
  id: string;
  details: SpotDetails;
  metadata: SpotMetadata;
  activity?: SpotActivity;
}






