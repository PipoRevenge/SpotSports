import { CommentReview } from "./comment";
import { Review } from "./review";


export interface UserDetails {
  email: string;
  photoURL?: string;
  userName: string;
  fullName?: string;
  bio?: string;
  birthDate?: string;
  phoneNumber?: string;
}

export interface UserMetadata {
  createdAt: Date;
  updatedAt: Date;
}

export interface UserActivity {
  favoriteSports: string[];
  favoriteSpots: string[];
  reviewsCount: number;
  reviews: Review[];
  comments: CommentReview[];
  commentsCount: number;
}

// Interfaz principal de Usuario
export interface User {
  id: string;
  userDetails: UserDetails;
  metadata: UserMetadata;
  isVerified: boolean;
  activity: UserActivity;
}

