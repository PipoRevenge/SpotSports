// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  //@ts-ignore line
  getReactNativePersistence,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
// CAMBIO 1: Importamos initializeFirestore en lugar de getFirestore
import { connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: "https://spotshare-dd707-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized:', app.name);

// Initialize auth with persistence
const auth =
  Platform.OS === "web"
    ? initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      })
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

// CAMBIO 2: Inicialización de Firestore con Long Polling para evitar el error de WebChannelConnection
const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true, // <--- ESTA ES LA SOLUCIÓN
});

// Initialize other services
// Initialize other services
const database = getDatabase(app);
// Always use 'europe-west1' for functions as deployed
const functions = getFunctions(app, 'europe-west1');
const storage = getStorage(app);

// Replace 'YOUR_LOCAL_IP' with the actual IP address of your machine
const localIp = process.env.EXPO_PUBLIC_EMULATOR_IP || "10.0.2.2"; 

// To use Firebase Cloud in development, set this to false
const USE_EMULATOR = false;

// Connect to emulators in development environment
if (USE_EMULATOR) {
  try {
    connectAuthEmulator(auth, `http://${localIp}:9099`, {
      disableWarnings: false,
    });
    connectFirestoreEmulator(firestore, localIp, 8080);
    connectDatabaseEmulator(database, localIp, 9000);
    connectFunctionsEmulator(functions, localIp, 5001);
    connectStorageEmulator(storage, localIp, 9199);
    console.log("Connected to Firebase Emulators");
  } catch (error) {
    console.error("Error connecting to Firebase Emulators:", error);
  }
}

// Export the services
export { app, auth, database, firestore, functions, localIp, storage };

