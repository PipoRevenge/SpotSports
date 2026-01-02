import { storage } from "@/src/lib/firebase-config";
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from "firebase/storage";
import { parseFirebaseError } from "../repositories/utils/firebase-parsers";

/**
 * Storage Service
 * 
 * Abstraction layer for Firebase Storage operations.
 * All Firebase Storage calls should go through this service.
 */

/**
 * Resolves a storage path to a downloadable URL
 * 
 * @param path - Firebase Storage path or URL
 * @returns Promise with the resolved URL
 */
export const resolveStorageUrl = async (path: string): Promise<string> => {
  try {
    // If already a URL, return as-is
    if (
      path.startsWith('http://') || 
      path.startsWith('https://') ||
      path.includes('firebasestorage.googleapis.com')
    ) {
      return path;
    }

    // Resolve from Firebase Storage
    console.log('[StorageService:resolveStorageUrl] Resolving path:', path);
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    console.log('[StorageService:resolveStorageUrl] Resolved URL:', url);
    return url;
  } catch (error) {
    const parsedError = parseFirebaseError(error);
    console.error('[StorageService:resolveStorageUrl] Failed to resolve URL', {
      path,
      error: parsedError,
    });
    throw error;
  }
};

/**
 * Resolves multiple storage paths to downloadable URLs
 * 
 * @param paths - Array of Firebase Storage paths or URLs
 * @returns Promise with array of resolved URLs
 */
export const resolveStorageUrls = async (paths: string[]): Promise<string[]> => {
  return Promise.all(
    paths.map(async (path) => {
      try {
        return await resolveStorageUrl(path);
      } catch (error) {
        console.warn('[StorageService] Error resolving URL for:', path, error);
        return path; // Return original path on error
      }
    })
  );
};

/**
 * Uploads a file to Firebase Storage
 * 
 * @param path - Destination path in Firebase Storage
 * @param file - File blob to upload
 * @returns Promise with the download URL of the uploaded file
 */
export const uploadFile = async (path: string, file: Blob): Promise<string> => {
  const startTime = Date.now();
  console.log('[StorageService:uploadFile] Starting upload', {
    path,
    size: file.size,
    type: file.type,
  });

  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    
    const duration = Date.now() - startTime;
    console.log('[StorageService:uploadFile] Upload completed', {
      path,
      url,
      size: file.size,
      durationMs: duration,
    });
    
    return url;
  } catch (error) {
    const duration = Date.now() - startTime;
    const parsedError = parseFirebaseError(error);
    console.error('[StorageService:uploadFile] Upload failed', {
      path,
      size: file.size,
      durationMs: duration,
      error: parsedError,
    });
    throw error;
  }
};

/**
 * Uploads a file from a local URI to Firebase Storage
 * 
 * @param path - Destination path in Firebase Storage
 * @param uri - Local file URI
 * @returns Promise with the download URL of the uploaded file
 */
export const uploadFileFromUri = async (path: string, uri: string): Promise<string> => {
  console.log('[StorageService:uploadFileFromUri] Fetching file from URI', { path, uri });
  
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URI: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('[StorageService:uploadFileFromUri] File fetched, uploading...', {
      path,
      size: blob.size,
      type: blob.type,
    });
    
    return await uploadFile(path, blob);
  } catch (error) {
    const parsedError = parseFirebaseError(error);
    console.error('[StorageService:uploadFileFromUri] Failed', {
      path,
      uri,
      error: parsedError,
    });
    throw error;
  }
};

/**
 * Deletes a file from Firebase Storage
 * 
 * @param path - Path of the file to delete in Firebase Storage
 */
export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

/**
 * Lists all files in a directory
 * 
 * @param path - Directory path in Firebase Storage
 * @returns Promise with array of file paths
 */
export const listFiles = async (path: string): Promise<string[]> => {
  const storageRef = ref(storage, path);
  const result = await listAll(storageRef);
  return result.items.map(item => item.fullPath);
};

/**
 * Gets the storage reference for a path
 * 
 * @param path - Path in Firebase Storage
 * @returns Storage reference
 */
export const getStorageRef = (path: string) => {
  return ref(storage, path);
};
