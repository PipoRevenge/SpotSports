import { functions } from '@/src/lib/firebase-config';
import { httpsCallable } from 'firebase/functions';

export class TestNotifications {
  static async sendTestPush(): Promise<{ success: boolean; error?: string; count?: number }> {
    try {
      const sendTestPushFn = httpsCallable<void, { success: boolean; tokenCount: number }>(
        functions,
        'notifications_sendTestPush'
      );
      
      const result = await sendTestPushFn();
      const data = result.data;
      
      return { 
        success: data.success, 
        count: data.tokenCount 
      };
    } catch (error: any) {
      console.error('Error sending test push:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      };
    }
  }
}
