import type { Tool } from '../../shared/types/index.js';
import * as firebaseMCP from '../../integrations/firebase/firebase-mcp.js';
import * as duckDuckGoSearch from '../../domain/services/search/search/duckduckgo-search.js';
import * as wikipediaSearch from '../../domain/services/search/search/wikipedia-search.js';
import * as braveSearch from '../../domain/services/search/search/brave-search.js';
import * as googleWorkspace from '../../integrations/google/index.js';
import * as googleWorkspaceTools from '../../integrations/google/workspace.js';
import * as personalNotes from '../../domain/services/personal/notes.js';
import { getImageGenerator } from '../../integrations/image/openai.js';
import * as docGenerator from '../../domain/services/documents/generator.js';
import * as googleDrive from '../../integrations/google/drive.js';

// ============================================================================
// HERRAMIENTAS DEL SISTEMA
// ============================================================================

// Herramienta: Obtener hora actual
export const get_current_time: Tool = {
  name: 'get_current_time',
  description: 'Obtiene la fecha y hora actual',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Zona horaria opcional (ej: "Europe/Madrid", "America/New_York")',
      },
    },
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const now = new Date();
      const timezone = args.timezone as string | undefined;
      if (timezone) {
        return now.toLocaleString('es-ES', { timeZone: timezone });
      }
      return now.toLocaleString('es-ES');
    } catch (error) {
      return `Error al obtener la hora: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// HERRAMIENTAS DE FIRESTORE
// ============================================================================

export const firestore_get_document: Tool = {
  name: 'firestore_get_document',
  description: 'Lee un documento específico de Firestore',
  parameters: {
    type: 'object',
    properties: {
      collection: { type: 'string', description: 'Nombre de la colección' },
      document: { type: 'string', description: 'ID del documento' },
    },
    required: ['collection', 'document'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const collection = args.collection as string;
      const document = args.document as string;
      const result = await firebaseMCP.firestoreGetDocument(collection, document);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const firestore_set_document: Tool = {
  name: 'firestore_set_document',
  description: 'Crea o actualiza un documento en Firestore',
  parameters: {
    type: 'object',
    properties: {
      collection: { type: 'string', description: 'Nombre de la colección' },
      document: { type: 'string', description: 'ID del documento' },
      data: { type: 'string', description: 'Datos del documento (JSON string)' },
    },
    required: ['collection', 'document', 'data'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const collection = args.collection as string;
      const document = args.document as string;
      const dataJson = args.data as string;
      const data = JSON.parse(dataJson);
      const result = await firebaseMCP.firestoreSetDocument(collection, document, data);
      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const firestore_delete_document: Tool = {
  name: 'firestore_delete_document',
  description: 'Elimina un documento de Firestore',
  parameters: {
    type: 'object',
    properties: {
      collection: { type: 'string', description: 'Nombre de la colección' },
      document: { type: 'string', description: 'ID del documento' },
    },
    required: ['collection', 'document'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const collection = args.collection as string;
      const document = args.document as string;
      const result = await firebaseMCP.firestoreDeleteDocument(collection, document);
      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const firestore_query: Tool = {
  name: 'firestore_query',
  description: 'Consulta documentos en Firestore con filtros',
  parameters: {
    type: 'object',
    properties: {
      collection: { type: 'string', description: 'Nombre de la colección' },
      field: { type: 'string', description: 'Campo para filtrar' },
      operator: { type: 'string', description: 'Operador: ==, !=, >, >=, <, <=, array-contains, in, array-contains-any' },
      value: { type: 'string', description: 'Valor a comparar (JSON string para objetos/arrays)' },
      limit: { type: 'string', description: 'Límite de resultados (opcional)' },
    },
    required: ['collection', 'field', 'operator', 'value'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const collection = args.collection as string;
      const field = args.field as string;
      const operator = args.operator as any;
      const valueJson = args.value as string;
      const value = JSON.parse(valueJson);
      const limit = args.limit ? parseInt(args.limit as string) : undefined;
      const result = await firebaseMCP.firestoreQuery(collection, field, operator, value, limit);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const firestore_list_collection: Tool = {
  name: 'firestore_list_collection',
  description: 'Lista todos los documentos de una colección',
  parameters: {
    type: 'object',
    properties: {
      collection: { type: 'string', description: 'Nombre de la colección' },
      limit: { type: 'string', description: 'Límite de resultados (opcional)' },
    },
    required: ['collection'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const collection = args.collection as string;
      const limit = args.limit ? parseInt(args.limit as string) : undefined;
      const result = await firebaseMCP.firestoreListCollection(collection, limit);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const firestore_list_collections: Tool = {
  name: 'firestore_list_collections',
  description: 'Lista todas las colecciones disponibles en el proyecto de Firebase',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  async execute(_args: Record<string, unknown>): Promise<string> {
    try {
      const result = await firebaseMCP.firestoreListCollections();
      return JSON.stringify({ collections: result, total: result.length }, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const firestore_count_collection: Tool = {
  name: 'firestore_count_collection',
  description: 'Cuenta el número de documentos en una colección',
  parameters: {
    type: 'object',
    properties: {
      collection: { type: 'string', description: 'Nombre de la colección' },
    },
    required: ['collection'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const collection = args.collection as string;
      const result = await firebaseMCP.firestoreCountCollection(collection);
      return JSON.stringify({ collection, count: result }, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const firebase_get_project_info: Tool = {
  name: 'firebase_get_project_info',
  description: 'Obtiene información sobre el proyecto de Firebase actual',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  async execute(_args: Record<string, unknown>): Promise<string> {
    try {
      const result = await firebaseMCP.firebaseGetProjectInfo();
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const get_chat_history: Tool = {
  name: 'get_chat_history',
  description: 'Obtiene el historial de chat de la colección ChatDafo',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario (opcional)' },
      limit: { type: 'string', description: 'Límite de resultados (opcional)' },
      date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD (opcional)' },
    },
    required: [],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const userId = args.userId as string | undefined;
      const limit = args.limit ? parseInt(args.limit as string) : undefined;
      const date = args.date as string | undefined;
      const result = await firebaseMCP.getChatHistory(userId, limit, date);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// HERRAMIENTAS DE REALTIME DATABASE
// ============================================================================

export const realtime_get_value: Tool = {
  name: 'realtime_get_value',
  description: 'Lee un valor de Realtime Database',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path del valor (ej: /users/123)' },
    },
    required: ['path'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const path = args.path as string;
      const result = await firebaseMCP.realtimeGetValue(path);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const realtime_set_value: Tool = {
  name: 'realtime_set_value',
  description: 'Establece un valor en Realtime Database',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path del valor' },
      value: { type: 'string', description: 'Valor a establecer (JSON string)' },
    },
    required: ['path', 'value'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const path = args.path as string;
      const valueJson = args.value as string;
      const value = JSON.parse(valueJson);
      const result = await firebaseMCP.realtimeSetValue(path, value);
      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const realtime_update_value: Tool = {
  name: 'realtime_update_value',
  description: 'Actualiza parcialmente un valor en Realtime Database',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path del valor' },
      value: { type: 'string', description: 'Valores a actualizar (JSON string)' },
    },
    required: ['path', 'value'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const path = args.path as string;
      const valueJson = args.value as string;
      const value = JSON.parse(valueJson);
      const result = await firebaseMCP.realtimeUpdateValue(path, value);
      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const realtime_delete_value: Tool = {
  name: 'realtime_delete_value',
  description: 'Elimina un valor de Realtime Database',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path del valor a eliminar' },
    },
    required: ['path'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const path = args.path as string;
      const result = await firebaseMCP.realtimeDeleteValue(path);
      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const realtime_query: Tool = {
  name: 'realtime_query',
  description: 'Consulta valores en Realtime Database con orden y límites',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path base para la consulta' },
      orderBy: { type: 'string', description: 'Campo por el que ordenar' },
      limitToFirst: { type: 'string', description: 'Limitar a los primeros N resultados' },
      limitToLast: { type: 'string', description: 'Limitar a los últimos N resultados' },
      startAt: { type: 'string', description: 'Empezar desde este valor (JSON string)' },
      endAt: { type: 'string', description: 'Terminar en este valor (JSON string)' },
    },
    required: ['path', 'orderBy'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const path = args.path as string;
      const orderBy = args.orderBy as string;
      const limitToFirst = args.limitToFirst ? parseInt(args.limitToFirst as string) : undefined;
      const limitToLast = args.limitToLast ? parseInt(args.limitToLast as string) : undefined;
      const startAt = args.startAt ? JSON.parse(args.startAt as string) : undefined;
      const endAt = args.endAt ? JSON.parse(args.endAt as string) : undefined;
      const result = await firebaseMCP.realtimeQuery(path, orderBy, limitToFirst, limitToLast, startAt, endAt);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// HERRAMIENTAS DE STORAGE
// ============================================================================

export const storage_upload_file: Tool = {
  name: 'storage_upload_file',
  description: 'Sube un archivo a Firebase Storage (requiere datos en base64)',
  parameters: {
    type: 'object',
    properties: {
      bucketName: { type: 'string', description: 'Nombre del bucket' },
      filePath: { type: 'string', description: 'Path del archivo en el bucket' },
      contentType: { type: 'string', description: 'Tipo MIME (ej: image/jpeg)' },
      fileData: { type: 'string', description: 'Datos del archivo en base64' },
    },
    required: ['bucketName', 'filePath', 'contentType', 'fileData'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const bucketName = args.bucketName as string;
      const filePath = args.filePath as string;
      const contentType = args.contentType as string;
      const fileData = args.fileData as string;
      const buffer = Buffer.from(fileData, 'base64');
      const result = await firebaseMCP.storageUploadFile(bucketName, filePath, contentType, buffer);
      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const storage_delete_file: Tool = {
  name: 'storage_delete_file',
  description: 'Elimina un archivo de Firebase Storage',
  parameters: {
    type: 'object',
    properties: {
      bucketName: { type: 'string', description: 'Nombre del bucket' },
      filePath: { type: 'string', description: 'Path del archivo en el bucket' },
    },
    required: ['bucketName', 'filePath'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const bucketName = args.bucketName as string;
      const filePath = args.filePath as string;
      const result = await firebaseMCP.storageDeleteFile(bucketName, filePath);
      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const storage_list_files: Tool = {
  name: 'storage_list_files',
  description: 'Lista archivos en un bucket de Storage',
  parameters: {
    type: 'object',
    properties: {
      bucketName: { type: 'string', description: 'Nombre del bucket' },
      prefix: { type: 'string', description: 'Prefijo para filtrar (opcional)' },
      delimiter: { type: 'string', description: 'Delimitador para carpetas (opcional)' },
    },
    required: ['bucketName'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const bucketName = args.bucketName as string;
      const prefix = args.prefix as string | undefined;
      const delimiter = args.delimiter as string | undefined;
      const result = await firebaseMCP.storageListFiles(bucketName, prefix, delimiter);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const storage_get_signed_url: Tool = {
  name: 'storage_get_signed_url',
  description: 'Genera una URL firmada para acceder a un archivo',
  parameters: {
    type: 'object',
    properties: {
      bucketName: { type: 'string', description: 'Nombre del bucket' },
      filePath: { type: 'string', description: 'Path del archivo en el bucket' },
      expiresInMinutes: { type: 'string', description: 'Minutos de expiración (default: 15)' },
    },
    required: ['bucketName', 'filePath'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const bucketName = args.bucketName as string;
      const filePath = args.filePath as string;
      const expiresInMinutes = args.expiresInMinutes ? parseInt(args.expiresInMinutes as string) : 15;
      const result = await firebaseMCP.storageGetSignedUrl(bucketName, filePath, expiresInMinutes);
      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// HERRAMIENTAS DE GOOGLE WORKSPACE
// ============================================================================

export const google_recent_emails: Tool = {
  name: 'google_recent_emails',
  description: 'Obtiene los últimos emails de Gmail',
  parameters: {
    type: 'object',
    properties: {
      max: { type: 'string', description: 'Número máximo de emails (default: 5)' },
    },
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const max = args.max ? parseInt(args.max as string) : 5;
      return await googleWorkspace.getRecentEmails(max);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_search_emails: Tool = {
  name: 'google_search_emails',
  description: 'Busca emails en Gmail con una consulta',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Consulta de búsqueda (ej: "from:ejemplo.com", "asunto:importante")' },
      max: { type: 'string', description: 'Número máximo de resultados (default: 10)' },
    },
    required: ['query'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const query = args.query as string;
      const max = args.max ? parseInt(args.max as string) : 10;
      return await googleWorkspace.searchEmails(query, max);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_read_email: Tool = {
  name: 'google_read_email',
  description: 'Lee el contenido completo de un email',
  parameters: {
    type: 'object',
    properties: {
      messageId: { type: 'string', description: 'ID del mensaje de email' },
    },
    required: ['messageId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const messageId = args.messageId as string;
      return await googleWorkspace.readEmail(messageId);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_send_email: Tool = {
  name: 'google_send_email',
  description: 'Envía un email a través de Gmail',
  parameters: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Email del destinatario' },
      subject: { type: 'string', description: 'Asunto del email' },
      body: { type: 'string', description: 'Cuerpo del email' },
    },
    required: ['to', 'subject', 'body'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const to = args.to as string;
      const subject = args.subject as string;
      const body = args.body as string;
      return await googleWorkspace.sendEmail(to, subject, body);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_today_events: Tool = {
  name: 'google_today_events',
  description: 'Obtiene los eventos de Calendar de hoy',
  parameters: {
    type: 'object',
    properties: {
      calendarId: { type: 'string', description: 'ID del calendario (default: primary)' },
    },
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const calendarId = (args.calendarId as string) || 'primary';
      return await googleWorkspace.getTodayEvents(calendarId);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_get_events: Tool = {
  name: 'google_get_events',
  description: 'Obtiene eventos de Calendar de los próximos días',
  parameters: {
    type: 'object',
    properties: {
      days: { type: 'string', description: 'Número de días a buscar (default: 7)' },
      calendarId: { type: 'string', description: 'ID del calendario (default: primary)' },
    },
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const days = args.days ? parseInt(args.days as string) : 7;
      const calendarId = (args.calendarId as string) || 'primary';
      return await googleWorkspace.getEvents(calendarId, days);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_search_events: Tool = {
  name: 'google_search_events',
  description: 'Busca eventos en Calendar',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Término de búsqueda' },
      calendarId: { type: 'string', description: 'ID del calendario (default: primary)' },
    },
    required: ['query'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const query = args.query as string;
      const calendarId = (args.calendarId as string) || 'primary';
      return await googleWorkspace.searchEvents(query, calendarId);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_create_event: Tool = {
  name: 'google_create_event',
  description: 'Crea un nuevo evento en Calendar',
  parameters: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'Título del evento' },
      start: { type: 'string', description: 'Fecha y hora de inicio (ISO string)' },
      end: { type: 'string', description: 'Fecha y hora de fin (ISO string)' },
      calendarId: { type: 'string', description: 'ID del calendario (default: primary)' },
      description: { type: 'string', description: 'Descripción del evento (opcional)' },
      location: { type: 'string', description: 'Ubicación del evento (opcional)' },
    },
    required: ['summary', 'start', 'end'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const summary = args.summary as string;
      const start = args.start as string;
      const end = args.end as string;
      const calendarId = (args.calendarId as string) || 'primary';
      const description = args.description as string | undefined;
      const location = args.location as string | undefined;
      return await googleWorkspace.createEvent(calendarId, summary, start, end, description, location);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// HERRAMIENTAS DE GOOGLE DRIVE
// ============================================================================

export const google_drive_list: Tool = {
  name: 'google_drive_list',
  description: 'Lista archivos de Google Drive con información detallada',
  parameters: {
    type: 'object',
    properties: {
      max: { type: 'string', description: 'Número máximo de archivos (default: 10)' },
      query: { type: 'string', description: 'Filtro de búsqueda opcional (ej: "name contains \'factura\'")' },
    },
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const max = args.max ? parseInt(args.max as string) : 10;
      const query = args.query as string | undefined;
      return await googleWorkspace.listFiles(max, query);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_drive_search: Tool = {
  name: 'google_drive_search',
  description: 'Busca archivos en Google Drive por nombre',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Término de búsqueda' },
      max: { type: 'string', description: 'Número máximo de resultados (default: 10)' },
    },
    required: ['query'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const query = args.query as string;
      const max = args.max ? parseInt(args.max as string) : 10;
      return await googleWorkspace.searchFiles(query, max);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_drive_get_file: Tool = {
  name: 'google_drive_get_file',
  description: 'Obtiene información detallada de un archivo específico de Drive',
  parameters: {
    type: 'object',
    properties: {
      fileId: { type: 'string', description: 'ID del archivo en Drive' },
    },
    required: ['fileId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const fileId = args.fileId as string;
      return await googleWorkspace.getFile(fileId);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_drive_recent: Tool = {
  name: 'google_drive_recent',
  description: 'Lista archivos recientes de Drive (modificados en los últimos N días)',
  parameters: {
    type: 'object',
    properties: {
      days: { type: 'string', description: 'Número de días a buscar (default: 7)' },
    },
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const days = args.days ? parseInt(args.days as string) : 7;
      return await googleWorkspace.getRecentFiles(days);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_drive_create_folder: Tool = {
  name: 'google_drive_create_folder',
  description: 'Crea una carpeta en Google Drive',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Nombre de la carpeta' },
      parentFolderId: { type: 'string', description: 'ID de la carpeta padre (opcional)' },
    },
    required: ['name'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const name = args.name as string;
      const parentFolderId = args.parentFolderId as string | undefined;
      return await googleWorkspace.createFolder(name, parentFolderId);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_drive_upload: Tool = {
  name: 'google_drive_upload',
  description: 'Sube un archivo a Google Drive (requiere contenido en base64)',
  parameters: {
    type: 'object',
    properties: {
      fileName: { type: 'string', description: 'Nombre del archivo' },
      mimeType: { type: 'string', description: 'Tipo MIME (ej: application/pdf, image/jpeg)' },
      base64Content: { type: 'string', description: 'Contenido del archivo en base64' },
      parentFolderId: { type: 'string', description: 'ID de la carpeta padre (opcional)' },
    },
    required: ['fileName', 'mimeType', 'base64Content'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const fileName = args.fileName as string;
      const mimeType = args.mimeType as string;
      const base64Content = args.base64Content as string;
      const parentFolderId = args.parentFolderId as string | undefined;
      return await googleWorkspace.uploadFile(fileName, mimeType, base64Content, parentFolderId);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_drive_read_doc: Tool = {
  name: 'google_drive_read_doc',
  description: 'Lee el contenido completo de un Google Doc por su ID de archivo',
  parameters: {
    type: 'object',
    properties: {
      fileId: { type: 'string', description: 'ID del archivo de Google Doc' },
    },
    required: ['fileId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const fileId = args.fileId as string;
      return await googleWorkspace.readGoogleDoc(fileId);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_drive_search_and_read_doc: Tool = {
  name: 'google_drive_search_and_read_doc',
  description: 'Busca un Google Doc por nombre y lee su contenido automáticamente. Útil para encontrar documentos como "rutina proyecto vitalidad 37"',
  parameters: {
    type: 'object',
    properties: {
      fileName: { type: 'string', description: 'Nombre del documento a buscar (ej: "rutina proyecto vitalidad 37")' },
    },
    required: ['fileName'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const fileName = args.fileName as string;
      return await googleWorkspace.searchAndReadDoc(fileName);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// HERRAMIENTAS DE GOOGLE WORKSPACE - INTEGRACIÓN CRUZADA
// ============================================================================

export const google_find_emails_for_event: Tool = {
  name: 'google_find_emails_for_event',
  description: 'Busca emails relacionados con un evento de Calendar. Útil para encontrar correos sobre una reunión específica.',
  parameters: {
    type: 'object',
    properties: {
      eventTitle: { type: 'string', description: 'Título del evento para buscar en emails' },
      eventDate: { type: 'string', description: 'Fecha del evento (opcional, formato: YYYY-MM-DD)' },
      maxResults: { type: 'number', description: 'Máximo de resultados (default: 5)' },
    },
    required: ['eventTitle'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const eventTitle = args.eventTitle as string;
      const eventDate = args.eventDate as string | undefined;
      const maxResults = args.maxResults as number | undefined;
      return await googleWorkspaceTools.findEmailsForEvent(eventTitle, eventDate, maxResults);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_daily_summary: Tool = {
  name: 'google_daily_summary',
  description: 'Obtiene un resumen completo del día con eventos de Calendar, emails recientes de Gmail y archivos recientes de Drive',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  async execute(): Promise<string> {
    try {
      return await googleWorkspaceTools.getDailySummary();
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_search_workspace: Tool = {
  name: 'google_search_workspace',
  description: 'Busca en TODO Google Workspace simultáneamente (Calendar, Gmail y Drive)',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Término de búsqueda' },
    },
    required: ['query'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const query = args.query as string;
      return await googleWorkspaceTools.searchAllWorkspace(query);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_get_context_info: Tool = {
  name: 'google_get_context_info',
  description: 'Encuentra información contextual sobre un contacto o tema en emails, eventos y archivos de Google',
  parameters: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Tema, nombre de contacto o asunto a buscar' },
    },
    required: ['topic'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const topic = args.topic as string;
      return await googleWorkspaceTools.getContextInfo(topic);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const google_frequent_contacts: Tool = {
  name: 'google_frequent_contacts',
  description: 'Lista los contactos más frecuentes basándose en emails recientes',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  async execute(): Promise<string> {
    try {
      return await googleWorkspaceTools.getFrequentContacts();
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// HERRAMIENTAS DE BÚSQUEDA WEB
// ============================================================================

export const web_search: Tool = {
  name: 'web_search',
  description: 'Realiza una búsqueda web usando DuckDuckGo (gratis y sin API key)',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Términos de búsqueda' },
      numResults: { type: 'string', description: 'Número de resultados (1-10, default: 5)' },
    },
    required: ['query'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const query = args.query as string;
      const numResults = args.numResults ? parseInt(args.numResults as string) : 5;
      const result = await duckDuckGoSearch.duckDuckGoSearch(query, numResults);

      let output = `🔍 **Resultados web para: "${query}"**\n\n`;

      if (result.results.length === 0) {
        output += 'No se encontraron resultados.';
      } else {
        result.results.forEach((r, i) => {
          output += `${i + 1}. **${r.title}**\n`;
          output += `   ${r.snippet}\n`;
          output += `   🔗 ${r.link}\n\n`;
        });
      }

      return output;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const wikipedia_search: Tool = {
  name: 'wikipedia_search',
  description: 'Realiza una búsqueda en Wikipedia (gratis, información enciclopédica)',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Términos de búsqueda' },
      numResults: { type: 'string', description: 'Número de resultados (1-10, default: 5)' },
      language: { type: 'string', description: 'Idioma (es, en, fr, etc. default: es)' },
    },
    required: ['query'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const query = args.query as string;
      const numResults = args.numResults ? parseInt(args.numResults as string) : 5;
      const language = (args.language as string) || 'es';
      const result = await wikipediaSearch.wikipediaSearch(query, numResults, language);

      let output = `📚 **Wikipedia: "${query}"**\n\n`;

      if (result.results.length === 0) {
        output += 'No se encontraron artículos en Wikipedia.';
      } else {
        result.results.forEach((r, i) => {
          output += `${i + 1}. **${r.title}**\n`;
          output += `   ${r.snippet}\n`;
          output += `   🔗 ${r.link}\n\n`;
        });
      }

      return output;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const brave_search: Tool = {
  name: 'brave_search',
  description: 'Realiza una búsqueda web usando Brave Search (privado, 2000 búsquedas/mes gratis)',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Términos de búsqueda' },
      numResults: { type: 'string', description: 'Número de resultados (1-20, default: 5)' },
    },
    required: ['query'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const query = args.query as string;
      const numResults = args.numResults ? parseInt(args.numResults as string) : 5;
      const result = await braveSearch.braveSearch(query, numResults);

      let output = `🦁 **Brave Search: "${query}"**\n\n`;

      if (result.results.length === 0) {
        output += 'No se encontraron resultados.';
      } else {
        result.results.forEach((r, i) => {
          output += `${i + 1}. **${r.title}**\n`;
          output += `   ${r.snippet}\n`;
          output += `   🔗 ${r.link}\n\n`;
        });
      }

      return output;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// HERRAMIENTAS PERSONALES (Notas, Tareas, Rutinas)
// ============================================================================

export const personal_save_note: Tool = {
  name: 'personal_save_note',
  description: 'Guarda una nota personal en Firestore (ej: recetas, ideas, información importante)',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      title: { type: 'string', description: 'Título de la nota' },
      content: { type: 'string', description: 'Contenido de la nota' },
      category: { type: 'string', description: 'Categoría (ej: recetas, ideas, trabajo, general)' },
    },
    required: ['userId', 'title', 'content'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const userId = args.userId as string;
      const title = args.title as string;
      const content = args.content as string;
      const category = (args.category as string) || 'general';
      return await personalNotes.saveNote(userId, title, content, category);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const personal_search_notes: Tool = {
  name: 'personal_search_notes',
  description: 'Busca notas personales por categoría o texto',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      category: { type: 'string', description: 'Categoría a buscar (opcional)' },
    },
    required: ['userId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const userId = args.userId as string;
      const category = args.category as string | undefined;
      return await personalNotes.searchNotes(userId, category);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const personal_create_task: Tool = {
  name: 'personal_create_task',
  description: 'Crea una tarea personal pendiente (ej: llamar a alguien, comprar algo, recordar algo)',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      title: { type: 'string', description: 'Título de la tarea' },
      description: { type: 'string', description: 'Descripción detallada (opcional)' },
      dueDate: { type: 'string', description: 'Fecha de vencimiento ISO (opcional)' },
      category: { type: 'string', description: 'Categoría (ej: compras, llamadas, trabajo, ejercicios)' },
    },
    required: ['userId', 'title'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const userId = args.userId as string;
      const title = args.title as string;
      const description = (args.description as string) || '';
      const dueDate = args.dueDate as string | undefined;
      const category = (args.category as string) || 'general';
      return await personalNotes.createTask(userId, title, description, dueDate, category);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const personal_list_tasks: Tool = {
  name: 'personal_list_tasks',
  description: 'Lista todas las tareas pendientes del usuario, opcionalmente filtradas por categoría',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      category: { type: 'string', description: 'Categoría a filtrar (opcional)' },
    },
    required: ['userId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const userId = args.userId as string;
      const category = args.category as string | undefined;
      return await personalNotes.listPendingTasks(userId, category);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const personal_complete_task: Tool = {
  name: 'personal_complete_task',
  description: 'Marca una tarea pendiente como completada',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      taskTitle: { type: 'string', description: 'Título exacto de la tarea a completar' },
    },
    required: ['userId', 'taskTitle'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const userId = args.userId as string;
      const taskTitle = args.taskTitle as string;
      return await personalNotes.completeTask(userId, taskTitle);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const personal_completed_tasks: Tool = {
  name: 'personal_completed_tasks',
  description: 'Muestra las tareas completadas recientemente',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      days: { type: 'string', description: 'Días a buscar (default: 7)' },
    },
    required: ['userId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const userId = args.userId as string;
      const days = args.days ? parseInt(args.days as string) : 7;
      return await personalNotes.getCompletedTasks(userId, days);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const personal_save_routine: Tool = {
  name: 'personal_save_routine',
  description: 'Guarda una rutina de ejercicios en Firestore',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      routineName: { type: 'string', description: 'Nombre de la rutina (ej: "Rutina lunes", "Rutina pecho")' },
      exercises: {
        type: 'string',
        description: 'JSON string con array de ejercicios: [{"name":"Flexiones","sets":3,"reps":15}]',
      },
    },
    required: ['userId', 'routineName', 'exercises'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const userId = args.userId as string;
      const routineName = args.routineName as string;
      const exercisesJson = args.exercises as string;
      const exercises = JSON.parse(exercisesJson);
      return await personalNotes.saveExerciseRoutine(userId, routineName, exercises);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const personal_get_routine: Tool = {
  name: 'personal_get_routine',
  description: 'Obtiene la rutina de ejercicios guardada del usuario',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
    },
    required: ['userId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const userId = args.userId as string;
      return await personalNotes.getExerciseRoutine(userId);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const personal_log_session: Tool = {
  name: 'personal_log_session',
  description: 'Registra una sesión de ejercicio completada',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      routineName: { type: 'string', description: 'Nombre de la rutina realizada' },
      exercisesCompleted: {
        type: 'string',
        description: 'JSON string con array de ejercicios completados: ["Flexiones","Sentadillas"]',
      },
    },
    required: ['userId', 'routineName', 'exercisesCompleted'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const userId = args.userId as string;
      const routineName = args.routineName as string;
      const exercisesJson = args.exercisesCompleted as string;
      const exercisesCompleted = JSON.parse(exercisesJson);
      return await personalNotes.logExerciseSession(userId, routineName, exercisesCompleted);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// SMART MEMORY TOOLS
// ============================================================================

export const memory_search: Tool = {
  name: 'memory_search',
  description: 'Busca información en la memoria del usuario usando palabras clave. Útil para recordar información previa, preferencias, hechos importantes o conversaciones anteriores.',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      query: { type: 'string', description: 'Consulta de búsqueda (palabras clave)' },
      limit: { type: 'number', description: 'Número máximo de resultados (default: 10)' },
    },
    required: ['userId', 'query'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const { getMemoryInstance } = await import('../memory/index.js');
      const memory = getMemoryInstance();

      if (!memory) {
        return '❌ Memory no está inicializado. Por favor, intenta más tarde.';
      }

      const userId = args.userId as string;
      const query = args.query as string;
      const limit = (args.limit as number) || 10;

      // Obtener todos los hechos del usuario
      const facts = await memory.getFacts(userId, { limit: 100 });

      // Buscar coincidencias por palabras clave
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

      const results: Array<{ fact: string; score: number }> = [];

      for (const fact of facts) {
        let score = 0;
        const factText = `${fact.key} ${fact.value} ${fact.content}`.toLowerCase();

        if (factText.includes(queryLower)) score += 1.0;

        for (const word of queryWords) {
          if (fact.key.includes(word)) score += 0.5;
          if (fact.value.includes(word)) score += 0.3;
          if (fact.content.includes(word)) score += 0.2;
        }

        if (fact.priority === 'high') score *= 1.5;

        if (score > 0.1) {
          results.push({ fact: `${fact.key}: ${fact.value}`, score });
        }
      }

      results.sort((a, b) => b.score - a.score);

      if (results.length === 0) {
        return `🔍 No encontré información sobre "${query}" en tu memoria.`;
      }

      let response = `🔍 **Resultados para "${query}":**\n\n`;
      for (const result of results.slice(0, limit)) {
        response += `• ${result.fact}\n`;
      }

      return response;
    } catch (error) {
      return `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const memory_get_facts: Tool = {
  name: 'memory_get_facts',
  description: 'Obtiene todos los hechos almacenados sobre el usuario. Incluye preferencias, relaciones, metas, eventos, rutinas, etc. Útil para ver qué información se ha guardado.',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      type: {
        type: 'string',
        description: 'Tipo de hechos a filtrar (preference, relationship, goal, event, fact, routine, task, location, contact, project). Si no se especifica, devuelve todos.',
      },
      category: {
        type: 'string',
        description: 'Categoría a filtrar (personal, work, family, health, finance, education, hobbies, social, travel, other). Si no se especifica, devuelve todas.',
      },
      limit: { type: 'number', description: 'Número máximo de hechos (default: 50)' },
    },
    required: ['userId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const { getMemoryInstance } = await import('../memory/index.js');
      const memory = getMemoryInstance();

      if (!memory) {
        return '❌ Memory no está inicializado. Por favor, intenta más tarde.';
      }

      const userId = args.userId as string;
      const type = args.type as string | undefined;
      const category = args.category as string | undefined;
      const limit = (args.limit as number) || 50;

      const facts = await memory.getFacts(userId, {
        type: type as any,
        category: category as any,
        limit,
        activeOnly: true,
      });

      if (facts.length === 0) {
        return '📝 No hay información guardada todavía. Conversemos más y iré aprendiendo sobre ti.';
      }

      // Agrupar por tipo
      const grouped: Record<string, typeof facts> = {};
      for (const fact of facts) {
        if (!grouped[fact.type]) grouped[fact.type] = [];
        grouped[fact.type].push(fact);
      }

      let response = `📝 **Información guardada (${facts.length} hechos):**\n\n`;

      const typeLabels: Record<string, string> = {
        preference: '👤 Preferencias',
        relationship: '👥 Relaciones',
        goal: '🎯 Metas',
        event: '📅 Eventos',
        fact: '📝 Hechos',
        routine: '🔄 Rutinas',
        task: '✅ Tareas',
        location: '📍 Ubicaciones',
        contact: '📞 Contactos',
        project: '💼 Proyectos',
      };

      for (const [type, typeFacts] of Object.entries(grouped)) {
        response += `**${typeLabels[type] || type}**\n`;
        for (const fact of typeFacts.slice(0, 5)) {
          response += `  • **${fact.key}**: ${fact.value}\n`;
        }
        if (typeFacts.length > 5) {
          response += `  • ... y ${typeFacts.length - 5} más\n`;
        }
        response += '\n';
      }

      return response;
    } catch (error) {
      return `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const memory_add_fact: Tool = {
  name: 'memory_add_fact',
  description: 'Agrega manualmente un hecho a la memoria del usuario. Útil para guardar información importante que el usuario comparta explícitamente.',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      type: {
        type: 'string',
        enum: ['preference', 'relationship', 'goal', 'event', 'fact', 'routine', 'task', 'location', 'contact', 'project'],
        description: 'Tipo del hecho',
      },
      category: {
        type: 'string',
        enum: ['personal', 'work', 'family', 'health', 'finance', 'education', 'hobbies', 'social', 'travel', 'other'],
        description: 'Categoría del hecho',
      },
      content: { type: 'string', description: 'Descripción completa del hecho' },
      key: { type: 'string', description: 'Palabra clave o nombre del hecho (ej: "nombre", "color favorito", "cumpleaños")' },
      value: { type: 'string', description: 'Valor del hecho (ej: "Juan", "azul", "15 de enero")' },
      priority: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'Prioridad o importancia del hecho (default: medium)',
      },
    },
    required: ['userId', 'type', 'category', 'content', 'key', 'value'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const { getMemoryInstance } = await import('../memory/index.js');
      const memory = getMemoryInstance();

      if (!memory) {
        return '❌ Memory no está inicializado. Por favor, intenta más tarde.';
      }

      const userId = args.userId as string;
      const type = args.type as any;
      const category = args.category as any;
      const content = args.content as string;
      const key = args.key as string;
      const value = args.value as string;
      const priority = (args.priority as any) || 'medium';

      const fact = {
        userId,
        type,
        category,
        content,
        key: key.toLowerCase(),
        value,
        confidence: 1.0,
        confirmations: 0,
        extractedAt: new Date(),
        priority,
      };

      await memory.saveFact(fact);

      return `✅ **Guardado:** ${key}: ${value}`;
    } catch (error) {
      return `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const memory_get_summaries: Tool = {
  name: 'memory_get_summaries',
  description: 'Obtiene los resúmenes de conversaciones previas con el usuario. Útil para recordar temas discutidos anteriormente.',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
      limit: { type: 'number', description: 'Número máximo de resúmenes (default: 10)' },
    },
    required: ['userId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const { getMemoryInstance } = await import('../memory/index.js');
      const memory = getMemoryInstance();

      if (!memory) {
        return '❌ Memory no está inicializado. Por favor, intenta más tarde.';
      }

      const userId = args.userId as string;
      const limit = (args.limit as number) || 10;

      const summaries = await memory.getSummaries(userId, limit);

      if (summaries.length === 0) {
        return '📋 No hay resúmenes de conversaciones anteriores.';
      }

      let response = `📋 **Resúmenes de conversaciones (${summaries.length}):**\n\n`;

      for (const summary of summaries) {
        response += `**${summary.title}** (${summary.messageCount} mensajes)\n`;
        response += `${summary.summary}\n`;
        if (summary.keyPoints.length > 0) {
          response += `Puntos clave: ${summary.keyPoints.slice(0, 3).join(', ')}\n`;
        }
        response += '\n';
      }

      return response;
    } catch (error) {
      return `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const mis_datos: Tool = {
  name: 'mis_datos',
  description: 'Muestra al usuario un resumen de toda la información que se ha guardado sobre él: preferencias, relaciones, metas, hechos importantes, etc.',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID del usuario' },
    },
    required: ['userId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const { getMemoryInstance } = await import('../memory/index.js');
      const memory = getMemoryInstance();

      if (!memory) {
        return '❌ Memory no está inicializado. Por favor, intenta más tarde.';
      }

      const userId = args.userId as string;

      // Obtener hechos del usuario
      const facts = await memory.getFacts(userId, { limit: 100, activeOnly: true });

      if (facts.length === 0) {
        return '📊 **Mis Datos - Aprendizaje de AI**\n\nAún no he guardado información sobre ti. Conversemos más y empezaré a aprender tus preferencias, metas y datos importantes.';
      }

      // Agrupar por tipo
      const grouped: Record<string, typeof facts> = {};
      for (const fact of facts) {
        if (!grouped[fact.type]) grouped[fact.type] = [];
        grouped[fact.type].push(fact);
      }

      let response = '📊 **Mis Datos - Lo que he aprendido sobre ti:**\n\n';

      const typeLabels: Record<string, string> = {
        preference: '👤 Preferencias Personales',
        relationship: '👥 Relaciones',
        goal: '🎯 Metas y Objetivos',
        event: '📅 Eventos',
        fact: '📝 Hechos Importantes',
        routine: '🔄 Rutinas',
        task: '✅ Tareas',
        location: '📍 Lugares',
        contact: '📞 Contactos',
        project: '💼 Proyectos',
      };

      for (const [type, typeFacts] of Object.entries(grouped)) {
        response += `**${typeLabels[type] || type}** (${typeFacts.length})\n`;
        for (const fact of typeFacts.slice(0, 5)) {
          response += `  • **${fact.key}**: ${fact.value}\n`;
        }
        if (typeFacts.length > 5) {
          response += `  • ... y ${typeFacts.length - 5} más\n`;
        }
        response += '\n';
      }

      response += `💡 _Total: ${facts.length} datos guardados_`;

      return response;
    } catch (error) {
      return `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// HERRAMIENTAS DE IMAGEN
// ============================================================================

export const image_generate: Tool = {
  name: 'image_generate',
  description: '⚠️ IMPORTANTE: Genera EXACTAMENTE UNA imagen con DALL-E 3. Usa el prompt EXACTO como lo describe el usuario, sin cambiar colores o detalles. Si el usuario dice "gato azul", genera un gato AZUL, no de otros colores.',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Descripción EXACTA de la imagen. NO modifiques lo que dice el usuario. Si dice "gato azul", usa "gato azul" exactamente.',
      },
      size: {
        type: 'string',
        description: 'Tamaño: 1024x1024 (default), 1792x1024 (horizontal), 1024x1792 (vertical)',
      },
      quality: {
        type: 'string',
        description: 'Calidad: standard (default) o hd',
      },
      style: {
        type: 'string',
        description: 'Estilo: vivid (default, más dramático) o natural (más realista)',
      },
    },
    required: ['prompt'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const prompt = args.prompt as string;
      const size = (args.size as any) || '1024x1024';
      const quality = (args.quality as any) || 'standard';
      const style = (args.style as any) || 'vivid';

      const imageGen = getImageGenerator();
      const result = await imageGen.generateImage(prompt, size, quality, style);

      return `✅ **Imagen generada**\n\n🔗 ${result.url}\n\n${result.revisedPrompt ? `📝 Prompt refinado: ${result.revisedPrompt}` : ''}`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const image_generate_cheap: Tool = {
  name: 'image_generate_cheap',
  description: 'Genera una imagen económica con DALL-E 2 (más rápido y barato que DALL-E 3)',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Descripción de la imagen que quieres generar',
      },
      size: {
        type: 'string',
        description: 'Tamaño: 512x512 (default), 256x256, 1024x1024',
      },
    },
    required: ['prompt'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const prompt = args.prompt as string;
      const size = (args.size as any) || '512x512';

      const imageGen = getImageGenerator();
      const result = await imageGen.generateImageDalle2(prompt, size);

      return `✅ **Imagen generada (DALL-E 2)**\n\n🔗 ${result.url}`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const image_describe: Tool = {
  name: 'image_describe',
  description: 'Analiza y describe una imagen desde una URL. ¿Qué hay en la imagen?',
  parameters: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'URL pública de la imagen a analizar',
      },
      prompt: {
        type: 'string',
        description: 'Pregunta específica sobre la imagen (opcional)',
      },
    },
    required: ['imageUrl'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const imageUrl = args.imageUrl as string;
      const prompt = (args.prompt as string) || 'Describe esta imagen en detalle. ¿Qué ves?';

      const imageGen = getImageGenerator();
      const description = await imageGen.describeImage(imageUrl, prompt);

      return `🖼️ **Análisis de imagen**\n\n${description}`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const image_ocr: Tool = {
  name: 'image_ocr',
  description: 'Extrae todo el texto visible de una imagen (OCR)',
  parameters: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'URL pública de la imagen con texto',
      },
    },
    required: ['imageUrl'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const imageUrl = args.imageUrl as string;

      const imageGen = getImageGenerator();
      const text = await imageGen.extractTextFromImage(imageUrl);

      return `📄 **Texto extraído de la imagen**\n\n${text}`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// HERRAMIENTAS DE GENERACIÓN DE DOCUMENTOS
// ============================================================================

export const doc_create_and_upload: Tool = {
  name: 'doc_create_and_upload',
  description: 'Genera un documento Word (.docx) con el contenido especificado y lo sube automáticamente a Google Drive',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Título del documento' },
      content: { type: 'string', description: 'Contenido del documento (texto plano)' },
      sections: {
        type: 'string',
        description: 'Secciones del documento en JSON string: [{"heading":"Título","content":"Contenido"}]',
      },
    },
    required: ['title', 'content'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const title = args.title as string;
      const content = args.content as string;
      const sectionsJson = args.sections as string | undefined;

      const docContent: { title: string; content: string; sections?: Array<{ heading: string; content: string }> } = {
        title,
        content,
      };

      if (sectionsJson) {
        docContent.sections = JSON.parse(sectionsJson);
      }

      const buffer = await docGenerator.generateDocx(docContent);
      const result = await googleDrive.uploadFileBuffer(`${title}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer);

      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const excel_create_and_upload: Tool = {
  name: 'excel_create_and_upload',
  description: 'Genera un archivo Excel (.xlsx) con los datos especificados y lo sube automáticamente a Google Drive',
  parameters: {
    type: 'object',
    properties: {
      fileName: { type: 'string', description: 'Nombre del archivo Excel' },
      sheets: {
        type: 'string',
        description: 'Hojas del Excel en JSON string: [{"name":"Hoja1","data":[{"col1":"valor1","col2":"valor2"}]}]',
      },
    },
    required: ['fileName', 'sheets'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const fileName = args.fileName as string;
      const sheetsJson = args.sheets as string;
      const sheets = JSON.parse(sheetsJson);

      const buffer = await docGenerator.generateExcel({ sheets });
      const result = await googleDrive.uploadFileBuffer(`${fileName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer);

      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const pdf_create_and_upload: Tool = {
  name: 'pdf_create_and_upload',
  description: 'Genera un archivo PDF con el contenido especificado y lo sube automáticamente a Google Drive',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Título del documento' },
      content: { type: 'string', description: 'Contenido del documento' },
      sections: {
        type: 'string',
        description: 'Secciones del documento en JSON string (opcional)',
      },
    },
    required: ['title', 'content'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const title = args.title as string;
      const content = args.content as string;
      const sectionsJson = args.sections as string | undefined;

      const docContent: { title?: string; content: string; sections?: Array<{ heading: string; content: string }> } = {
        content,
      };

      if (title) docContent.title = title;
      if (sectionsJson) docContent.sections = JSON.parse(sectionsJson);

      const buffer = await docGenerator.generatePdf(docContent);
      const result = await googleDrive.uploadFileBuffer(`${title || 'documento'}.pdf`, 'application/pdf', buffer);

      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

export const txt_create_and_upload: Tool = {
  name: 'txt_create_and_upload',
  description: 'Genera un archivo de texto (.txt) con el contenido especificado y lo sube automáticamente a Google Drive',
  parameters: {
    type: 'object',
    properties: {
      fileName: { type: 'string', description: 'Nombre del archivo (sin extensión)' },
      content: { type: 'string', description: 'Contenido del archivo de texto' },
    },
    required: ['fileName', 'content'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const fileName = args.fileName as string;
      const content = args.content as string;

      const buffer = await docGenerator.generateTxt(content);
      const result = await googleDrive.uploadFileBuffer(`${fileName}.txt`, 'text/plain', buffer);

      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};

// ============================================================================
// REGISTRO DE TODAS LAS HERRAMIENTAS
// ============================================================================

// Registro de herramientas disponibles
export const tools: Tool[] = [
  // Sistema
  get_current_time,

  // Búsqueda Web
  brave_search,
  web_search,
  wikipedia_search,

  // Firestore
  firestore_get_document,
  firestore_set_document,
  firestore_delete_document,
  firestore_query,
  firestore_list_collection,
  firestore_list_collections,
  firestore_count_collection,

  // Proyecto Firebase
  firebase_get_project_info,

  // Chat
  get_chat_history,

  // Realtime Database
  realtime_get_value,
  realtime_set_value,
  realtime_update_value,
  realtime_delete_value,
  realtime_query,

  // Storage
  storage_upload_file,
  storage_delete_file,
  storage_list_files,
  storage_get_signed_url,

  // Google Workspace - Gmail
  google_recent_emails,
  google_search_emails,
  google_read_email,
  google_send_email,

  // Google Workspace - Calendar
  google_today_events,
  google_get_events,
  google_search_events,
  google_create_event,

  // Google Workspace - Drive
  google_drive_list,
  google_drive_search,
  google_drive_get_file,
  google_drive_recent,
  google_drive_create_folder,
  google_drive_upload,
  google_drive_read_doc,
  google_drive_search_and_read_doc,

  // Google Workspace - Integración Cruzada
  google_find_emails_for_event,
  google_daily_summary,
  google_search_workspace,
  google_get_context_info,
  google_frequent_contacts,

  // Personal Notes & Tasks
  personal_save_note,
  personal_search_notes,
  personal_create_task,
  personal_list_tasks,
  personal_complete_task,
  personal_completed_tasks,
  personal_save_routine,
  personal_get_routine,
  personal_log_session,

  // Smart Memory
  memory_search,
  memory_get_facts,
  memory_add_fact,
  memory_get_summaries,
  mis_datos,

  // Image Generation & Vision
  image_generate,
  image_generate_cheap,
  image_describe,
  image_ocr,

  // Document Generation & Upload to Drive
  doc_create_and_upload,
  excel_create_and_upload,
  pdf_create_and_upload,
  txt_create_and_upload,
];

// Mapa para acceso rápido por nombre
export const toolsMap = new Map(tools.map(t => [t.name, t]));

export function getTool(name: string): Tool | undefined {
  return toolsMap.get(name);
}
