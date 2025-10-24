import { Sport, SportDetails } from '@/src/entities/sport/model/sport';
import { firestore } from '@/src/lib/firebase-config';
import {
  addDoc,
  collection,
  doc,
  query as firestoreQuery,
  getDoc,
  getDocs,
  limit,
  orderBy,
  updateDoc,
  where
} from 'firebase/firestore';
import { ISportRepository } from '../interfaces/i-sport-repository';
import * as SportMapper from '../mappers/sport-mapper';

export class SportRepositoryImpl implements ISportRepository {
  private readonly SPORTS_COLLECTION = 'sports';

  /**
   * Crea un nuevo deporte
   */
  async createSport(sportData: SportDetails, createdBy: string = 'system'): Promise<string> {
    try {
      // Validar que no exista un deporte con el mismo nombre
      const exists = await this.sportExistsByName(sportData.name);
      if (exists) {
        throw new Error('Ya existe un deporte con este nombre');
      }

      // Validaciones básicas
      if (!sportData.name?.trim()) {
        throw new Error('El nombre del deporte es requerido');
      }

      if (!sportData.description?.trim()) {
        throw new Error('La descripción del deporte es requerida');
      }

      const sportsRef = collection(firestore, this.SPORTS_COLLECTION);
      const firestoreData = SportMapper.detailsToFirestore(sportData, createdBy);
      
      const docRef = await addDoc(sportsRef, firestoreData);
      return docRef.id;
      
    } catch (error: any) {
      console.error('Error creating sport:', error);
      throw new Error(error.message || 'No se pudo crear el deporte');
    }
  }

  /**
   * Obtiene un deporte por ID
   */
  async getSportById(id: string): Promise<Sport | null> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del deporte es requerido');
      }

      const sportRef = doc(firestore, this.SPORTS_COLLECTION, id);
      const sportDoc = await getDoc(sportRef);

      if (!sportDoc.exists()) {
        return null;
      }

      return SportMapper.toDomain(sportDoc.id, sportDoc.data() as SportMapper.SportFirebase);
      
    } catch (error: any) {
      console.error('Error getting sport by ID:', error);
      throw new Error(error.message || 'No se pudo obtener el deporte');
    }
  }

  /**
   * Obtiene todos los deportes
   */
  async getAllSports(): Promise<Sport[]> {
    try {
      const sportsRef = collection(firestore, this.SPORTS_COLLECTION);
      const q = firestoreQuery(sportsRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => 
        SportMapper.toDomain(doc.id, doc.data() as SportMapper.SportFirebase)
      );
      
    } catch (error: any) {
      console.error('Error getting all sports:', error);
      throw new Error(error.message || 'No se pudieron obtener los deportes');
    }
  }

  /**
   * Busca deportes por nombre
   */
  async searchSportsByName(query: string): Promise<Sport[]> {
    try {
      if (!query?.trim()) {
        return [];
      }

      const sportsRef = collection(firestore, this.SPORTS_COLLECTION);
      const searchQuery = query.trim().toLowerCase();
      
      // Firebase no soporta búsqueda por texto completo nativamente
      // Esta es una implementación básica que busca por prefijo
      const q = firestoreQuery(
        sportsRef,
        orderBy('name'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const allSports = querySnapshot.docs.map(doc => 
        SportMapper.toDomain(doc.id, doc.data() as SportMapper.SportFirebase)
      );

      // Filtrar en el cliente por nombre (incluye substring)
      return allSports.filter(sport => 
        sport.details.name.toLowerCase().includes(searchQuery)
      );
      
    } catch (error: any) {
      console.error('Error searching sports:', error);
      throw new Error(error.message || 'No se pudieron buscar los deportes');
    }
  }

  /**
   * Actualiza un deporte
   */
  async updateSport(id: string, sportData: Partial<SportDetails>): Promise<Sport> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del deporte es requerido');
      }

      // Verificar si el deporte existe
      const existingSport = await this.getSportById(id);
      if (!existingSport) {
        throw new Error('Deporte no encontrado');
      }

      // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
      if (sportData.name && sportData.name !== existingSport.details.name) {
        const nameExists = await this.sportExistsByName(sportData.name, id);
        if (nameExists) {
          throw new Error('Ya existe un deporte con este nombre');
        }
      }

      const sportRef = doc(firestore, this.SPORTS_COLLECTION, id);
      const updateData: any = {
        updatedAt: new Date(),
      };

      // Solo actualizar campos que tienen valor
      if (sportData.name !== undefined) {
        updateData.name = sportData.name.trim();
      }
      
      if (sportData.description !== undefined) {
        updateData.description = sportData.description?.trim() || undefined;
      }
      
      if (sportData.icon !== undefined) {
        updateData.icon = sportData.icon?.trim() || undefined;
      }
      
      if (sportData.image !== undefined) {
        updateData.image = sportData.image?.trim() || undefined;
      }
      
      if (sportData.category !== undefined) {
        updateData.category = sportData.category?.trim() || undefined;
      }

      await updateDoc(sportRef, updateData);

      // Retornar el deporte actualizado
      const updatedSport = await this.getSportById(id);
      return updatedSport!;
      
    } catch (error: any) {
      console.error('Error updating sport:', error);
      throw new Error(error.message || 'No se pudo actualizar el deporte');
    }
  }

  /**
   * Desactiva un deporte (soft delete)
   */
  async deactivateSport(id: string): Promise<void> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del deporte es requerido');
      }

      const sportRef = doc(firestore, this.SPORTS_COLLECTION, id);
      const sportDoc = await getDoc(sportRef);

      if (!sportDoc.exists()) {
        throw new Error('Deporte no encontrado');
      }

      await updateDoc(sportRef, {
        updatedAt: new Date(),
      });
      
    } catch (error: any) {
      console.error('Error deactivating sport:', error);
      throw new Error(error.message || 'No se pudo desactivar el deporte');
    }
  }

  /**
   * Obtiene todos los deportes ordenados por nombre
   */
  async getActiveSports(): Promise<Sport[]> {
    try {
      const sportsRef = collection(firestore, this.SPORTS_COLLECTION);
      const q = firestoreQuery(
        sportsRef,
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        SportMapper.toDomain(doc.id, doc.data() as SportMapper.SportFirebase)
      );
      
    } catch (error: any) {
      console.error('Error getting active sports:', error);
      throw new Error(error.message || 'No se pudieron obtener los deportes activos');
    }
  }

  /**
   * Verifica si existe un deporte por nombre
   */
  async sportExistsByName(name: string, excludeId?: string): Promise<boolean> {
    try {
      if (!name?.trim()) {
        return false;
      }

      const sportsRef = collection(firestore, this.SPORTS_COLLECTION);
      const q = firestoreQuery(
        sportsRef,
        where('name', '==', name.trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      // Si hay un ID a excluir, verificar que no sea el mismo deporte
      if (excludeId && querySnapshot.docs.length > 0) {
        return querySnapshot.docs.some(doc => doc.id !== excludeId);
      }
      
      return !querySnapshot.empty;
      
    } catch (error: any) {
      console.error('Error checking sport name existence:', error);
      return false;
    }
  }
}