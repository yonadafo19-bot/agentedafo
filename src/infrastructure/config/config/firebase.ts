import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configuración de Firebase
let firebaseApp: admin.app.App | null = null;

/**
 * Inicializa Firebase con las credenciales
 */
export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Opción 1: Usar service-account.json si está disponible
    const serviceAccountPath = join(process.cwd(), 'service-account.json');

    // Opción 2: Usar variable de entorno con el JSON completo
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

    let serviceAccount: any;

    if (serviceAccountEnv) {
      // Usar credenciales desde variable de entorno
      serviceAccount = JSON.parse(serviceAccountEnv);
    } else {
      // Intentar leer archivo service-account.json
      try {
        serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      } catch (error) {
        console.warn('⚠️  No se encontró service-account.json. Firebase no estará disponible.');
        throw new Error('Credenciales de Firebase no encontradas');
      }
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || ''
    });

    console.log('✅ Firebase inicializado correctamente');
    return firebaseApp;

  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    throw error;
  }
}

/**
 * Obtiene la instancia de Firestore
 */
export function getFirestore(): admin.firestore.Firestore {
  const app = initializeFirebase();
  return app.firestore();
}

/**
 * Obtiene la instancia de Realtime Database
 */
export function getDatabase(): admin.database.Database {
  const app = initializeFirebase();
  return app.database();
}

/**
 * Obtiene la instancia de Storage
 */
export function getStorage(): admin.storage.Storage {
  const app = initializeFirebase();
  return app.storage();
}

/**
 * Verifica si Firebase está disponible
 */
export function isFirebaseAvailable(): boolean {
  try {
    initializeFirebase();
    return true;
  } catch {
    return false;
  }
}
