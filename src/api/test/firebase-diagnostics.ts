import { auth, firestore, functions } from '@/src/lib/firebase-config';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export const FirebaseDiagnostics = {
  checkAuth: async () => {
    try {
      const user = auth.currentUser;
      if (!user) return { status: 'logged_out' };
      
      const tokenResult = await user.getIdTokenResult();
      return {
        status: 'logged_in',
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        claims: tokenResult.claims,
        tokenExpirationTime: tokenResult.expirationTime
      };
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  },

  checkFirestoreRead: async (collectionName: string) => {
    try {
      const colRef = collection(firestore, collectionName);
      const q = query(colRef, limit(1));
      const snapshot = await getDocs(q);
      return { success: true, count: snapshot.size, empty: snapshot.empty };
    } catch (error: any) {
      return { success: false, error: error.message, code: error.code };
    }
  },

  checkFirestoreWrite: async (collectionName: string) => {
    try {
      const colRef = collection(firestore, collectionName);
      const docRef = await addDoc(colRef, {
        _diagnostic_test: true,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || 'anonymous'
      });
      
      // Try to clean up
      try {
        await deleteDoc(doc(firestore, collectionName, docRef.id));
      } catch (cleanupError) {
        console.warn('Could not cleanup test doc:', cleanupError);
      }
      
      return { success: true, id: docRef.id };
    } catch (error: any) {
      return { success: false, error: error.message, code: error.code };
    }
  },

  checkCloudFunction: async (functionName: string, data: any = {}) => {
    try {
      const fn = httpsCallable(functions, functionName);
      const result = await fn(data);
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: error.message, code: error.codeDetails || error.code };
    }
  }
};
