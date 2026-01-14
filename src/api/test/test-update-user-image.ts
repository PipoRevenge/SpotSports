import { auth, functions, storage } from '@/src/lib/firebase-config';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

export const TestUpdateUser = {
  // Test 1: Update basic profile via Cloud Function
  updateProfile: async () => {
    try {
      if (!auth.currentUser) return { success: false, error: 'No user logged in' };
      
      console.log('[Test] Updating profile via cloud function...');
      const completeProfileFn = httpsCallable(functions, 'users_completeProfile');
      
      const testData = {
        fullName: 'Test User ' + Math.floor(Math.random() * 1000),
        userName: 'tester_' + Math.floor(Math.random() * 10000), // Random unique username
        bio: 'This is a test bio updated at ' + new Date().toISOString()
      };

      const result = await completeProfileFn(testData);
      return { success: true, data: result.data };
    } catch (error: any) {
      console.error('[Test] Profile update failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test 2: Upload image directly to Storage (Client-side)
  uploadImageClientSide: async (base64String: string) => {
    try {
      if (!auth.currentUser) return { success: false, error: 'No user logged in' };
      
      console.log('[Test] Uploading image client-side (base64)...');
      const userId = auth.currentUser.uid;
      const timestamp = Date.now();
      const path = `users/${userId}/profile_${timestamp}.jpg`;
      
      const storageRef = ref(storage, path);
      // Using uploadString avoids the React Native fetch(data:...) failure
      const result = await uploadString(storageRef, base64String, 'base64', {
        contentType: 'image/gif'
      });
      const url = await getDownloadURL(result.ref);
      
      return { success: true, url, path };
    } catch (error: any) {
      console.error('[Test] Client-side upload failed:', error);
      return { success: false, error: error.code || error.message };
    }
  },

  // Test 3: Generate a dummy image base64 for testing
  createDummyImage: async () => {
    // 1x1 pixel transparent GIF base64
    return 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  },

  // Test 4: Get specific test image
  getTestImage: async () => {
      try {
          // Path derived from user request: gs://spotshare-dd707.firebasestorage.app/users/v4RY8sg9l7MWvntbUHsp1tNzBHV2/unnamed.jpg
          const path = 'users/v4RY8sg9l7MWvntbUHsp1tNzBHV2/unnamed.jpg';
          console.log('[Test] Getting download URL for:', path);
          
          if (!auth.currentUser) {
              console.warn('[Test] Warning: No user logged in, but attempting read anyway to test rules.');
          }

          const storageRef = ref(storage, path);
          const url = await getDownloadURL(storageRef);
          console.log('[Test] Download URL success:', url);
          return { success: true, url };
      } catch (error: any) {
          console.error('[Test] Get test image failed:', error);
          return { success: false, error: error.code || error.message };
      }
  }
};
