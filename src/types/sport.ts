export interface SportDetails {
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  category?: string;
}

export interface SportMetadata {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SportActivity {
  spotsCount?: number;
  usersCount?: number;
  popularity?: number;
}

// Interfaz principal de Deporte
export interface Sport {
  id: string;
  details: SportDetails;
  metadata?: SportMetadata;
  isActive?: boolean;
  activity?: SportActivity;
}
