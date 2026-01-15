import { SavedSpot, SpotCategory } from '@/src/entities/user/model/spot-collection';
import { User, UserDetails } from '@/src/entities/user/model/user';
import {
    collection,
    deleteDoc,
    doc,
    limit as firestoreLimit,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, firestore, functions } from '../../../lib/firebase-config';
import { uploadFileFromUri } from '../../lib/storage-service';
import { IUserRepository } from '../interfaces/i-user-repository';
import { UserFirebase, UserMapper } from '../mappers/user-mapper';

export class UserRepositoryImpl implements IUserRepository {
    private readonly USERS_COLLECTION = 'users';
    // Subcollections bajo users/{userId}
    private readonly FOLLOWERS_SUBCOLLECTION = 'followers';
    private readonly FOLLOWING_SUBCOLLECTION = 'following';
    private readonly SAVED_SPOTS_SUBCOLLECTION = 'saved_spots';
    private readonly FAVORITE_SPORTS_SUBCOLLECTION = 'favoriteSports';


    private async batchGetUsersByIds(ids: string[]): Promise<User[]> {
        if (!ids || ids.length === 0) return [];
        const MAX_IN_CLAUSE = 10; // Firestore IN operator supports up to 10
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += MAX_IN_CLAUSE) {
            chunks.push(ids.slice(i, i + MAX_IN_CLAUSE));
        }

        const results: User[] = [];
        for (const chunk of chunks) {
            const q = query(collection(firestore, this.USERS_COLLECTION), where('__name__', 'in', chunk));
            const snapshot = await getDocs(q);
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as UserFirebase;
                results.push(UserMapper.fromFirebase(data, docSnap.id));
            });
        }
        return results;
    }

    async createUser(userId: string, userData: Partial<UserDetails>): Promise<boolean> {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es requerido');
            }

            // Validar datos requeridos
            if (!userData.email || !userData.userName) {
                throw new Error('El email y nombre de usuario son requeridos');
            }

            // Call cloud function to complete profile - REMOVED due to persistent 'unauthenticated' errors
            // Switching to direct client-side write as per updated firestore.rules
    
            const now = Timestamp.now();
            
            // Prepare data using the same logic as the cloud function
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            
            // We use setDoc with merge: true to respect any data created by the onCreate trigger
            // But we ensure all required fields are present
            const firebaseUser: any = {
                email: userData.email,
                userName: userData.userName,
                fullName: userData.fullName || "",
                bio: userData.bio || "",
                profileUrl: userData.photoURL || "",
                phoneNumber: userData.phoneNumber || "",
                updatedAt: now,
                // Ensure counters exist (if not already there from onCreate)
                reviewsCount: 0,
                commentsCount: 0,
                discussionsCount: 0,
                favoriteSpotsCount: 0,
                followersCount: 0,
                followingCount: 0,
                isVerified: false
            };

            if (userData.birthDate) {
                 firebaseUser.birthDate = userData.birthDate instanceof Date ? Timestamp.fromDate(userData.birthDate) : userData.birthDate;
            }

            // We also set createdAt only if it doesn't exist (handled by merge, but if doc is missing, we need it)
            // Since we can't easily check for existence without reading first, and we want to optimize...
            // We'll just define createdAt if we are creating. 
            // Better strategy: Read first to be safe? No, let's just use set with merge.
            // If it's a new doc, we want createdAt.
            firebaseUser.createdAt = now; 

            // IMPORTANT: We use setDoc with merge: true. 
            // If the doc exists (from onCreate), it updates it.
            // If it doesn't, it creates it.
            await setDoc(userRef, firebaseUser, { merge: true });

            console.log('User profile created successfully via client-side write');
            return true;
        } catch (error: any) {
            console.error('Error creating user:', error);
            
            // Handle specific errors
            if (error?.code === 'permission-denied') {
                throw new Error('No tienes permisos para crear este usuario. Verifica tu sesión.');
            }
            
            throw error;
        }
    }

    async getUserById(userId: string | any): Promise<User> {
        const userIdRaw = userId;
        try {
            // Normalize the input: accept string IDs, DocumentReference-like objects, or objects with path/id
            let resolvedId: any = userId;

            if (!resolvedId) {
                throw new Error('User ID is required');
            }

            if (typeof resolvedId !== 'string') {
                // Firestore DocumentReference has an `id` prop
                if (resolvedId.id && typeof resolvedId.id === 'string') {
                    resolvedId = resolvedId.id;
                } else if (resolvedId.path && typeof resolvedId.path === 'string') {
                    const parts = resolvedId.path.split('/');
                    resolvedId = parts[parts.length - 1];
                } else if (resolvedId.__name__ && typeof resolvedId.__name__ === 'string') {
                    // Some internal representations expose __name__
                    resolvedId = resolvedId.__name__;
                } else if (resolvedId._key && resolvedId._key.path) {
                    // Firestore internal structure
                    const segs = resolvedId._key.path.segments || resolvedId._key.path;
                    if (segs) {
                      if (Array.isArray(segs)) resolvedId = segs[segs.length - 1];
                      else if (typeof segs === 'string') {
                        const parts = segs.split('/');
                        resolvedId = parts[parts.length - 1];
                      }
                    } else {
                      resolvedId = String(resolvedId);
                    }
                } else {
                    // Fallback to string coercion
                    resolvedId = String(resolvedId);
                }
            }

            // Reject clearly invalid string coercions like "[object Object]"
            if (typeof resolvedId === 'string' && resolvedId.startsWith('[object')) {
                console.warn('[UserRepository] Received suspicious userId after normalization', { userIdRaw });
                throw new Error('Invalid user id format');
            }

            const userRef = doc(firestore, this.USERS_COLLECTION, resolvedId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            // Convertir de Firebase a modelo de la aplicación usando el mapper
            const firebaseUser = userDoc.data() as UserFirebase;
            return UserMapper.fromFirebase(firebaseUser, resolvedId);
        } catch (error: any) {
            console.error('Error getting user:', error, { userIdRaw });
            
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

    async getUserByUserName(userName: string): Promise<User | null> {
        try {
            const usersRef = collection(firestore, this.USERS_COLLECTION);
            const q = query(usersRef, where('userName', '==', userName), firestoreLimit(1));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;
            const docSnap = snapshot.docs[0];
            const firebaseUser = docSnap.data() as UserFirebase;
            return UserMapper.fromFirebase(firebaseUser, docSnap.id);
        } catch (error) {
            console.error('Error getting user by username:', error);
            throw new Error('Unable to get user by username');
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
        // Only allow reading own saved spots from client SDK. For other users, a callable function (admin) should be used.
        const waitForAuth = async (timeoutMs = 3000) => {
            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                if (auth?.currentUser) return auth.currentUser;
                // small delay
                await new Promise((r) => setTimeout(r, 200));
            }
            return null;
        };

        let currentUser = auth?.currentUser || null;
        try {
            // Wait briefly for auth to initialize (avoids race conditions on cold start)
            if (!currentUser) {
                currentUser = await waitForAuth(3000);
            }

            const currentUid = currentUser?.uid || null;

            if (!currentUid) {
                console.warn('[UserRepository] getUserSavedSpots blocked: unauthenticated request', { userId });
                throw new Error('User not authenticated');
            }

            if (userId !== currentUid) {
                console.warn('[UserRepository] getUserSavedSpots blocked: UID mismatch', { requestedUserId: userId, currentUid });
                throw new Error('Insufficient permissions to access saved spots of other users');
            }

            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            const savedSpotsRef = collection(userRef, this.SAVED_SPOTS_SUBCOLLECTION);
            
            let q;
            if (category) {
                q = query(savedSpotsRef, where('categories', 'array-contains', category));
            } else {
                q = query(savedSpotsRef);
            }

            // Retry once if permission-denied occurs due to auth timing
            let querySnapshot;
            try {
                querySnapshot = await getDocs(q);
            } catch (err: any) {
                console.warn('[UserRepository] getUserSavedSpots getDocs failed, retrying once', { category, err });
                // Wait a short moment then retry
                await new Promise((r) => setTimeout(r, 200));
                querySnapshot = await getDocs(q);
            }

            const savedSpots: SavedSpot[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    spotId: data.spotId || doc.id,
                    categories: data.categories || [],
                    createdAt: data.savedAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || data.savedAt?.toDate() || new Date(),
                };
            });
            
            return savedSpots;
        } catch (error: any) {
            console.error('Error getting user saved spots:', error, { userId, currentUid: auth?.currentUser?.uid || null });

            // Convert auth/permission errors into user-friendly messages
            if (error?.message && (error.message.includes('User not authenticated') || error.message.includes('Insufficient permissions'))) {
                throw new Error('No tienes permisos para ver los spots guardados. Asegúrate de estar autenticado y que sea tu cuenta.');
            }

            if (error?.code === 'permission-denied') {
                throw new Error('No tienes permisos para ver los spots guardados.');
            }

            throw new Error('Unable to get user saved spots');
        }
    }

    async getFollowers(userId: string, options?: { limit?: number; startAfter?: any }): Promise<{ items: User[]; lastVisible?: any }> {
        try {
            const limit = options?.limit || 20;
            // ESTRUCTURA: users/{userId}/followers/{followerId}
            const followersRef = collection(firestore, this.USERS_COLLECTION, userId, this.FOLLOWERS_SUBCOLLECTION);
            let q = query(
                followersRef,
                orderBy('createdAt', 'desc')
            );
            if (options?.startAfter) {
                q = query(
                    followersRef,
                    where('createdAt', '<', options.startAfter),
                    orderBy('createdAt', 'desc')
                );
            }
            q = query(q as any, firestoreLimit(limit));
            const snapshot = await getDocs(q);
            // El ID del documento es el followerId
            const followerIds: string[] = snapshot.docs.map(d => d.id);
            const users = await this.batchGetUsersByIds(followerIds);
            const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.data().createdAt;
            return { items: users, lastVisible };
        } catch (error) {
            console.error('Error getting followers:', error);
            throw new Error('Unable to get followers');
        }
    }

    async getFollowing(userId: string, options?: { limit?: number; startAfter?: any }): Promise<{ items: User[]; lastVisible?: any }> {
        try {
            const limit = options?.limit || 20;
            // ESTRUCTURA: users/{userId}/following/{followedId}
            const followingRef = collection(firestore, this.USERS_COLLECTION, userId, this.FOLLOWING_SUBCOLLECTION);
            let q = query(
                followingRef,
                orderBy('createdAt', 'desc')
            );
            if (options?.startAfter) {
                q = query(
                    followingRef,
                    where('createdAt', '<', options.startAfter),
                    orderBy('createdAt', 'desc')
                );
            }
            q = query(q as any, firestoreLimit(limit));
            const snapshot = await getDocs(q);
            // El ID del documento es el followedId
            const followedIds: string[] = snapshot.docs.map(d => d.id);
            const users = await this.batchGetUsersByIds(followedIds);
            const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.data().createdAt;
            return { items: users, lastVisible };
        } catch (error) {
            console.error('Error getting following:', error);
            throw new Error('Unable to get following');
        }
    }

    /**
     * Añade categorías a un spot guardado (o crea el spot guardado si no existe)
     * Usa cloud function para manejar la lógica de negocio en el backend
     * @param userId ID del usuario
     * @param spotId ID del spot
     * @param categories Array de categorías a añadir
     */
    async addSpotToCategories(userId: string, spotId: string, categories: SpotCategory[]): Promise<void> {
        try {
            const saveSpotFn = httpsCallable(functions, 'users-saveSpot');
            const unsaveSpotFn = httpsCallable(functions, 'users-unsaveSpot');
            
            // Procesar cada categoría individualmente con toggle behavior
            const results = await Promise.allSettled(
                categories.map(async (category) => {
                    try {
                        await saveSpotFn({ spotId, category });
                    } catch (error: any) {
                        // Si ya existe, hacer toggle (quitar en vez de agregar)
                        // Firebase Functions HttpsError tiene la propiedad 'code'
                        if (error?.code === 'already-exists') {
                            await unsaveSpotFn({ spotId, category });
                        } else {
                            throw error;
                        }
                    }
                })
            );
            
            // Verificar si hubo algún error no manejado
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                const firstError = (failures[0] as PromiseRejectedResult).reason;
                throw firstError;
            }
        } catch (error) {
            console.error('Error adding spot to categories:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to add spot to categories');
        }
    }

    /**
     * Elimina categorías de un spot guardado
     * Usa cloud function para manejar la lógica de negocio en el backend
     * @param userId ID del usuario
     * @param spotId ID del spot
     * @param categories Array de categorías a eliminar
     */
    async removeSpotFromCategories(userId: string, spotId: string, categories: SpotCategory[]): Promise<void> {
        try {
            const unsaveSpotFn = httpsCallable(functions, 'users-unsaveSpot');
            
            // La cloud function espera una categoría a la vez
            // Usamos Promise.allSettled para que si una categoría no existe, las otras se eliminen igual
            const results = await Promise.allSettled(
                categories.map(category => unsaveSpotFn({ spotId, category }))
            );
            
            // Verificar si todas fallaron
            const allFailed = results.every(r => r.status === 'rejected');
            if (allFailed) {
                const firstError = results[0] as PromiseRejectedResult;
                throw firstError.reason;
            }
            
            // Si algunas fallaron pero otras no, registrar las que fallaron pero continuar
            const failed = results.filter(r => r.status === 'rejected');
            if (failed.length > 0) {
                console.warn('[removeSpotFromCategories] Some categories failed:', 
                    failed.map((f, i) => ({ category: categories[i], error: (f as PromiseRejectedResult).reason }))
                );
            }
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
            const savedSpotRef = doc(userRef, this.SAVED_SPOTS_SUBCOLLECTION, spotId);
            const spotSnap = await getDoc(savedSpotRef);
            
            if (spotSnap.exists()) {
                const data = spotSnap.data();
                return data.categories || [];
            }
            
            return [];
        } catch (error) {
            console.error('Error getting spot categories:', error);
            return [];
        }
    }

    async getAllUsers(options?: { limit?: number; startAfter?: any }): Promise<{ items: User[]; lastVisible?: any }> {
        try {
            const usersRef = collection(firestore, this.USERS_COLLECTION);
            // Order by creation date desc
            const _limit = options?.limit || 50;
            let qLimited = query(usersRef, orderBy('createdAt', 'desc'), firestoreLimit(_limit));
            if (options?.startAfter) {
                qLimited = query(usersRef, where('createdAt', '<', options.startAfter), orderBy('createdAt', 'desc'), firestoreLimit(_limit));
            }
            const querySnapshot = await getDocs(qLimited);
            const items = querySnapshot.docs.map(docSnap => {
                const firebaseUser = docSnap.data() as any;
                return UserMapper.fromFirebase(firebaseUser, docSnap.id);
            });
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]?.data().createdAt;
            return { items, lastVisible };
        } catch (error) {
            console.error('Error getting all users:', error);
            throw new Error('Unable to get users');
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
            const followUserFn = httpsCallable(functions, 'users-follow');
            await followUserFn({ targetUserId });
        } catch (error) {
            console.error('Error following user:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to follow user');
        }
    }

    async unfollowUser(userId: string, targetUserId: string): Promise<void> {
        try {
            const unfollowUserFn = httpsCallable(functions, 'users-unfollow');
            await unfollowUserFn({ targetUserId });
        } catch (error) {
            console.error('Error unfollowing user:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to unfollow user');
        }
    }

    async isFollowing(followerId: string, followedId: string): Promise<boolean> {
        try {
            // ESTRUCTURA: users/{followerId}/following/{followedId}
            const followingDocRef = doc(firestore, this.USERS_COLLECTION, followerId, this.FOLLOWING_SUBCOLLECTION, followedId);
            const followingDoc = await getDoc(followingDocRef);
            return followingDoc.exists();
        } catch (error) {
            console.error('Error checking following status:', error);
            throw new Error('Unable to check following status');
        }
    }

    async uploadProfilePhoto(userId: string, photoUri: string): Promise<string> {
        try {
            console.log(`[uploadProfilePhoto] Starting upload for ${userId}, uri: ${photoUri}`);
            
            const extension = photoUri.split('.').pop()?.toLowerCase() || 'jpeg';
            const path = `users/${userId}/profile.${extension}`;
            
            // Use the centralized storage service
            const downloadUrl = await uploadFileFromUri(path, photoUri);
            
            console.log('[uploadProfilePhoto] Upload success');
            return downloadUrl;
        } catch (error: any) {
            console.error('[uploadProfilePhoto] Critical Error:', error);
            
            if (error?.code) {
                switch (error.code) {
                    case 'storage/unauthorized':
                        throw new Error('No tienes permisos para subir esta foto. Verifica tu autenticación.');
                    case 'storage/canceled':
                        throw new Error('La carga de la foto fue cancelada.');
                    case 'storage/unknown':
                        throw new Error(`Error desconocido al subir la foto: ${error.message}`);
                    case 'storage/quota-exceeded':
                        throw new Error('Se ha excedido el límite de almacenamiento. Contacta al administrador.');
                    case 'storage/invalid-format':
                        throw new Error('El formato de la imagen no es válido. Usa JPG, PNG o similar.');
                    case 'storage/object-not-found':
                        throw new Error('No se pudo encontrar el archivo a subir.');
                    default:
                        // Si el error ya tiene un mensaje descriptivo (ej: throw new Error...), lo mantenemos
                        if (error.message && !error.message.startsWith('Firebase Storage:')) {
                            throw error;
                        }
                        throw new Error('Error al subir la foto de perfil. Por favor, intenta nuevamente.');
                }
            }
            
            throw error;
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