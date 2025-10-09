import { User, UserDetails } from '@/src/types/user';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { firestore } from '../../config/firebase-config';
import { IUserRepository } from '../interfaces/i-user-repository';
import { UserFirebase, UserMapper } from '../mappers/user-mapper';

export class UserRepositoryImpl implements IUserRepository {
    private readonly USERS_COLLECTION = 'users';
    private readonly FAVORITE_SPOTS_SUBCOLLECTION = 'favoriteSpots';
    private readonly FAVORITE_SPORTS_SUBCOLLECTION = 'favoriteSports';
    private readonly FOLLOWERS_SUBCOLLECTION = 'followers';
    private readonly FOLLOWING_SUBCOLLECTION = 'following';
    private readonly storage = getStorage();

    async createUser(userId: string, userData: Partial<UserDetails>): Promise<boolean> {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Validar datos requeridos
            if (!UserMapper.validateUserData(userData)) {
                throw new Error('Email and userName are required');
            }

            // Convertir a formato Firebase usando el mapper
            const newUser: UserFirebase = UserMapper.createUserToFirebase(userData);

            const userRef = doc(firestore, this.USERS_COLLECTION, userId);

            // Crear el documento del usuario
            await setDoc(userRef, newUser);

            return true;
        } catch (error) {
            console.error('Error creating user:', error);
            return false;
        }
    }

    async getUserById(userId: string): Promise<User> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            // Convertir de Firebase a modelo de la aplicación usando el mapper
            const firebaseUser = userDoc.data() as UserFirebase;
            return UserMapper.fromFirebase(firebaseUser, userId);
        } catch (error) {
            console.error('Error getting user:', error);
            throw new Error('Unable to get user');
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
            const firebaseUpdates = UserMapper.updateDataToFirebase(userData);

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

    async getUserFavoriteSpots(userId: string): Promise<string[]> {
        // For now, return empty array since favorites are now handled differently
        // This method might need to be removed or updated to query a separate collection
        return [];
    }

    async addFavoriteSpot(userId: string, spotId: string): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            
            // Verificar que el usuario existe
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            // Agregar a la subcolección favoriteSpots
            const favoriteSpotsRef = collection(userRef, this.FAVORITE_SPOTS_SUBCOLLECTION);
            const favoriteSpotDoc = doc(favoriteSpotsRef, spotId);
            
            // Verificar si ya existe
            const existingFavorite = await getDoc(favoriteSpotDoc);
            if (existingFavorite.exists()) {
                throw new Error('Spot is already in favorites');
            }
            
            const now = new Date();
            
            // Agregar el documento a la subcolección
            await setDoc(favoriteSpotDoc, {
                spotId: spotId,
                addedAt: now
            });
            
            // Incrementar el contador en el documento principal del usuario
            const currentFirebaseUser = userDoc.data() as UserFirebase;
            const currentCount = currentFirebaseUser.favoriteSpotsCount || 0;
            
            await updateDoc(userRef, {
                'favoriteSpotsCount': currentCount + 1,
                'updatedAt': now
            });
        } catch (error) {
            console.error('Error adding favorite spot:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to add favorite spot');
        }
    }

    async removeFavoriteSpot(userId: string, spotId: string): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            
            // Verificar que el usuario existe
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            // Eliminar de la subcolección favoriteSpots
            const favoriteSpotsRef = collection(userRef, this.FAVORITE_SPOTS_SUBCOLLECTION);
            const favoriteSpotDoc = doc(favoriteSpotsRef, spotId);
            
            // Verificar si existe antes de eliminar
            const existingFavorite = await getDoc(favoriteSpotDoc);
            if (!existingFavorite.exists()) {
                throw new Error('Spot is not in favorites');
            }
            
            const now = new Date();
            
            // Eliminar el documento de la subcolección
            await deleteDoc(favoriteSpotDoc);
            
            // Decrementar el contador en el documento principal del usuario
            const currentFirebaseUser = userDoc.data() as UserFirebase;
            const currentCount = currentFirebaseUser.favoriteSpotsCount || 0;
            
            await updateDoc(userRef, {
                'favoriteSpotsCount': Math.max(0, currentCount - 1), // Ensure count doesn't go negative
                'updatedAt': now
            });
        } catch (error) {
            console.error('Error removing favorite spot:', error);
            throw new Error(error instanceof Error ? error.message : 'Unable to remove favorite spot');
        }
    }

    async getUserFavoriteSports(userId: string): Promise<string[]> {
        // For now, return empty array since favorites are now handled differently
        // This method might need to be removed or updated to query a separate collection
        return [];
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
            
            const now = new Date();
            
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
            
            const now = new Date();
            
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
            
            const now = new Date();
            
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
            
            const now = new Date();
            
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
            const photoRef = ref(this.storage, `userMedia/${userId}/profile.jpg`);
            const response = await fetch(photoUri);
            const blob = await response.blob();
            const uploadResult = await uploadBytes(photoRef, blob);
            return await getDownloadURL(uploadResult.ref);
        } catch (error) {
            console.error('Error uploading profile photo:', error);
            throw new Error('Failed to upload profile photo');
        }
    }

    async checkUserNameExists(userName: string, excludeUserId?: string): Promise<boolean> {
        try {
            if (!userName || typeof userName !== 'string') {
                throw new Error('Valid userName is required');
            }

            // Normalizar userName para comparación case-insensitive
            const normalizedUserName = userName.toLowerCase().trim();
            
            if (normalizedUserName.length === 0) {
                throw new Error('UserName cannot be empty');
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
            
        } catch (error) {
            console.error('Error checking userName existence:', error);
            
            // Si el error es de validación, relanzarlo
            if (error instanceof Error && error.message.includes('required') || error instanceof Error && error.message.includes('empty')) {
                throw error;
            }
            
            // Para otros errores, assumir que está en uso para ser conservador
            throw new Error('Unable to verify userName availability');
        }
    }


}