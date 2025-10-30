import { Spot, SpotDetails } from '@/src/entities/spot/model/spot';
import { firestore, storage } from '@/src/lib/firebase-config';
import { GeoPoint } from '@/src/types/geopoint';
import { addDoc, collection, doc, getDoc, Timestamp } from 'firebase/firestore';
import { getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import { geohashForLocation } from 'geofire-common';
import { ISpotRepository } from '../interfaces/i-spot-repository';
import { SpotFirebase, spotMapper } from '../mappers/spot-mapper';


/**
 * Implementación del repositorio de spots usando Firebase Firestore
 */
export class SpotRepositoryImpl implements ISpotRepository {
  private readonly COLLECTION_NAME = 'spots';
  private readonly SPOT_SPORT_METRICS_COLLECTION = 'spot_sport_metrics';

  /**
   * Crear un nuevo spot
   */
  async createSpot(spotData: SpotDetails, userId: string, username: string): Promise<string> {
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

      if (!userId || userId.trim().length === 0) {
        throw new Error('User ID is required');
      }

      if (!username || username.trim().length === 0) {
        throw new Error('Username is required');
      }

      // Crear el spot sin media primero (solo con array vacío)
      const spotDataWithoutMedia = {
        ...spotData,
        media: [] // Inicialmente vacío
      };

      // Convertir a formato de Firebase
      const firestoreData = spotMapper.toFirestore(spotDataWithoutMedia, userId, username);

      // Generar geohash para la ubicación
      const geohash = await this.createGeohash(spotData.location);

      // Agregar timestamps y geohash
      const spotWithTimestamps = {
        ...firestoreData,
        geohash: geohash,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Limpiar campos undefined (Firebase no los acepta)
      const cleanedData = this.removeUndefinedFields(spotWithTimestamps);

      // Obtener referencia a la colección
      const spotsCollection = collection(firestore, this.COLLECTION_NAME);

      // Crear documento en Firestore
      const docRef = await addDoc(spotsCollection, cleanedData);
      const spotId = docRef.id;

      console.log('Spot created successfully with ID:', spotId);

      // Crear documentos en spot_sport_metrics para cada deporte
      if (spotData.availableSports && spotData.availableSports.length > 0) {
        console.log('Creating spot_sport_metrics documents...');
        await this.createSpotSportMetrics(spotId, spotData.availableSports);
        console.log('Spot sport metrics created successfully');
      }

      // Si hay media, subirla a Storage
      if (spotData.media && spotData.media.length > 0) {
        console.log('Uploading media files...');
        await this.uploadSpotMedia(spotId, userId, spotData.media);
        console.log('Media uploaded successfully');
      }

      return spotId;

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
      
      // Cargar las URLs de media desde Storage
      const mediaUrls = await this.getSpotMediaUrls(id);
      
      // Agregar las URLs al objeto antes de convertir
      const spotWithId = { 
        ...spotData, 
        id: docSnap.id,
        media: mediaUrls 
      };

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

  private async createGeohash(location: GeoPoint): Promise<string> {
    // Validar ubicación
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Valid location is required');
    }

    // Convertir coordenadas a geohash
    const geohash = geohashForLocation([location.latitude, location.longitude]);
    return geohash;
  }

  /**
   * Crear documentos en spot_sport_metrics para cada deporte disponible
   */
  private async createSpotSportMetrics(spotId: string, sportIds: string[]): Promise<void> {
    try {
      const metricsCollection = collection(firestore, this.SPOT_SPORT_METRICS_COLLECTION);
      
      // Crear una referencia al documento del spot
      const spotRef = doc(firestore, this.COLLECTION_NAME, spotId);
      
      // Crear un documento para cada deporte
      const createPromises = sportIds.map(async (sportId) => {
        // Crear referencia al deporte
        const sportRef = doc(firestore, 'sports', sportId);
        
        // Crear documento en spot_sport_metrics
        const metricData = {
          spot_ref: spotRef,
          sport_ref: sportRef,
          avg_difficulty: 0,
          avg_quality: 0,
          review_count: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        // Usar addDoc para generar ID automático
        const docRef = await addDoc(metricsCollection, metricData);
        console.log(`Created metric document: ${docRef.id}`);
      });
      
      // Ejecutar todas las creaciones en paralelo
      await Promise.all(createPromises);
    } catch (error) {
      console.error('Error creating spot sport metrics:', error);
      throw new Error(`Failed to create spot sport metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subir archivos multimedia a Storage y retornar las URLs
   */
  private async uploadSpotMedia(spotId: string, userId: string, mediaUris: string[]): Promise<void> {
    try {
      // Obtener fecha actual en formato YYYY_MM_DD
      const now = new Date();
      const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
      
      // Subir cada archivo
      for (let i = 0; i < mediaUris.length; i++) {
        const mediaUri = mediaUris[i];
        const fileNumber = i + 1;
        
        // Determinar extensión del archivo
        const extension = this.getFileExtension(mediaUri);
        
        // Crear nombre del archivo: YYYY_MM_DD_userId_numero.ext
        const fileName = `${dateStr}_${userId}_${fileNumber}${extension}`;
        
        // Crear referencia en Storage: /spots/spotId/media/fileName
        const storageRef = ref(storage, `spots/${spotId}/media/${fileName}`);
        
        // Descargar el archivo desde la URI local
        const response = await fetch(mediaUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch media file: ${mediaUri}`);
        }
        
        const blob = await response.blob();
        
        // Subir a Storage
        console.log(`Uploading file ${fileNumber}/${mediaUris.length}: ${fileName}`);
        await uploadBytes(storageRef, blob);
      }
    } catch (error) {
      console.error('Error uploading spot media:', error);
      throw new Error(`Failed to upload media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtener extensión del archivo desde la URI
   */
  private getFileExtension(uri: string): string {
    // Intentar obtener la extensión del final de la URI
    const match = uri.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    if (match && match[1]) {
      return `.${match[1].toLowerCase()}`;
    }
    
    // Si no se puede determinar, usar .jpg por defecto para imágenes
    // En una implementación más robusta, podrías verificar el tipo MIME
    return '.jpg';
  }

  /**
   * Remover campos undefined de un objeto (Firebase no acepta undefined)
   */
  private removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
    const cleaned: any = {};
    
    for (const key in obj) {
      if (obj[key] !== undefined) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          // Recursivamente limpiar objetos anidados
          cleaned[key] = this.removeUndefinedFields(obj[key]);
        } else {
          cleaned[key] = obj[key];
        }
      }
    }
    
    return cleaned as T;
  }

  /**
   * Obtener URLs de las imágenes de un spot desde Storage
   */
  private async getSpotMediaUrls(spotId: string): Promise<string[]> {
    try {
      // Crear referencia a la carpeta de media del spot
      const mediaFolderRef = ref(storage, `spots/${spotId}/media`);
      
      // Listar todos los archivos en la carpeta
      const result = await listAll(mediaFolderRef);
      
      // Obtener las URLs de descarga de cada archivo
      const urlPromises = result.items.map(itemRef => getDownloadURL(itemRef));
      const urls = await Promise.all(urlPromises);
      
      return urls;
    } catch (error) {
      console.error('Error getting spot media URLs:', error);
      // Si hay error (por ejemplo, carpeta no existe), retornar array vacío
      return [];
    }
  }

}
