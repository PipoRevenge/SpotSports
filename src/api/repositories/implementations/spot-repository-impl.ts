import { Spot, SpotDetails } from '@/src/entities/spot/model/spot';
import { firestore, storage } from '@/src/lib/firebase-config';
import { GeoPoint } from '@/src/types/geopoint';
import { addDoc, collection, doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { geohashForLocation } from 'geofire-common';
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
  async createSpot(spotData: SpotDetails, userId: string): Promise<string> {
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

      // Crear el spot sin media primero (solo con array vacío)
      const spotDataWithoutMedia = {
        ...spotData,
        media: [] // Inicialmente vacío
      };

      // Convertir a formato de Firebase
      const firestoreData = spotMapper.toFirestore(spotDataWithoutMedia, userId);

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

      // Si hay media, subirla a Storage
      if (spotData.media && spotData.media.length > 0) {
        console.log('Uploading media files...');
        const mediaUrls = await this.uploadSpotMedia(spotId, userId, spotData.media);
        
        // Actualizar el documento con las URLs de los archivos subidos
        await updateDoc(docRef, {
          media: mediaUrls,
          updatedAt: Timestamp.now()
        });
        
        console.log('Media uploaded successfully:', mediaUrls);
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
   * Subir archivos multimedia a Storage y retornar las URLs
   */
  private async uploadSpotMedia(spotId: string, userId: string, mediaUris: string[]): Promise<string[]> {
    try {
      const uploadedUrls: string[] = [];
      
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
        
        // Obtener URL de descarga
        const downloadUrl = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadUrl);
      }
      
      return uploadedUrls;
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

}
