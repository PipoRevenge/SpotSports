import { Sport, SportDetails } from '@/src/entities/sport/model/sport';

export interface ISportRepository {
  // Crear un nuevo deporte
  createSport(sportData: SportDetails, createdBy?: string): Promise<string>;
  
  // Obtener deporte por ID
  getSportById(id: string): Promise<Sport | null>;
  
  // Obtener deportes por IDs (bulk)
  getSportsByIds(ids: string[]): Promise<Sport[]>;
  
  // Obtener todos los deportes
  getAllSports(): Promise<Sport[]>;
  
  // Buscar deportes por nombre
  searchSportsByName(query: string): Promise<Sport[]>;
  
  // Buscar deportes por categoría
  searchSportsByCategory(category: string): Promise<Sport[]>;
  
  // Buscar deportes con filtros múltiples
  searchSportsWithFilters(filters: { query?: string; category?: string }): Promise<Sport[]>;
  
  // Obtener deportes por categoría
  getActiveSportsByCategory(category: string): Promise<Sport[]>;
  
  // Actualizar deporte
  updateSport(id: string, sportData: Partial<SportDetails>): Promise<Sport>;
  
  // Desactivar deporte (soft delete)
  deactivateSport(id: string): Promise<void>;
  
  // Obtener todos los deportes
  getActiveSports(): Promise<Sport[]>;
  
  // Verificar si existe un deporte por nombre
  sportExistsByName(name: string, excludeId?: string): Promise<boolean>;
}