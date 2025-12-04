export interface SportDetails {
  name: string;
  description: string;
  category?: string; // Opcional - los deportes pueden no tener categoría
  icon?: string;
  image?: string;
}

export interface SportMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
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
  metadata: SportMetadata;
  activity?: SportActivity;
}

// Deporte simple (view model o tipo ligero) usado en varios componentes
export interface SimpleSport {
  id: string;
  name: string;
  description?: string;
  category?: string;
}
