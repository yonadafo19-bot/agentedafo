/**
 * Google Workspace Integration Tools
 * Herramientas que conectan diferentes servicios de Google
 */

import * as gmail from './gmail.js';
import * as calendar from './calendar.js';
import * as drive from './drive.js';

/**
 * Busca emails relacionados con un evento de Calendar
 * Útil para encontrar correos sobre una reunión específica
 */
export async function findEmailsForEvent(
  eventTitle: string,
  eventDate?: string,
  maxResults: number = 5
): Promise<string> {
  try {
    // Buscar emails con el título del evento en el asunto
    const subjectResults = await gmail.searchEmails(eventTitle, maxResults);

    // Si se proporciona fecha, también buscar emails de esa fecha
    let dateResults = '';
    if (eventDate) {
      const dateObj = new Date(eventDate);
      const dateStr = dateObj.toLocaleDateString('es-ES');
      // Gmail query syntax para fecha
      dateResults = await gmail.searchEmails(`after:${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`, maxResults);
    }

    let output = `📧 **Emails relacionados con "${eventTitle}"**\n\n`;

    if (subjectResults.includes('No se encontraron')) {
      output += 'No se encontraron emails con el título del evento.\n\n';
    } else {
      output += `📌 **Por asunto:**\n${subjectResults}\n`;
    }

    if (eventDate && dateResults && !dateResults.includes('No se encontraron')) {
      output += `📌 **De la fecha del evento:**\n${dateResults}`;
    }

    return output;
  } catch (error) {
    throw new Error(`Error buscando emails del evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Obtiene un resumen diario completo de Google Workspace
 * Incluye eventos de hoy, emails recientes y archivos recientes de Drive
 */
export async function getDailySummary(): Promise<string> {
  try {
    // Obtener eventos de hoy
    const todayEvents = await calendar.getTodayEvents();

    // Obtener emails recientes (últimos 5)
    const recentEmails = await gmail.getRecentEmails(5);

    // Obtener archivos recientes de Drive (últimos 3 días)
    const recentFiles = await drive.getRecentFiles(3);

    let output = `📊 **RESUMEN DEL DÍA - Google Workspace**\n\n`;

    output += `📅 **CALENDARIO - Eventos de Hoy**\n`;
    output += `${todayEvents}\n\n`;

    output += `📧 **GMAIL - Emails Recientes**\n`;
    if (recentEmails.includes('No se encontraron')) {
      output += `No hay emails recientes.\n`;
    } else {
      output += `${recentEmails}\n`;
    }
    output += `\n`;

    output += `📁 **DRIVE - Archivos Recientes**\n`;
    if (recentFiles.includes('No se encontraron')) {
      output += `No hay archivos recientes.\n`;
    } else {
      output += `${recentFiles}\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Error obteniendo resumen del día: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Busca contenido en TODO Google Workspace
 * Busca en Calendar, Gmail y Drive simultáneamente
 */
export async function searchAllWorkspace(query: string): Promise<string> {
  try {
    // Buscar en Calendar
    const calendarResults = await calendar.searchEvents(query);

    // Buscar en Gmail
    const emailResults = await gmail.searchEmails(query, 5);

    // Buscar en Drive
    const driveResults = await drive.searchFiles(query, 5);

    let output = `🔍 **Resultados de "${query}" en Google Workspace**\n\n`;

    output += `📅 **Calendar**\n`;
    if (calendarResults.includes('No se encontraron')) {
      output += `No se encontraron eventos.\n`;
    } else {
      output += `${calendarResults}\n`;
    }
    output += `\n`;

    output += `📧 **Gmail**\n`;
    if (emailResults.includes('No se encontraron')) {
      output += `No se encontraron emails.\n`;
    } else {
      output += `${emailResults}\n`;
    }
    output += `\n`;

    output += `📁 **Drive**\n`;
    if (driveResults.includes('No se encontraron')) {
      output += `No se encontraron archivos.\n`;
    } else {
      output += `${driveResults}\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Error buscando en Workspace: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Encuentra información contextual sobre un contacto o tema
 * Busca emails, eventos y archivos relacionados
 */
export async function getContextInfo(topic: string): Promise<string> {
  try {
    let output = `🔍 **Información contextual sobre "${topic}"**\n\n`;

    // Buscar emails recientes sobre el tema
    try {
      const emails = await gmail.searchEmails(topic, 3);
      if (!emails.includes('No se encontraron')) {
        output += `📧 **Emails relacionados:**\n${emails}\n\n`;
      }
    } catch {
      // Ignorar errores de búsqueda individual
    }

    // Buscar eventos futuros o pasados
    try {
      const events = await calendar.searchEvents(topic);
      if (!events.includes('No se encontraron')) {
        output += `📅 **Eventos relacionados:**\n${events}\n\n`;
      }
    } catch {
      // Ignorar errores de búsqueda individual
    }

    // Buscar archivos en Drive
    try {
      const files = await drive.searchFiles(topic, 3);
      if (!files.includes('No se encontraron')) {
        output += `📁 **Archivos relacionados:**\n${files}\n\n`;
      }
    } catch {
      // Ignorar errores de búsqueda individual
    }

    if (output === `🔍 **Información contextual sobre "${topic}"**\n\n`) {
      output += 'No se encontró información relacionada en Google Workspace.';
    }

    return output;
  } catch (error) {
    throw new Error(`Error obteniendo contexto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Lista contactos frecuentes basándose en emails recientes
 */
export async function getFrequentContacts(): Promise<string> {
  try {
    const emails = await gmail.getRecentEmails(20);

    // Extraer remitentes únicos
    const senders = new Map<string, { count: number; lastSubject: string }>();

    const lines = emails.split('\n');
    let currentSender = '';
    let currentSubject = '';

    for (const line of lines) {
      const fromMatch = line.match(/De:\s*(.+)/);
      if (fromMatch) {
        currentSender = fromMatch[1].trim();
      }
      const subjectMatch = line.match(/\*\*(.+)\*\*/);
      if (subjectMatch && currentSender) {
        currentSubject = subjectMatch[1];
        const existing = senders.get(currentSender);
        if (existing) {
          existing.count++;
          existing.lastSubject = currentSubject;
        } else {
          senders.set(currentSender, { count: 1, lastSubject: currentSubject });
        }
      }
    }

    if (senders.size === 0) {
      return '👥 No se encontraron contactos recientes.';
    }

    // Ordenar por frecuencia
    const sorted = Array.from(senders.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    let output = `👥 **Contactos Frecuentes** (basado en emails recientes)\n\n`;

    for (const [sender, info] of sorted) {
      output += `📧 ${sender}\n`;
      output += `   Emails: ${info.count}\n`;
      output += `   Último asunto: ${info.lastSubject}\n\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Error obteniendo contactos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
