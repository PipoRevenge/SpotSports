import { Sport, SportDetails } from '@/src/entities/sport/model/sport';
import { firestore, functions } from '@/src/lib/firebase-config';
import {
  collection,
  doc,
  query as firestoreQuery,
  getDoc,
  getDocs,
  orderBy,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ISportRepository } from '../interfaces/i-sport-repository';
import { SportMapper } from '../mappers/sport-mapper';
import { logRepositoryError, parseFirebaseError } from '../utils/firebase-parsers';

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

      // Basic validations
      if (!sportData.name?.trim()) {
        throw new Error('Sport name is required');
      }

      if (!sportData.description?.trim()) {
        throw new Error('Sport description is required');
      }

      const createSportFn = httpsCallable(functions, 'sports-create');
      const validData = {
        name: sportData.name.trim(),
        description: sportData.description.trim(),
        icon: sportData.icon?.trim() || '',
        image: sportData.image?.trim() || '',
        category: sportData.category?.trim() || ''
      };

      const result = await createSportFn(validData);
      const { sportId } = result.data as { sportId: string };
      return sportId;

      
    } catch (error: any) {
      console.error('Error creating sport:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.createSport', { name: sportData?.name }, error);
      throw new Error(parsed.message);
    }
  }

  /**
   * Obtiene un deporte por ID
   */
  async getSportById(id: string): Promise<Sport | null> {
    try {
      if (!id?.trim()) {
        throw new Error('Sport ID is required');
      }

      const sportRef = doc(firestore, this.SPORTS_COLLECTION, id);
      const sportDoc = await getDoc(sportRef);

      if (!sportDoc.exists()) {
        return null;
      }

      return SportMapper.fromFirebase(sportDoc.id, sportDoc.data() as any);
      
    } catch (error: any) {
      console.error('Error getting sport by ID:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.getSportById', { id }, error);
      throw new Error(parsed.message);
    }
  }

  /**
   * Obtiene deportes por IDs en bulk (optimizado para múltiples IDs)
   */
  async getSportsByIds(ids: string[]): Promise<Sport[]> {
    try {
      if (!ids || ids.length === 0) {
        return [];
      }

      // Filtrar IDs válidos
      const validIds = ids.filter(id => id?.trim());
      if (validIds.length === 0) {
        return [];
      }

      // Obtener deportes en paralelo
      const sportsPromises = validIds.map(id => this.getSportById(id));
      const sports = await Promise.all(sportsPromises);

      // Filtrar deportes que existen
      return sports.filter(sport => sport !== null) as Sport[];
      
    } catch (error: any) {
      console.error('Error getting sports by IDs:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.getSportsByIds', { ids }, error);
      throw new Error(parsed.message);
    }
  }

  /**
   * Obtiene todos los deportes usando cloud function
   */
  async getAllSports(): Promise<Sport[]> {
    try {
      const getSportsFn = httpsCallable(functions, 'sports-get');
      const result = await getSportsFn({});
      
      const { sports: sportsData } = result.data as { sports: any[] };
      const sports = sportsData.map((data: any) => SportMapper.fromFirebase(data.id, data));
      
      return sports;
    } catch (error: any) {
      console.error('Error getting all sports:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.getAllSports', {}, error);
      throw new Error(parsed.message);
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

      const searchSportsFn = httpsCallable(functions, 'sports-search');
      const result = await searchSportsFn({ query: query.trim() });
      
      const { sports: sportsData } = result.data as { sports: any[] };
      return sportsData.map((data: any) => SportMapper.fromFirebase(data.id, data));
      
    } catch (error: any) {
      console.error('Error searching sports:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.searchSportsByName', { query }, error);
      throw new Error(parsed.message);
    }
  }

  /**
   * Busca deportes por categoría
   */
  async searchSportsByCategory(category: string): Promise<Sport[]> {
    try {
      if (!category?.trim()) {
        return [];
      }

      const searchSportsFn = httpsCallable(functions, 'sports-search');
      const result = await searchSportsFn({ category: category.trim() });
      
      const { sports: sportsData } = result.data as { sports: any[] };
      return sportsData.map((data: any) => SportMapper.fromFirebase(data.id, data));
      
    } catch (error: any) {
      console.error('Error searching sports by category:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.searchSportsByCategory', { category }, error);
      throw new Error(parsed.message);
    }
  }

  /**
   * Busca deportes con filtros múltiples
   */
  async searchSportsWithFilters(filters: { query?: string; category?: string }): Promise<Sport[]> {
    try {
      const { query, category } = filters;

      // Si no hay filtros, retornar vacío
      if (!query?.trim() && !category?.trim()) {
        return [];
      }

      const searchSportsFn = httpsCallable(functions, 'sports-search');
      const result = await searchSportsFn({ 
        query: query?.trim(),
        category: category?.trim()
      });
      
      const { sports: sportsData } = result.data as { sports: any[] };
      return sportsData.map((data: any) => SportMapper.fromFirebase(data.id, data));
      
    } catch (error: any) {
      console.error('Error searching sports with filters:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.searchSportsWithFilters', { filters }, error);
      throw new Error(parsed.message);
    }
  }

  /**
   * Obtiene deportes por categoría
   */
  async getActiveSportsByCategory(category: string): Promise<Sport[]> {
    try {
      if (!category?.trim()) {
        return [];
      }

      const searchSportsFn = httpsCallable(functions, 'sports-search');
      const result = await searchSportsFn({ category: category.trim() });
      
      const { sports: sportsData } = result.data as { sports: any[] };
      return sportsData.map((data: any) => SportMapper.fromFirebase(data.id, data));
      
    } catch (error: any) {
      console.error('Error getting sports by category:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.getActiveSportsByCategory', { category }, error);
      throw new Error(parsed.message);
    }
  }

  /**
   * Actualiza un deporte
   */
  async updateSport(id: string, sportData: Partial<SportDetails>): Promise<Sport> {
    try {
      if (!id?.trim()) {
        throw new Error('Sport ID is required');
      }

      // Verificar si el deporte existe
      const existingSport = await this.getSportById(id);
      if (!existingSport) {
        throw new Error('Sport not found');
      }

      // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
      if (sportData.name && sportData.name !== existingSport.details.name) {
        const nameExists = await this.sportExistsByName(sportData.name, id);
        if (nameExists) {
          throw new Error('A sport with this name already exists');
        }
      }

      const sportRef = doc(firestore, this.SPORTS_COLLECTION, id);
      const updateData: any = {
        updatedAt: Timestamp.now(),
      };

      // Solo actualizar campos que tienen valor
      if (sportData.name !== undefined) {
        updateData.name = sportData.name.trim();
      }
      
      if (sportData.description !== undefined) {
        updateData.description = sportData.description?.trim() || '';
      }
      
      if (sportData.icon !== undefined) {
        updateData.icon = sportData.icon?.trim() || '';
      }
      
      if (sportData.image !== undefined) {
        updateData.image = sportData.image?.trim() || '';
      }
      
      if (sportData.category !== undefined) {
        updateData.category = sportData.category?.trim() || '';
      }

      await updateDoc(sportRef, updateData);

      // Retornar el deporte actualizado
      const updatedSport = await this.getSportById(id);
      return updatedSport!;
      
    } catch (error: any) {
      console.error('Error updating sport:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.updateSport', { sportId: id, updates: sportData }, error);
      throw new Error(parsed.message);
    }
  }

  /**
   * Desactiva un deporte (soft delete)
   */
  async deactivateSport(id: string): Promise<void> {
    try {
      if (!id?.trim()) {
        throw new Error('Sport ID is required');
      }

      const sportRef = doc(firestore, this.SPORTS_COLLECTION, id);
      const sportDoc = await getDoc(sportRef);

      if (!sportDoc.exists()) {
        throw new Error('Sport not found');
      }

      await updateDoc(sportRef, {
        updatedAt: Timestamp.now(),
      });
      
    } catch (error: any) {
      console.error('Error deactivating sport:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.deactivateSport', { sportId: id }, error);
      throw new Error(parsed.message);
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
        SportMapper.fromFirebase(doc.id, doc.data() as any)
      );
      
    } catch (error: any) {
      console.error('Error getting sports:', error);
      const parsed = parseFirebaseError(error);
      logRepositoryError('sport.getActiveSports', {}, error);
      throw new Error(parsed.message);
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