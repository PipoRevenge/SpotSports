import { Spot, SpotDetails } from '@/src/entities/spot/model/spot';


export interface ISpotRepository {
  // Crear un nuevo spot
  createSpot(spotData: SpotDetails, userId: string): Promise<string >;
  
  // Obtener spot por ID
  getSpotById(id: string): Promise<Spot | null>;
  
  
}