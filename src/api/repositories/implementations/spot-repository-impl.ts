import { Spot, SpotDetails } from '@/src/entities/spot/model/spot';
import { firestore } from '@/src/lib/firebase-config';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ISpotRepository } from '../interfaces/i-spot-repository';
import { SpotFirebase, spotMapper } from '../mappers/spot-mapper';

/**
 * Implementación del repositorio de spots usando Firebase Firestore
 */
export class SpotRepositoryImpl implements ISpotRepository {
  private readonly COLLECTION_NAME = 'spots';

  /**
   * Crear un nuevo spot
   */
  async createSpot(spotData: SpotDetails): Promise<void> {
    try {
      // Validar datos de entrada
      if (!spotData) {
        throw new Error('Spot data is required');
      }

      if (!spotData.name || spotData.name.trim().length === 0) {
        throw new Error('Spot name is required');
      }

      if (!spotData.location || !spotData.location.latitude || !spotData.location.longitude) {
        throw new Error('Valid location is required');
      }

      // Convertir a formato de Firebase
      const firestoreData = spotMapper.toFirestore(spotData);

      // Agregar timestamps
      const spotWithTimestamps = {
        ...firestoreData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Obtener referencia a la colección
      const spotsCollection = collection(firestore, this.COLLECTION_NAME);

      // Crear documento en Firestore
      const docRef = await addDoc(spotsCollection, spotWithTimestamps);

      console.log('Spot created successfully with ID:', docRef.id);

    } catch (error) {
      console.error('Error creating spot:', error);
      
      // Re-lanzar el error con un mensaje más descriptivo
      if (error instanceof Error) {
        throw new Error(`Failed to create spot: ${error.message}`);
      } else {
        throw new Error('Failed to create spot: Unknown error');
      }
    }
  }

  /**
   * Obtener spot por ID
   */
  async getSpotById(id: string): Promise<Spot | null> {
    try {
      // Validar ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new Error('Valid spot ID is required');
      }

      // Obtener referencia al documento
      const spotDoc = doc(firestore, this.COLLECTION_NAME, id);

      // Obtener documento
      const docSnap = await getDoc(spotDoc);

      // Verificar si existe
      if (!docSnap.exists()) {
        return null;
      }

      // Obtener datos y convertir a modelo de dominio
      const spotData = docSnap.data() as SpotFirebase;
      const spotWithId = { ...spotData, id: docSnap.id };

      // Convertir usando el mapper
      return spotMapper.toDomain(spotWithId);

    } catch (error) {
      console.error('Error getting spot by ID:', error);
      
      // Re-lanzar el error con un mensaje más descriptivo
      if (error instanceof Error) {
        throw new Error(`Failed to get spot: ${error.message}`);
      } else {
        throw new Error('Failed to get spot: Unknown error');
      }
    }
  }
}
