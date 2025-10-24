import { Sport, SportDetails } from '@/src/entities/sport/model/sport';

export interface ISportRepository {
  // Crear un nuevo deporte
  createSport(sportData: SportDetails, createdBy?: string): Promise<string>;
  
  // Obtener deporte por ID
  getSportById(id: string): Promise<Sport | null>;
  
  // Obtener todos los deportes
  getAllSports(): Promise<Sport[]>;
  
  // Buscar deportes por nombre
  searchSportsByName(query: string): Promise<Sport[]>;
  
  // Actualizar deporte
  updateSport(id: string, sportData: Partial<SportDetails>): Promise<Sport>;
  
  // Desactivar deporte (soft delete)
  deactivateSport(id: string): Promise<void>;
  
  // Obtener deportes activos
  getActiveSports(): Promise<Sport[]>;
  
  // Verificar si existe un deporte por nombre
  sportExistsByName(name: string, excludeId?: string): Promise<boolean>;
}