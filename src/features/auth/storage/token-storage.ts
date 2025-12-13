import * as SecureStore from 'expo-secure-store';

// SecureStore keys must be alphanumeric, '.', '-', '_'
const TOKEN_KEY = 'sp_auth_token';

export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store auth token securely:', error);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to read auth token:', error);
    return null;
  }
};

export const clearAuthToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
};
