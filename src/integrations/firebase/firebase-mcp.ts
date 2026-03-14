/**
 * Firebase MCP - Modelo de Contexto y Proveedor para Firebase
 * Proporciona herramientas para interactuar con Firestore, Realtime Database y Storage
 */

import { getFirestore, getDatabase, getStorage, isFirebaseAvailable } from '../../infrastructure/config/config/firebase.js';

// Re-exportar funciones de Firebase
export { getFirestore, isFirebaseAvailable };

// ============================================================================
// FIRESTORE TOOLS
// ============================================================================

export interface FirestoreDocOptions {
  collection: string;
  document?: string;
  data?: Record<string, any>;
  query?: {
    field: string;
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'array-contains' | 'in' | 'array-contains-any';
    value: any;
  };
}

/**
 * Lee un documento de Firestore
 */
export async function firestoreGetDocument(collection: string, document: string): Promise<Record<string, any> | null> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getFirestore();
  const docRef = db.collection(collection).doc(document);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data()
  };
}

/**
 * Crea o actualiza un documento en Firestore
 */
export async function firestoreSetDocument(collection: string, document: string, data: Record<string, any>): Promise<string> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getFirestore();
  const docRef = db.collection(collection).doc(document);

  await docRef.set(data, { merge: true });

  return `Documento ${document} creado/actualizado en colección ${collection}`;
}

/**
 * Elimina un documento de Firestore
 */
export async function firestoreDeleteDocument(collection: string, document: string): Promise<string> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getFirestore();
  await db.collection(collection).doc(document).delete();

  return `Documento ${document} eliminado de colección ${collection}`;
}

/**
 * Consulta documentos en Firestore
 */
export async function firestoreQuery(
  collection: string,
  field: string,
  operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'array-contains' | 'in' | 'array-contains-any',
  value: any,
  limit?: number
): Promise<any[]> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getFirestore();
  let query = db.collection(collection).where(field, operator, value);

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Lista todos los documentos de una colección
 */
export async function firestoreListCollection(collection: string, limit?: number): Promise<any[]> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getFirestore();
  const collectionRef = db.collection(collection);
  let query: any = collectionRef;

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Lista todas las colecciones del proyecto
 */
export async function firestoreListCollections(): Promise<string[]> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getFirestore();
  const collections = await db.listCollections();

  return collections.map(col => col.id);
}

/**
 * Obtiene información del proyecto Firebase actual
 */
export async function firebaseGetProjectInfo(): Promise<Record<string, any>> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const app = (await import('../config/firebase.js')).initializeFirebase();
  const options = app.options;

  return {
    projectId: options.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'agentepro-c945f',
    databaseURL: options.databaseURL || process.env.FIREBASE_DATABASE_URL || 'No configurada',
    storageBucket: options.storageBucket || process.env.FIREBASE_STORAGE_BUCKET || 'No configurado',
    services: {
      firestore: 'Disponible',
      realtimeDatabase: options.databaseURL ? 'Disponible' : 'No configurado',
      storage: options.storageBucket ? 'Disponible' : 'No configurado'
    }
  };
}

/**
 * Cuenta documentos en una colección
 */
export async function firestoreCountCollection(collection: string): Promise<number> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getFirestore();
  const snapshot = await db.collection(collection).count().get();

  return snapshot.data().count;
}

/**
 * Obtiene el historial de chat de ChatDafo
 */
export async function getChatHistory(
  userId?: string,
  limit?: number,
  date?: string
): Promise<any[]> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getFirestore();
  let query: any = db.collection('ChatDafo');

  if (userId) {
    query = query.where('userId', '==', parseInt(userId));
  }

  if (date) {
    query = query.where('date', '==', date);
  }

  query = query.orderBy('timestamp', 'desc');

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ============================================================================
// REALTIME DATABASE TOOLS
// ============================================================================

/**
 * Lee un valor de Realtime Database
 */
export async function realtimeGetValue(path: string): Promise<any> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getDatabase();
  const ref = db.ref(path);
  const snapshot = await ref.get();

  return snapshot.val();
}

/**
 * Establece un valor en Realtime Database
 */
export async function realtimeSetValue(path: string, value: any): Promise<string> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getDatabase();
  const ref = db.ref(path);

  await ref.set(value);

  return `Valor establecido en ${path}`;
}

/**
 * Actualiza un valor en Realtime Database
 */
export async function realtimeUpdateValue(path: string, value: Record<string, any>): Promise<string> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getDatabase();
  const ref = db.ref(path);

  await ref.update(value);

  return `Valor actualizado en ${path}`;
}

/**
 * Elimina un valor de Realtime Database
 */
export async function realtimeDeleteValue(path: string): Promise<string> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getDatabase();
  const ref = db.ref(path);

  await ref.remove();

  return `Valor eliminado de ${path}`;
}

/**
 * Consulta hijos de un path en Realtime Database
 */
export async function realtimeQuery(
  path: string,
  orderBy: string,
  limitToFirst?: number,
  limitToLast?: number,
  startAt?: any,
  endAt?: any
): Promise<any[]> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const db = getDatabase();
  let ref = db.ref(path).orderByChild(orderBy);

  if (limitToFirst) {
    ref = ref.limitToFirst(limitToFirst);
  }

  if (limitToLast) {
    ref = ref.limitToLast(limitToLast);
  }

  if (startAt !== undefined) {
    ref = ref.startAt(startAt);
  }

  if (endAt !== undefined) {
    ref = ref.endAt(endAt);
  }

  const snapshot = await ref.get();

  const results: any[] = [];
  snapshot.forEach((child: any) => {
    results.push({
      key: child.key,
      value: child.val()
    });
  });

  return results;
}

// ============================================================================
// STORAGE TOOLS
// ============================================================================

/**
 * Sube un archivo a Storage
 */
export async function storageUploadFile(
  bucketName: string,
  filePath: string,
  contentType: string,
  fileBuffer: Buffer
): Promise<string> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const storage = getStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  await file.save(fileBuffer, {
    contentType
  });

  // Generar URL firmada (válida por 15 minutos por defecto)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000
  });

  return url;
}

/**
 * Descarga un archivo de Storage
 */
export async function storageDownloadFile(bucketName: string, filePath: string): Promise<Buffer> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const storage = getStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  const [exists] = await file.exists();

  if (!exists) {
    throw new Error(`El archivo ${filePath} no existe en el bucket ${bucketName}`);
  }

  const [buffer] = await file.download();

  return buffer;
}

/**
 * Elimina un archivo de Storage
 */
export async function storageDeleteFile(bucketName: string, filePath: string): Promise<string> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const storage = getStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  await file.delete();

  return `Archivo ${filePath} eliminado del bucket ${bucketName}`;
}

/**
 * Lista archivos en un directorio de Storage
 */
export async function storageListFiles(bucketName: string, prefix?: string, delimiter?: string): Promise<any[]> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const storage = getStorage();
  const bucket = storage.bucket(bucketName);

  const [files] = await bucket.getFiles({
    prefix,
    delimiter
  });

  return files.map(file => ({
    name: file.name,
    size: file.metadata.size,
    contentType: file.metadata.contentType,
    updated: file.metadata.updated,
    mediaLink: file.metadata.mediaLink
  }));
}

/**
 * Genera una URL firmada para un archivo
 */
export async function storageGetSignedUrl(
  bucketName: string,
  filePath: string,
  expiresInMinutes: number = 15
): Promise<string> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase no está disponible');
  }

  const storage = getStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000
  });

  return url;
}

// ============================================================================
// FIREBASE MCP TOOL DEFINITIONS
// ============================================================================

/**
 * Definiciones de herramientas MCP para que el agente pueda usar Firebase
 */
export const firebaseMCPTools = {
  // Firestore Tools
  'firestore_get_document': {
    description: 'Lee un documento específico de Firestore',
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Nombre de la colección' },
        document: { type: 'string', description: 'ID del documento' }
      },
      required: ['collection', 'document']
    },
    handler: firestoreGetDocument
  },

  'firestore_set_document': {
    description: 'Crea o actualiza un documento en Firestore',
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Nombre de la colección' },
        document: { type: 'string', description: 'ID del documento' },
        data: { type: 'object', description: 'Datos del documento' }
      },
      required: ['collection', 'document', 'data']
    },
    handler: firestoreSetDocument
  },

  'firestore_delete_document': {
    description: 'Elimina un documento de Firestore',
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Nombre de la colección' },
        document: { type: 'string', description: 'ID del documento' }
      },
      required: ['collection', 'document']
    },
    handler: firestoreDeleteDocument
  },

  'firestore_query': {
    description: 'Consulta documentos en Firestore con filtros',
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Nombre de la colección' },
        field: { type: 'string', description: 'Campo para filtrar' },
        operator: {
          type: 'string',
          enum: ['==', '!=', '>', '>=', '<', '<=', 'array-contains', 'in', 'array-contains-any'],
          description: 'Operador de comparación'
        },
        value: { description: 'Valor a comparar' },
        limit: { type: 'number', description: 'Límite de resultados (opcional)' }
      },
      required: ['collection', 'field', 'operator', 'value']
    },
    handler: firestoreQuery
  },

  'firestore_list_collection': {
    description: 'Lista todos los documentos de una colección',
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Nombre de la colección' },
        limit: { type: 'number', description: 'Límite de resultados (opcional)' }
      },
      required: ['collection']
    },
    handler: firestoreListCollection
  },

  'firestore_list_collections': {
    description: 'Lista todas las colecciones disponibles en el proyecto de Firebase',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: firestoreListCollections
  },

  'firestore_count_collection': {
    description: 'Cuenta el número de documentos en una colección',
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Nombre de la colección' }
      },
      required: ['collection']
    },
    handler: firestoreCountCollection
  },

  'firebase_get_project_info': {
    description: 'Obtiene información sobre el proyecto de Firebase actual',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: firebaseGetProjectInfo
  },

  'get_chat_history': {
    description: 'Obtiene el historial de chat de la colección ChatDafo',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'ID del usuario (opcional)' },
        limit: { type: 'number', description: 'Límite de resultados (opcional)' },
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD (opcional)' }
      },
      required: []
    },
    handler: getChatHistory
  },

  // Realtime Database Tools
  'realtime_get_value': {
    description: 'Lee un valor de Realtime Database',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path del valor (ej: /users/123)' }
      },
      required: ['path']
    },
    handler: realtimeGetValue
  },

  'realtime_set_value': {
    description: 'Establece un valor en Realtime Database',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path del valor' },
        value: { description: 'Valor a establecer' }
      },
      required: ['path', 'value']
    },
    handler: realtimeSetValue
  },

  'realtime_update_value': {
    description: 'Actualiza parcialmente un valor en Realtime Database',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path del valor' },
        value: { type: 'object', description: 'Valores a actualizar' }
      },
      required: ['path', 'value']
    },
    handler: realtimeUpdateValue
  },

  'realtime_delete_value': {
    description: 'Elimina un valor de Realtime Database',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path del valor a eliminar' }
      },
      required: ['path']
    },
    handler: realtimeDeleteValue
  },

  'realtime_query': {
    description: 'Consulta valores en Realtime Database con orden y límites',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path base para la consulta' },
        orderBy: { type: 'string', description: 'Campo por el que ordenar' },
        limitToFirst: { type: 'number', description: 'Limitar a los primeros N resultados' },
        limitToLast: { type: 'number', description: 'Limitar a los últimos N resultados' },
        startAt: { description: 'Empezar desde este valor' },
        endAt: { description: 'Terminar en este valor' }
      },
      required: ['path', 'orderBy']
    },
    handler: realtimeQuery
  },

  // Storage Tools
  'storage_upload_file': {
    description: 'Sube un archivo a Firebase Storage',
    parameters: {
      type: 'object',
      properties: {
        bucketName: { type: 'string', description: 'Nombre del bucket' },
        filePath: { type: 'string', description: 'Path del archivo en el bucket' },
        contentType: { type: 'string', description: 'Tipo MIME (ej: image/jpeg)' },
        fileData: { type: 'string', description: 'Datos del archivo en base64' }
      },
      required: ['bucketName', 'filePath', 'contentType', 'fileData']
    },
    handler: async (params: any) => {
      const buffer = Buffer.from(params.fileData, 'base64');
      return storageUploadFile(params.bucketName, params.filePath, params.contentType, buffer);
    }
  },

  'storage_download_file': {
    description: 'Descarga un archivo de Firebase Storage',
    parameters: {
      type: 'object',
      properties: {
        bucketName: { type: 'string', description: 'Nombre del bucket' },
        filePath: { type: 'string', description: 'Path del archivo en el bucket' }
      },
      required: ['bucketName', 'filePath']
    },
    handler: storageDownloadFile
  },

  'storage_delete_file': {
    description: 'Elimina un archivo de Firebase Storage',
    parameters: {
      type: 'object',
      properties: {
        bucketName: { type: 'string', description: 'Nombre del bucket' },
        filePath: { type: 'string', description: 'Path del archivo en el bucket' }
      },
      required: ['bucketName', 'filePath']
    },
    handler: storageDeleteFile
  },

  'storage_list_files': {
    description: 'Lista archivos en un bucket de Storage',
    parameters: {
      type: 'object',
      properties: {
        bucketName: { type: 'string', description: 'Nombre del bucket' },
        prefix: { type: 'string', description: 'Prefijo para filtrar (opcional)' },
        delimiter: { type: 'string', description: 'Delimitador para carpetas (opcional)' }
      },
      required: ['bucketName']
    },
    handler: storageListFiles
  },

  'storage_get_signed_url': {
    description: 'Genera una URL firmada para acceder a un archivo',
    parameters: {
      type: 'object',
      properties: {
        bucketName: { type: 'string', description: 'Nombre del bucket' },
        filePath: { type: 'string', description: 'Path del archivo en el bucket' },
        expiresInMinutes: { type: 'number', description: 'Minutos de expiración (default: 15)' }
      },
      required: ['bucketName', 'filePath']
    },
    handler: storageGetSignedUrl
  }
};
