/**
 * Gmail API Integration
 */

import { gmail_v1, google } from 'googleapis';
import { createOAuth2Client } from './oauth.js';

let gmailClient: gmail_v1.Gmail | null = null;

/**
 * Obtiene el cliente de Gmail autenticado
 */
async function getGmailClient(): Promise<gmail_v1.Gmail> {
  if (!gmailClient) {
    const auth = await createOAuth2Client();
    gmailClient = google.gmail({ version: 'v1', auth });
  }
  return gmailClient;
}

/**
 * Obtiene los últimos emails
 */
export async function getRecentEmails(max: number = 5): Promise<string> {
  try {
    const gmail = await getGmailClient();

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: max,
    });

    if (!response.data.messages) {
      return 'No se encontraron emails.';
    }

    let output = `📧 **Últimos ${max} emails:**\n\n`;

    for (const message of response.data.messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = msg.data.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
      const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin asunto';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      output += `📬 **${subject}**\n`;
      output += `   De: ${from}\n`;
      output += `   Fecha: ${new Date(date).toLocaleDateString('es-ES')}\n`;
      output += `   ID: ${message.id}\n\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Error al obtener emails: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Busca emails
 */
export async function searchEmails(query: string, max: number = 10): Promise<string> {
  try {
    const gmail = await getGmailClient();

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: max,
    });

    if (!response.data.messages) {
      return `No se encontraron emails para: "${query}"`;
    }

    let output = `🔍 **Resultados para "${query}":**\n\n`;

    for (const message of response.data.messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = msg.data.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
      const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin asunto';

      output += `📬 **${subject}**\n`;
      output += `   De: ${from}\n`;
      output += `   ID: ${message.id}\n\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Error al buscar emails: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Lee el contenido completo de un email
 */
export async function readEmail(messageId: string): Promise<string> {
  try {
    const gmail = await getGmailClient();

    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const headers = msg.data.payload?.headers || [];
    const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
    const to = headers.find(h => h.name === 'To')?.value || 'Desconocido';
    const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin asunto';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    // Extraer el cuerpo del email
    function getEmailBody(payload: any): string {
      if (payload.body?.data) {
        return Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }
      if (payload.parts) {
        for (const part of payload.parts) {
          const body = getEmailBody(part);
          if (body) return body;
        }
      }
      return '';
    }

    const body = getEmailBody(msg.data.payload);

    let output = `📧 **Email Completo**\n\n`;
    output += `**De:** ${from}\n`;
    output += `**Para:** ${to}\n`;
    output += `**Asunto:** ${subject}\n`;
    output += `**Fecha:** ${new Date(date).toLocaleString('es-ES')}\n\n`;
    output += `---\n\n`;
    output += body || '(Sin contenido)';

    return output;
  } catch (error) {
    throw new Error(`Error al leer email: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Envía un email
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<string> {
  try {
    const gmail = await getGmailClient();

    const email = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body,
    ].join('\r\n');

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    return `✅ Email enviado a ${to}\nAsunto: ${subject}`;
  } catch (error) {
    throw new Error(`Error al enviar email: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
