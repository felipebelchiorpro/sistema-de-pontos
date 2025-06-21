// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let initializationError: string | null = null;

// This function checks for all required environment variables and builds the config.
function getFirebaseConfig(): { config: FirebaseOptions | null; error: string | null } {
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
    return {
      config: null,
      error: `Configuração do Firebase incompleta. As seguintes variáveis de ambiente não foram encontradas: ${missingVars.join(', ')}. Verifique suas configurações na Vercel ou no arquivo .env.local.`
    };
  }

  return {
    config: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    error: null,
  };
}

// Initialize on module load
const { config, error } = getFirebaseConfig();
if (config) {
  try {
    app = !getApps().length ? initializeApp(config) : getApp();
    db = getFirestore(app);
  } catch (e: any) {
    console.error('Firebase initialization error:', e.message);
    initializationError = `Falha ao inicializar o Firebase: ${e.message}`;
  }
} else {
  initializationError = error;
}

/**
 * Gets the Firestore DB instance.
 * @returns An object with the db instance or an error message. It does not throw.
 */
export const getDb = (): { db: Firestore | null; error: string | null } => {
  if (initializationError) {
    return { db: null, error: initializationError };
  }
  if (!db) {
     return {
      db: null,
      error: "A conexão com o Firebase não foi inicializada por um motivo desconhecido. Verifique os logs do servidor."
    };
  }
  return { db, error: null };
};

export { app };