
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let initializationError: string | null = null;

// This function checks for all required environment variables and builds the config.
function getFirebaseConfig(): FirebaseOptions {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingVars.length > 0) {
    // This error message will be caught and displayed to the user.
    throw new Error(`Configuração do Firebase incompleta. As seguintes variáveis de ambiente não foram encontradas: ${missingVars.join(', ')}. Verifique suas configurações na Vercel ou no arquivo .env.local.`);
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

try {
  // We get the config only if we intend to use it.
  const firebaseConfig = getFirebaseConfig();
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
} catch (error: any) {
  console.error('Firebase initialization error:', error.message);
  // Store the specific error message to be thrown by ensureDb.
  initializationError = error.message; 
}

// This function is now the single source of truth for checking if the DB is ready.
// It will be imported by mock-data.ts.
export const ensureDb = () => {
  if (initializationError) {
    throw new Error(initializationError);
  }
  if (!db) {
     throw new Error(
      "A conexão com o Firebase não foi inicializada por um motivo desconhecido. Verifique os logs do servidor."
    );
  }
  return db;
};

export { app, db };
