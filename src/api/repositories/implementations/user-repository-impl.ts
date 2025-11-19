import { SavedSpot, SpotCategory } from '@/src/entities/user/model/spot-collection';
import { User, UserDetails } from '@/src/entities/user/model/user';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { firestore } from '../../../lib/firebase-config';
import { IUserRepository } from '../interfaces/i-user-repository';
import { UserFirebase, UserMapper } from '../mappers/user-mapper';

export class UserRepositoryImpl implements IUserRepository {
    private readonly USERS_COLLECTION = 'users';
    private readonly SAVED_SPOTS_SUBCOLLECTION = 'saved_spots';
    private readonly FAVORITE_SPORTS_SUBCOLLECTION = 'favoriteSports';
    private readonly FOLLOWERS_SUBCOLLECTION = 'followers';
    private readonly FOLLOWING_SUBCOLLECTION = 'following';
    private readonly storage = getStorage();

    async createUser(userId: string, userData: Partial<UserDetails>): Promise<boolean> {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es requerido');
            }

            // Validar datos requeridos
            if (!userData.email || !userData.userName) {
                throw new Error('El email y nombre de usuario son requeridos');
            }

            const now = Timestamp.now();
            
            // Crear objeto User completo con valores por defecto
            const newUser: UserFirebase = {
                // UserDetails con valores por defecto
                email: userData.email,
                userName: userData.userName,
                profileUrl: userData.photoURL || "", // ACTUALIZADO: photoURL → profileUrl
                fullName: userData.fullName || "",
                bio: userData.bio || "",
                birthDate: userData.birthDate || now.toDate(),
                phoneNumber: userData.phoneNumber || "",

                // Metadata inicial
                createdAt: now,
                updatedAt: now,
                isVerified: false,

                // Activity inicial
                reviewsCount: 0,
                commentsCount: 0,
                favoriteSpotsCount: 0,
                followersCount: 0,
                followingCount: 0,
            };

            const userRef = doc(firestore, this.USERS_COLLECTION, userId);

            // Crear el documento del usuario
            await setDoc(userRef, newUser);

            return true;
        } catch (error: any) {
            console.error('Error creating user:', error);
            
            // Si ya es un error con mensaje personalizado, relanzarlo
            if (error?.message && (
                error.message.includes('requerido') || 
                error.message.includes('requeridos')
            )) {
                throw error;
            }
            
            // Manejar errores de Firestore
            if (error?.code) {
                switch (error.code) {
                    case 'permission-denied':
                        throw new Error('No tienes permisos para crear este usuario. Verifica tu autenticación.');
                    case 'unavailable':
                        throw new Error('El servicio no está disponible. Por favor, intenta más tarde.');
                    case 'already-exists':
                        throw new Error('Este usuario ya existe en el sistema.');
                    default:
                        throw new Error('Error al crear el perfil de usuario. Por favor, intenta nuevamente.');
                }
            }
            
            throw new Error('Error inesperado al crear el perfil de usuario.');
        }
    }

    async getUserById(userId: string): Promise<User> {
        try {
            const userRef = await doc(firestore, this.USERS_COLLECTION, userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            // Convertir de Firebase a modelo de la aplicación usando el mapper
            const firebaseUser = userDoc.data() as UserFirebase;
            return UserMapper.fromFirebase(firebaseUser, userId);
        } catch (error: any) {
            console.error('Error getting user:', error);
            
            // Preservar el mensaje "User not found" para que el contexto pueda hacer retry
            if (error?.message === 'User not found') {
                throw error;
            }
            
            // Para otros errores de Firestore
            if (error?.code) {
                switch (error.code) {
                    case 'permission-denied':
                        throw new Error('No tienes permisos para acceder a este usuario.');
                    case 'unavailable':
                        throw new Error('El servicio no está disponible. Por favor, intenta más tarde.');
                    default:
                        throw new Error('Error al obtener los datos del usuario.');
                }
            }
            
            throw new Error('No se pudo obtener el usuario');
        }
    }

    async updateUserProfile(userId: string, userData: Partial<User>): Promise<User> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }

            const currentFirebaseUser = userDoc.data() as UserFirebase;
            const currentUser = UserMapper.fromFirebase(currentFirebaseUser, userId);
            
            // Handle profile photo upload if photoURL is a local file
            let photoURL = userData.userDetails?.photoURL;
            if (photoURL && photoURL.startsWith('file://')) {
                try {
                    photoURL = await this.uploadProfilePhoto(userId, photoURL);
                    // Update the userData with the new photo URL, ensuring required fields from the current user are preserved
                    userData = {
                        ...userData,
                        userDetails: {
                            ...currentUser.userDetails,
                            ...userData.userDetails,
                            photoURL
                        }
                    };
                } catch (photoError) {
                    console.error('Error uploading profile photo:', photoError);
                    // Continue with update but without the photo
                    if (userData.userDetails) {
                        userData.userDetails.photoURL = currentUser.userDetails.photoURL;
                    }
                }
            }

            // Convertir los cambios a formato Firebase usando el mapper
            const firebaseUpdates = UserMapper.partialToFirebase(userData);
            
            // Agregar timestamp de actualización
            firebaseUpdates.updatedAt = Timestamp.now();

            await updateDoc(userRef, firebaseUpdates);

            // Obtener el usuario actualizado y convertirlo de vuelta
            const updatedDoc = await getDoc(userRef);
            const updatedFirebaseUser = updatedDoc.data() as UserFirebase;
            return UserMapper.fromFirebase(updatedFirebaseUser, userId);
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Error('Unable to update user');
        }
    }

    /**
     * Obtiene las colecciones de spots de un usuario
     * @param userId ID del usuario
     * @param collectionType Tipo de colección (opcional, si no se especifica devuelve todas)
     * @returns Array de SpotCollection
     */
    /**
     * Obtiene los spots guardados del usuario
     * @param userId ID del usuario
     * @param category Filtrar por categoría específica (opcional)
     * @returns Array de SavedSpot
     */
    async getUserSavedSpots(userId: string, category?: SpotCategory): Promise<SavedSpot[]> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            const savedSpotsRef = collection(userRef, this.SAVED_SPOTS_SUBCOLLECTION);
            
            let q = query(savedSpotsRef);
            
            // Si se especifica categoría, filtrar por spots que contengan esa categoría
            if (category) {
                q = query(savedSpotsRef, where('categories', 'array-contains', category));
            }
            
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                spotId: doc.data().spotId,
                categories: doc.data().categories || [],
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            }));
        } catch (error) {
            console.error('Error getting user saved spots:', error);
            throw new Error('Unable to get user saved spots');
        }
    }

    /**
     * Añade categorías a un spot guardado (o crea el spot guardado si no existe)
     * También incrementa los contadores correspondientes en el documento del spot
     * @param userId ID del usuario
     * @param spotId ID del spot
     * @param categories Array de categorías a añadir
     */
    async addSpotToCategories(userId: string, spotId: string, categories: SpotCategory[]): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            
            // Verificar que el usuario existe
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            const savedSpotsRef = collection(userRef, this.SAVED_SPOTS_SUBCOLLECTION);
            
            // Buscar si ya existe un documento para este spotId
            const existingQuery = query(savedSpotsRef, where('spotId', '==', spotId));
            const existingDocs = await getDocs(existingQuery);
            
            const now = Timestamp.now();
            const spotRef = doc(firestore, 'spots', spotId);
            
            if (existingDocs.empty) {
                // No existe, crear nuevo documento con las categorías
                await addDoc(savedSpotsRef, {
                    spotId: spotId,
                    categories: categories,
                    createdAt: now,
                    updatedAt: now,
                });
                
                // Incrementar contadores para cada categoría
                const updateData: any = { updatedAt: now };
                categories.forEach(cat => {
                    const counterField = this.getCounterFieldName(cat);
                    updateData[counterField] = increment(1);
                });
                
                await updateDoc(spotRef, updateData);
                
                console.log(`[UserRepository] Created saved spot ${spotId} with categories:`, categories);
            } else {
                // Ya existe, añadir las nuevas categorías
                const savedSpotDoc = existingDocs.docs[0];
                const currentCategories: SpotCategory[] = savedSpotDoc.data().categories || [];
                
                // Filtrar solo las categorías que aún no están añadidas
                const newCategories = categories.filter(cat => !currentCategories.includes(cat));
                
                if (newCategories.length === 0) {
                    console.log(`[UserRepository] All categories already exist for spot ${spotId}`);
                    return;
                }
                
                // Actualizar el documento añadiendo las nuevas categorías
                await updateDoc(savedSpotDoc.ref, {
                    categories: arrayUnion(...newCategories),
                    updatedAt: now,
                });
                
                // Incrementar contadores solo para las nuevas categorías
                const updateData: any = { updatedAt: now };
                newCategories.forEach(cat => {
                    const counterField = this.getCounterFieldName(cat);
                    updateData[counterField] = increment(1);
                });
                
                await updateDoc(spotRef, updateData);
                
                console.log(`[UserRepository] Added categories to spot ${spotId}:`, newCategories);
            }
        } catch (error) {
            console.error('Error adding spot to categories:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to add spot to categories');
        }
    }

    /**
     * Elimina categorías de un spot guardado
     * También decrementa los contadores correspondientes en el documento del spot
     * Si se eliminan todas las categorías, elimina el documento completo
     * @param userId ID del usuario
     * @param spotId ID del spot
     * @param categories Array de categorías a eliminar
     */
    async removeSpotFromCategories(userId: string, spotId: string, categories: SpotCategory[]): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            const savedSpotsRef = collection(userRef, this.SAVED_SPOTS_SUBCOLLECTION);
            
            // Buscar el documento del spot guardado
            const q = query(savedSpotsRef, where('spotId', '==', spotId));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                throw new Error('Spot is not saved');
            }
            
            const savedSpotDoc = querySnapshot.docs[0];
            const currentCategories: SpotCategory[] = savedSpotDoc.data().categories || [];
            
            // Filtrar las categorías que realmente existen
            const categoriesToRemove = categories.filter(cat => currentCategories.includes(cat));
            
            if (categoriesToRemove.length === 0) {
                console.log(`[UserRepository] No categories to remove for spot ${spotId}`);
                return;
            }
            
            const now = Timestamp.now();
            const spotRef = doc(firestore, 'spots', spotId);
            
            // Calcular las categorías restantes
            const remainingCategories = currentCategories.filter(cat => !categoriesToRemove.includes(cat));
            
            if (remainingCategories.length === 0) {
                // Si no quedan categorías, eliminar el documento completo
                await deleteDoc(savedSpotDoc.ref);
                console.log(`[UserRepository] Deleted saved spot ${spotId} (no categories left)`);
            } else {
                // Actualizar el documento eliminando las categorías
                await updateDoc(savedSpotDoc.ref, {
                    categories: arrayRemove(...categoriesToRemove),
                    updatedAt: now,
                });
                console.log(`[UserRepository] Removed categories from spot ${spotId}:`, categoriesToRemove);
            }
            
            // Decrementar contadores para las categorías eliminadas
            const updateData: any = { updatedAt: now };
            categoriesToRemove.forEach(cat => {
                const counterField = this.getCounterFieldName(cat);
                updateData[counterField] = increment(-1);
            });
            
            await updateDoc(spotRef, updateData);
            
        } catch (error) {
            console.error('Error removing spot from categories:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to remove spot from categories');
        }
    }

    /**
     * Obtiene las categorías en las que está guardado un spot
     * @param userId ID del usuario
     * @param spotId ID del spot
     * @returns Array de categorías
     */
    async getSpotCategories(userId: string, spotId: string): Promise<SpotCategory[]> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            const savedSpotsRef = collection(userRef, this.SAVED_SPOTS_SUBCOLLECTION);
            
            const q = query(savedSpotsRef, where('spotId', '==', spotId));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return [];
            }
            
            return querySnapshot.docs[0].data().categories || [];
        } catch (error) {
            console.error('Error getting spot categories:', error);
            return [];
        }
    }

    /**
     * Actualiza las categorías de un spot guardado
     * Reemplaza completamente las categorías existentes con las nuevas
     * @param userId ID del usuario
     * @param spotId ID del spot
     * @param newCategories Nuevas categorías
     */
    async updateSpotCategories(userId: string, spotId: string, newCategories: SpotCategory[]): Promise<void> {
        try {
            // Obtener categorías actuales
            const currentCategories = await this.getSpotCategories(userId, spotId);
            
            // Calcular diferencias
            const categoriesToAdd = newCategories.filter(cat => !currentCategories.includes(cat));
            const categoriesToRemove = currentCategories.filter(cat => !newCategories.includes(cat));
            
            // Aplicar cambios
            if (categoriesToRemove.length > 0) {
                await this.removeSpotFromCategories(userId, spotId, categoriesToRemove);
            }
            
            if (categoriesToAdd.length > 0) {
                await this.addSpotToCategories(userId, spotId, categoriesToAdd);
            }
            
            console.log(`[UserRepository] Updated spot ${spotId} categories:`, newCategories);
        } catch (error) {
            console.error('Error updating spot categories:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to update spot categories');
        }
    }

    /**
     * Obtiene el nombre del campo contador según la categoría
     */
    private getCounterFieldName(category: SpotCategory): string {
        switch (category) {
            case 'Favorites':
                return 'favoritesCount';
            case 'Visited':
                return 'visitedCount';
            case 'WantToVisit':
                return 'wantToVisitCount';
            default:
                throw new Error(`Unknown category: ${category}`);
        }
    }

    async getUserFavoriteSports(userId: string): Promise<string[]> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            const favoriteSportsRef = collection(userRef, this.FAVORITE_SPORTS_SUBCOLLECTION);
            
            const querySnapshot = await getDocs(favoriteSportsRef);
            
            return querySnapshot.docs.map(doc => doc.data().sportId);
        } catch (error) {
            console.error('Error getting favorite sports:', error);
            return [];
        }
    }

    async addFavoriteSport(userId: string, sportId: string): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            
            // Verificar que el usuario existe
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            // Agregar a la subcolección favoriteSports
            const favoriteSportsRef = collection(userRef, this.FAVORITE_SPORTS_SUBCOLLECTION);
            const favoriteSportDoc = doc(favoriteSportsRef, sportId);
            
            // Verificar si ya existe
            const existingFavorite = await getDoc(favoriteSportDoc);
            if (existingFavorite.exists()) {
                throw new Error('Sport is already in favorites');
            }
            
            const now = Timestamp.now();
            
            // Agregar el documento a la subcolección
            await setDoc(favoriteSportDoc, {
                sportId: sportId,
                addedAt: now
            });
            
            await updateDoc(userRef, {
                'updatedAt': now
            });
        } catch (error) {
            console.error('Error adding favorite sport:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to add favorite sport');
        }
    }

    async removeFavoriteSport(userId: string, sportId: string): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            
            // Verificar que el usuario existe
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            // Eliminar de la subcolección favoriteSports
            const favoriteSportsRef = collection(userRef, this.FAVORITE_SPORTS_SUBCOLLECTION);
            const favoriteSportDoc = doc(favoriteSportsRef, sportId);
            
            // Verificar si existe antes de eliminar
            const existingFavorite = await getDoc(favoriteSportDoc);
            if (!existingFavorite.exists()) {
                throw new Error('Sport is not in favorites');
            }
            
            const now = Timestamp.now();
            
            // Eliminar el documento de la subcolección
            await deleteDoc(favoriteSportDoc);
            
            await updateDoc(userRef, {
                'updatedAt': now
            });
        } catch (error) {
            console.error('Error removing favorite sport:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to remove favorite sport');
        }
    }

    async followUser(userId: string, targetUserId: string): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            const targetUserRef = doc(firestore, this.USERS_COLLECTION, targetUserId);
            
            // Verificar que ambos usuarios existen
            const [userDoc, targetUserDoc] = await Promise.all([
                getDoc(userRef),
                getDoc(targetUserRef)
            ]);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            if (!targetUserDoc.exists()) {
                throw new Error('Target user not found');
            }
            
            const now = Timestamp.now();
            
            // Agregar targetUserId a la subcolección "following" del usuario actual
            const followingRef = collection(userRef, this.FOLLOWING_SUBCOLLECTION);
            const followingDoc = doc(followingRef, targetUserId);
            
            // Verificar si ya está siguiendo
            const existingFollow = await getDoc(followingDoc);
            if (existingFollow.exists()) {
                throw new Error('Already following this user');
            }
            
            await setDoc(followingDoc, {
                userId: targetUserId,
                followedAt: now
            });
            
            // Agregar userId a la subcolección "followers" del usuario objetivo
            const followersRef = collection(targetUserRef, this.FOLLOWERS_SUBCOLLECTION);
            const followerDoc = doc(followersRef, userId);
            
            await setDoc(followerDoc, {
                userId: userId,
                followedAt: now
            });
            
            // Actualizar contadores
            const currentUserData = userDoc.data() as UserFirebase;
            const targetUserData = targetUserDoc.data() as UserFirebase;
            
            const currentFollowingCount = currentUserData.followingCount || 0;
            const targetFollowersCount = targetUserData.followersCount || 0;
            
            await Promise.all([
                updateDoc(userRef, {
                    'followingCount': currentFollowingCount + 1,
                    'updatedAt': now
                }),
                updateDoc(targetUserRef, {
                    'followersCount': targetFollowersCount + 1,
                    'updatedAt': now
                })
            ]);
            
        } catch (error) {
            console.error('Error following user:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to follow user');
        }
    }

    async unfollowUser(userId: string, targetUserId: string): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            const targetUserRef = doc(firestore, this.USERS_COLLECTION, targetUserId);
            
            // Verificar que ambos usuarios existen
            const [userDoc, targetUserDoc] = await Promise.all([
                getDoc(userRef),
                getDoc(targetUserRef)
            ]);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            if (!targetUserDoc.exists()) {
                throw new Error('Target user not found');
            }
            
            const now = Timestamp.now();
            
            // Eliminar targetUserId de la subcolección "following" del usuario actual
            const followingRef = collection(userRef, this.FOLLOWING_SUBCOLLECTION);
            const followingDoc = doc(followingRef, targetUserId);
            
            // Verificar si realmente está siguiendo
            const existingFollow = await getDoc(followingDoc);
            if (!existingFollow.exists()) {
                throw new Error('Not following this user');
            }
            
            await deleteDoc(followingDoc);
            
            // Eliminar userId de la subcolección "followers" del usuario objetivo
            const followersRef = collection(targetUserRef, this.FOLLOWERS_SUBCOLLECTION);
            const followerDoc = doc(followersRef, userId);
            
            await deleteDoc(followerDoc);
            
            // Actualizar contadores
            const currentUserData = userDoc.data() as UserFirebase;
            const targetUserData = targetUserDoc.data() as UserFirebase;
            
            const currentFollowingCount = currentUserData.followingCount || 0;
            const targetFollowersCount = targetUserData.followersCount || 0;
            
            await Promise.all([
                updateDoc(userRef, {
                    'followingCount': Math.max(0, currentFollowingCount - 1),
                    'updatedAt': now
                }),
                updateDoc(targetUserRef, {
                    'followersCount': Math.max(0, targetFollowersCount - 1),
                    'updatedAt': now
                })
            ]);
            
        } catch (error) {
            console.error('Error unfollowing user:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to unfollow user');
        }
    }

    async uploadProfilePhoto(userId: string, photoUri: string): Promise<string> {
        try {
            const photoRef = ref(this.storage, `users/${userId}/profile.jpeg`);
            const response = await fetch(photoUri);
            
            if (!response.ok) {
                throw new Error('No se pudo cargar la imagen desde la URI proporcionada');
            }
            
            const blob = await response.blob();
            const uploadResult = await uploadBytes(photoRef, blob);
            return await getDownloadURL(uploadResult.ref);
        } catch (error: any) {
            console.error('Error uploading profile photo:', error);
            
            // Si ya es un error con mensaje personalizado, relanzarlo
            if (error?.message && error.message.includes('cargar la imagen')) {
                throw error;
            }
            
            // Manejar errores de Storage
            if (error?.code) {
                switch (error.code) {
                    case 'storage/unauthorized':
                        throw new Error('No tienes permisos para subir esta foto. Verifica tu autenticación.');
                    case 'storage/canceled':
                        throw new Error('La carga de la foto fue cancelada.');
                    case 'storage/unknown':
                        throw new Error('Error desconocido al subir la foto. Por favor, intenta nuevamente.');
                    case 'storage/quota-exceeded':
                        throw new Error('Se ha excedido el límite de almacenamiento. Contacta al administrador.');
                    case 'storage/invalid-format':
                        throw new Error('El formato de la imagen no es válido. Usa JPG, PNG o similar.');
                    default:
                        throw new Error('Error al subir la foto de perfil. Por favor, intenta nuevamente.');
                }
            }
            
            throw new Error('No se pudo subir la foto de perfil');
        }
    }

    async checkUserNameExists(userName: string, excludeUserId?: string): Promise<boolean> {
        try {
            if (!userName || typeof userName !== 'string') {
                throw new Error('Se requiere un nombre de usuario válido');
            }

            // Normalizar userName para comparación case-insensitive
            const normalizedUserName = userName.toLowerCase().trim();
            
            if (normalizedUserName.length === 0) {
                throw new Error('El nombre de usuario no puede estar vacío');
            }

            // Crear consulta para buscar usuarios con el mismo userName
            const usersRef = collection(firestore, this.USERS_COLLECTION);
            const q = query(
                usersRef,
                where('userName', '==', normalizedUserName)
            );

            const querySnapshot = await getDocs(q);
            
            // Si no hay documentos, el userName está disponible
            if (querySnapshot.empty) {
                return false;
            }

            // Si se proporciona excludeUserId, verificar si el único resultado es el usuario actual
            if (excludeUserId) {
                const docs = querySnapshot.docs;
                // Si hay solo un documento y es del usuario actual, el userName está disponible para él
                if (docs.length === 1 && docs[0].id === excludeUserId) {
                    return false;
                }
                // Si hay múltiples documentos o el documento no es del usuario actual, está en uso
                return true;
            }

            // Si hay cualquier documento y no se excluye ningún usuario, está en uso
            return true;
            
        } catch (error: any) {
            console.error('Error checking userName existence:', error);
            
            // Si el error es de validación, relanzarlo
            if (error instanceof Error && (
                error.message.includes('requerido') || 
                error.message.includes('vacío')
            )) {
                throw error;
            }
            
            // Manejar errores de Firestore
            if (error?.code) {
                switch (error.code) {
                    case 'permission-denied':
                        throw new Error('No tienes permisos para verificar nombres de usuario.');
                    case 'unavailable':
                        throw new Error('El servicio no está disponible. Por favor, intenta más tarde.');
                    default:
                        throw new Error('Error al verificar la disponibilidad del nombre de usuario.');
                }
            }
            
            throw new Error('No se pudo verificar la disponibilidad del nombre de usuario');
        }
    }


}