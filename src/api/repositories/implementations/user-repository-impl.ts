import { User, UserDetails } from '@/src/types/user';
import {
    arrayRemove,
    arrayUnion,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { firestore } from '../../config/firebase-config';
import { IUserRepository } from '../interfaces/i-user-repository';

interface UserFirebase {
    userDetails: UserDetails;
    metadata: {
        createdAt: Date;
        updatedAt: Date;
    };
    isVerified: false;
}



export class UserRepositoryImpl implements IUserRepository {
    private readonly USERS_COLLECTION = 'users';
    private readonly storage = getStorage();

    

    async createUser(userId: string, userData: Partial<UserDetails>): Promise<boolean> {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const newUser: UserFirebase = {
                
                userDetails: {
                    email: userData.email || "",
                    userName: userData.userName || "",
                    photoURL: userData.photoURL || "",
                    fullName: userData.fullName || "",
                    bio: userData.bio || "",
                    birthDate: userData.birthDate || "",
                    phoneNumber: userData.phoneNumber || "",
                } as UserDetails,
                
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                isVerified: false,
            };

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
            
            return userDoc.data() as User;
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

            const currentUser = userDoc.data() as User;
            
            // Handle profile photo upload if photoURL is a local file
            let photoURL = userData.userDetails?.photoURL;
            if (photoURL && photoURL.startsWith('file://')) {
                try {
                    photoURL = await this.uploadProfilePhoto(userId, photoURL);
                } catch (photoError) {
                    console.error('Error uploading profile photo:', photoError);
                    // Continue with update but without the photo
                    photoURL = currentUser.userDetails.photoURL;
                }
            }

            const updatedUser = {
                ...currentUser,
                ...userData,
                userDetails: {
                    ...currentUser.userDetails,
                    ...userData.userDetails,
                    ...(photoURL && { photoURL })
                },
                metadata: {
                    ...currentUser.metadata,
                    updatedAt: new Date()
                }
            };

            await updateDoc(userRef, updatedUser);
            return updatedUser as User;
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
                'activity.favoriteSpots': arrayUnion(spotId)
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
                'activity.favoriteSpots': arrayRemove(spotId)
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
                'activity.favoriteSports': arrayUnion(sportId)
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
                'activity.favoriteSports': arrayRemove(sportId)
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
}