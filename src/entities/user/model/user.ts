

export interface UserDetails {
  email: string;
  photoURL?: string;
  userName: string;
  fullName?: string;
  bio?: string;
  birthDate: Date;
  phoneNumber?: string;
}

export interface UserMetadata {
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
}

export interface UserActivity {
  reviewsCount: number;
  commentsCount: number;
  discussionsCount: number;
  favoriteSpotsCount: number;
  followersCount: number;
  followingCount: number;
}

// Interfaz principal de Usuario
export interface User {
  id: string;
  userDetails: UserDetails;
  metadata: UserMetadata;
  activity: UserActivity;
}

