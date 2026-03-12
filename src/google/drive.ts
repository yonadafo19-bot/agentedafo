/**
 * Google Drive Integration
 * Permite listar, buscar, crear, subir y gestionar archivos en Google Drive
 */

import { google } from 'googleapis';
import { createOAuth2Client } from './oauth.js';

const drive = google.drive('v3');

/**
 * Lista archivos de Drive con filtros opcionales
 */
export async function listFiles(
  pageSize = 10,
  query?: string,
  orderBy = 'modifiedTime desc'
): Promise<string> {
  try {
    const auth = await createOAuth2Client();
    const response = await drive.files.list({
      auth,
      pageSize,
      q: query,
      orderBy,
      fields: 'files(id,name,mimeType,webViewLink,modifiedTime,size,owners)',
    });

    const files = response.data.files || [];

    if (files.length === 0) {
      return '📁 No se encontraron archivos en Drive.';
    }

    let output = `📁 **Archivos en Google Drive** (${files.length} encontrados)\n\n`;

    files.forEach((file, i) => {
      const icon = getFileIcon(file.mimeType || '');
      const size = file.size ? formatFileSize(parseInt(file.size)) : '-';
      const owner = file.owners?.[0]?.displayName || 'Desconocido';
      const modified = file.modifiedTime ? formatDate(file.modifiedTime) : '-';

      output += `${i + 1}. ${icon} **${file.name}**\n`;
      output += `   📋 Tipo: ${file.mimeType || 'Desconocido'}\n`;
      output += `   📏 Tamaño: ${size}\n`;
      output += `   👤 Propietario: ${owner}\n`;
      output += `   📅 Modificado: ${modified}\n`;
      if (file.webViewLink) {
        output += `   🔗 ${file.webViewLink}\n`;
      }
      output += '\n';
    });

    return output;
  } catch (error) {
    throw new Error(`Error listando archivos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Busca archivos en Drive por nombre o contenido
 */
export async function searchFiles(searchQuery: string, pageSize = 10): Promise<string> {
  // Buscar en nombre de archivo
  const query = `name contains '${searchQuery.replace(/'/g, "\\'")}'`;
  return listFiles(pageSize, query);
}

/**
 * Obtiene información de un archivo específico
 */
export async function getFile(fileId: string): Promise<string> {
  try {
    const auth = await createOAuth2Client();
    const response = await drive.files.get({
      auth,
      fileId,
      fields: 'id,name,mimeType,webViewLink,webContentLink,modifiedTime,createdTime,size,owners,description,parents',
    });

    const file = response.data;

    let output = `📄 **Información del Archivo**\n\n`;
    output += `📝 Nombre: **${file.name}**\n`;
    output += `🆔 ID: ${file.id}\n`;
    output += `📋 Tipo MIME: ${file.mimeType || 'Desconocido'}\n`;

    if (file.description) {
      output += `📄 Descripción: ${file.description}\n`;
    }

    if (file.size) {
      output += `📏 Tamaño: ${formatFileSize(parseInt(file.size))}\n`;
    }

    if (file.owners?.[0]) {
      output += `👤 Propietario: ${file.owners[0].displayName} (${file.owners[0].emailAddress})\n`;
    }

    if (file.createdTime) {
      output += `📅 Creado: ${formatDate(file.createdTime)}\n`;
    }

    if (file.modifiedTime) {
      output += `🔄 Modificado: ${formatDate(file.modifiedTime)}\n`;
    }

    if (file.webViewLink) {
      output += `🔗 Ver en navegador: ${file.webViewLink}\n`;
    }

    if (file.webContentLink) {
      output += `📥 Descargar: ${file.webContentLink}\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Error obteniendo archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Crea una carpeta en Drive
 */
export async function createFolder(folderName: string, parentFolderId?: string): Promise<string> {
  try {
    const auth = await createOAuth2Client();

    const fileMetadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const response = await drive.files.create({
      auth,
      requestBody: fileMetadata,
      fields: 'id,name,webViewLink',
    });

    const folder = response.data;

    return `✅ **Carpeta creada exitosamente!**\n\n` +
      `📁 Nombre: **${folder.name}**\n` +
      `🆔 ID: ${folder.id}\n` +
      `🔗 ${folder.webViewLink}`;
  } catch (error) {
    throw new Error(`Error creando carpeta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Sube un archivo a Drive desde un Buffer
 */
export async function uploadFileBuffer(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  parentFolderId?: string
): Promise<string> {
  try {
    const auth = await createOAuth2Client();

    const fileMetadata: any = {
      name: fileName,
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const media = {
      mimeType,
      body: buffer,
    };

    const response = await drive.files.create({
      auth,
      requestBody: fileMetadata,
      media,
      fields: 'id,name,webViewLink,webContentLink,size',
    });

    const file = response.data;

    return `✅ **Archivo subido exitosamente!**\n\n` +
      `📄 Nombre: **${file.name}**\n` +
      `🆔 ID: ${file.id}\n` +
      `📏 Tamaño: ${file.size ? formatFileSize(parseInt(file.size)) : '-'}\n` +
      `🔗 Ver: ${file.webViewLink}\n` +
      `📥 Descargar: ${file.webContentLink}`;
  } catch (error) {
    throw new Error(`Error subiendo archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Sube un archivo a Drive (requiere contenido en base64)
 */
export async function uploadFile(
  fileName: string,
  mimeType: string,
  base64Content: string,
  parentFolderId?: string
): Promise<string> {
  try {
    const auth = await createOAuth2Client();

    const fileMetadata: any = {
      name: fileName,
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const media = {
      mimeType,
      body: Buffer.from(base64Content, 'base64'),
    };

    const response = await drive.files.create({
      auth,
      requestBody: fileMetadata,
      media,
      fields: 'id,name,webViewLink,webContentLink,size',
    });

    const file = response.data;

    return `✅ **Archivo subido exitosamente!**\n\n` +
      `📄 Nombre: **${file.name}**\n` +
      `🆔 ID: ${file.id}\n` +
      `📏 Tamaño: ${file.size ? formatFileSize(parseInt(file.size)) : '-'}\n` +
      `🔗 Ver: ${file.webViewLink}\n` +
      `📥 Descargar: ${file.webContentLink}`;
  } catch (error) {
    throw new Error(`Error subiendo archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Lista archivos recientes (modificados en los últimos N días)
 */
export async function getRecentFiles(days = 7): Promise<string> {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const dateStr = date.toISOString();

  const query = `modifiedTime > '${dateStr}'`;
  return listFiles(20, query);
}

/**
 * Lista archivos por tipo (documentos, hojas de cálculo, presentaciones, etc.)
 */
export async function listFilesByType(mimeType: string): Promise<string> {
  return listFiles(20, `mimeType = '${mimeType}'`);
}

// Utilidades

function getFileIcon(mimeType: string): string {
  if (mimeType.includes('folder')) return '📁';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('document')) return '📄';
  if (mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('presentation')) return '📽️';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('video')) return '🎥';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return '📦';
  return '📄';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Lee el contenido de un Google Doc
 */
export async function readGoogleDoc(fileId: string): Promise<string> {
  try {
    const auth = await createOAuth2Client();

    // Primero obtener información del archivo para confirmar que es un doc
    const fileResponse = await drive.files.get({
      auth,
      fileId,
      fields: 'id,name,mimeType',
    });

    const file = fileResponse.data;
    const isGoogleDoc = file.mimeType === 'application/vnd.google-apps.document';

    if (!isGoogleDoc) {
      throw new Error(`El archivo "${file.name}" no es un Google Doc. Tipo: ${file.mimeType}`);
    }

    // Exportar el documento a texto plano
    const exportResponse = await drive.files.export(
      {
        auth,
        fileId,
        mimeType: 'text/plain',
      },
      { responseType: 'text' }
    );

    // El contenido viene como string
    const content = exportResponse.data as string;

    return `📄 **${file.name}**\n\n${content}`;
  } catch (error) {
    throw new Error(`Error leyendo Google Doc: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Busca y lee un documento de Google Drive por nombre
 */
export async function searchAndReadDoc(fileName: string): Promise<string> {
  try {
    const auth = await createOAuth2Client();

    // Buscar el documento
    const query = `name contains '${fileName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.document'`;
    const response = await drive.files.list({
      auth,
      q: query,
      pageSize: 5,
      fields: 'files(id,name)',
    });

    const files = response.data.files || [];

    if (files.length === 0) {
      return `❌ No se encontró ningún documento llamado "${fileName}"`;
    }

    if (files.length > 1) {
      let msg = `⚠️ Se encontraron ${files.length} documentos con ese nombre:\n\n`;
      files.forEach((f, i) => {
        msg += `${i + 1}. ${f.name} (ID: ${f.id})\n`;
      });
      msg += `\nLeyendo el primer resultado...`;
      // Leer el primero
      return await readGoogleDoc(files[0].id!);
    }

    // Leer el único resultado
    return await readGoogleDoc(files[0].id!);
  } catch (error) {
    throw new Error(`Error buscando documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
