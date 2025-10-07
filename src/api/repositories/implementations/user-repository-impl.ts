import { User, UserDetails } from '@/src/types/user';
import {
    arrayRemove,
    arrayUnion,
    collection,
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
        const user = await this.getUserById(userId);
        return user.activity?.favoriteSpots || [];
    }

    async addFavoriteSpot(userId: string, spotId: string): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            await updateDoc(userRef, {
                'favoriteSpots': arrayUnion(spotId),
                'updatedAt': new Date()
            });
        } catch (error) {
            console.error('Error adding favorite spot:', error);
            throw new Error('Unable to add favorite spot');
        }
    }

    async removeFavoriteSpot(userId: string, spotId: string): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            await updateDoc(userRef, {
                'favoriteSpots': arrayRemove(spotId),
                'updatedAt': new Date()
            });
        } catch (error) {
            console.error('Error removing favorite spot:', error);
            throw new Error('Unable to remove favorite spot');
        }
    }

    async getUserFavoriteSports(userId: string): Promise<string[]> {
        const user = await this.getUserById(userId);
        return user.activity?.favoriteSports || [];
    }

    async addFavoriteSport(userId: string, sportId: string): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            await updateDoc(userRef, {
                'favoriteSports': arrayUnion(sportId),
                'updatedAt': new Date()
            });
        } catch (error) {
            console.error('Error adding favorite sport:', error);
            throw new Error('Unable to add favorite sport');
        }
    }

    async removeFavoriteSport(userId: string, sportId: string): Promise<void> {
        try {
            const userRef = doc(firestore, this.USERS_COLLECTION, userId);
            await updateDoc(userRef, {
                'favoriteSports': arrayRemove(sportId),
                'updatedAt': new Date()
            });
        } catch (error) {
            console.error('Error removing favorite sport:', error);
            throw new Error('Unable to remove favorite sport');
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