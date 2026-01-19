import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../../lib/firebase-config';
import { AuthSessionData, IAuthRepository } from '../interfaces/i-auth-repository';
import { logRepositoryError, parseFirebaseError } from '../utils/firebase-parsers';

export class AuthRepositoryImpl implements IAuthRepository {
    private readonly USERS_COLLECTION = 'users';
    
    onAuthStateChanged(callback: (userId: string | null) => void): () => void {
        return onAuthStateChanged(auth, (user) => {
            callback(user ? user.uid : null);
        });
    }

    async login(email: string, password: string): Promise<string> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user.uid;
        } catch (error: any) {
            console.error('Login error:', error);
            if (error?.code) {
                switch (error.code) {
                    case 'auth/network-request-failed':
                        throw new Error('Network connection error. Please check your internet connection.');
                    case 'auth/invalid-credential':
                        throw new Error('Invalid email or password');
                    default: {
                        const parsed = parseFirebaseError(error);
                        logRepositoryError('auth.login', { email }, error);
                        throw new Error(parsed.message);
                    }
                }
            }
            const parsed = parseFirebaseError(error);
            logRepositoryError('auth.login', { email }, error);
            throw new Error(parsed.message);
        }
    }

    async register(email: string, password: string): Promise<string> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return userCredential.user.uid;
        } catch (error: any) {
            console.error('Registration error:', error);
            if (error?.code) {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        throw new Error('This email address is already registered. Please sign in or use another email.');
                    case 'auth/weak-password':
                        throw new Error('The password is too weak. It must be at least 6 characters.');
                    case 'auth/invalid-email':
                        throw new Error('Please enter a valid email address.');
                    case 'auth/network-request-failed':
                        throw new Error('Could not connect to the server. Check your internet connection and try again.');
                    case 'auth/operation-not-allowed':
                        throw new Error('Email/password signup is disabled. Contact the administrator.');
                    case 'auth/too-many-requests':
                        throw new Error('Too many failed attempts. Please try again later.');
                    default: {
                        const parsed = parseFirebaseError(error);
                        logRepositoryError('auth.register', { email }, error);
                        throw new Error(parsed.message);
                    }
                }
            }
            const parsed = parseFirebaseError(error);
            logRepositoryError('auth.register', { email }, error);
            throw new Error(parsed.message);
        }
    }

    async logout(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            const parsed = parseFirebaseError(error);
            logRepositoryError('auth.logout', {}, error);
            throw new Error(parsed.message);
        }
    }

    async checkAuth(): Promise<boolean> {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(!!user);
            });
        });
    }

    async getIdToken(forceRefresh = false): Promise<string | null> {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;
        try {
            return await currentUser.getIdToken(forceRefresh);
        } catch (error) {
            console.error('Error obtaining ID token:', error);
            const parsed = parseFirebaseError(error);
            logRepositoryError('auth.getIdToken', {}, error);
            return null;
        }
    }

    async getSessionData(): Promise<AuthSessionData | null> {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return null;

            const token = await currentUser.getIdToken();
            const tokenResult = await currentUser.getIdTokenResult();
            
            // Firebase tokens expire in 1 hour
            const expiresAt = new Date(tokenResult.expirationTime).getTime();
            
            return {
                userId: currentUser.uid,
                token,
                refreshToken: currentUser.refreshToken,
                expiresAt
            };
        } catch (error) {
            console.error('Error getting session data:', error);
            const parsed = parseFirebaseError(error);
            logRepositoryError('auth.getSessionData', {}, error);
            return null;
        }
    }

    async refreshToken(): Promise<string | null> {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return null;
            
            // Force token refresh
            return await currentUser.getIdToken(true);
        } catch (error) {
            console.error('Error refreshing token:', error);
            const parsed = parseFirebaseError(error);
            logRepositoryError('auth.refreshToken', {}, error);
            return null;
        }
    }

    getCurrentUserId(): string | null {
        return auth.currentUser?.uid || null;
    }

    async waitForUserDocument(
        userId: string, 
        maxAttempts: number = 10, 
        delayMs: number = 1000
    ): Promise<boolean> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const userRef = doc(firestore, this.USERS_COLLECTION, userId);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                    console.log(`User document found on attempt ${attempt}`);
                    return true;
                }
                
                // If not last attempt, wait before retrying
                if (attempt < maxAttempts) {
                    console.log(`User document not found, attempt ${attempt}/${maxAttempts}. Retrying in ${delayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            } catch (error) {
                console.error(`Error checking user document (attempt ${attempt}):`, error);
                
                // If not last attempt, wait before retrying
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }
        
        console.error(`User document not found after ${maxAttempts} attempts`);
        return false;
    }
}