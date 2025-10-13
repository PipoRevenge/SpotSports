import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { auth } from '../../../lib/firebase-config';
import { IAuthRepository } from '../interfaces/i-auth-repository';

export class AuthRepositoryImpl implements IAuthRepository {
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
            if (error?.code) {
                switch (error.code) {
                    case 'auth/network-request-failed':
                        throw new Error('Network connection error. Please check your internet connection.');
                    case 'auth/invalid-credential':
                        throw new Error('Invalid email or password');
                    default:
                        console.error('Login error:', error);
                        throw new Error('Authentication failed');
                }
            }
            throw error;
        }
    }

    async register(email: string, password: string): Promise<string> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return userCredential.user.uid;
        } catch (error: any) {
            if (error?.code) {
                switch (error.code) {
                    case 'auth/network-request-failed':
                        throw new Error('Network connection error. Please check your internet connection.');
                    case 'auth/email-already-in-use':
                        throw new Error('Email already registered');
                    case 'auth/invalid-email':
                        throw new Error('Invalid email format');
                    case 'auth/weak-password':
                        throw new Error('Password is too weak');
                    default:
                        console.error('Registration error:', error);
                        throw new Error('Registration failed');
                }
            }
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw new Error('Unable to logout');
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
}