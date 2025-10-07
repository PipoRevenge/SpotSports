import { GeoPoint } from "./geopoint";
import { Review } from "./review";

export interface SpotDetails {
  name: string;
  description: string;
  images: string[];
  location: GeoPoint;
  address?: string;
  rating: number;
  sports: SportSpotRating[];
  schedule?: Record<string, string>;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };

}
export interface SportSpotRating {
  sportId: string;
  sportName: string;
  rating: number;
  difficulty: number;
}

export interface SpotMetadata {
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface SpotActivity {
  favorites: number;
  reviewsCount: number;
  reviews?: Review[];
  visitsCount: number;
}

// Interfaz principal de Spot
export interface Spot {
  id: string;
  details: SpotDetails;
  metadata: SpotMetadata;
  isVerified?: boolean;
  isActive?: boolean;
  activity?: SpotActivity;
}






