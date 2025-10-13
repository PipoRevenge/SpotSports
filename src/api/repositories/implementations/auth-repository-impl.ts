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
            console.error('Registration error:', error);
            
            if (error?.code) {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        throw new Error('Esta dirección de correo ya está registrada. Por favor, inicia sesión o usa otro email.');
                    case 'auth/weak-password':
                        throw new Error('La contraseña es muy débil. Debe tener al menos 6 caracteres.');
                    case 'auth/invalid-email':
                        throw new Error('Por favor, ingresa una dirección de correo válida.');
                    case 'auth/network-request-failed':
                        throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.');
                    case 'auth/operation-not-allowed':
                        throw new Error('El registro con email/contraseña no está habilitado. Contacta al administrador.');
                    case 'auth/too-many-requests':
                        throw new Error('Demasiados intentos fallidos. Por favor, intenta más tarde.');
                    default:
                        throw new Error('Error al crear la cuenta. Por favor, intenta nuevamente.');
                }
            }
            throw new Error('Error inesperado al registrar usuario. Por favor, intenta nuevamente.');
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