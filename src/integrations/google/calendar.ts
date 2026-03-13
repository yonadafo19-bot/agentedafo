/**
 * Google Calendar API Integration
 */

import { calendar_v3, google } from 'googleapis';
import { createOAuth2Client } from './oauth.js';

let calendarClient: calendar_v3.Calendar | null = null;

/**
 * Obtiene el cliente de Calendar autenticado
 */
async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  if (!calendarClient) {
    const auth = await createOAuth2Client();
    calendarClient = google.calendar({ version: 'v3', auth });
  }
  return calendarClient;
}

/**
 * Lista los calendarios del usuario
 */
export async function listCalendars(): Promise<string> {
  try {
    const calendar = await getCalendarClient();

    const response = await calendar.calendarList.list();

    if (!response.data.items) {
      return 'No se encontraron calendarios.';
    }

    let output = '📅 **Tus Calendarios:**\n\n';

    for (const cal of response.data.items) {
      output += `📆 ${cal.summary || 'Sin nombre'}\n`;
      output += `   ID: ${cal.id}\n`;
      output += `   Primario: ${cal.primary ? 'Sí' : 'No'}\n`;
      if (cal.description) {
        output += `   Descripción: ${cal.description}\n`;
      }
      output += '\n';
    }

    return output;
  } catch (error) {
    throw new Error(`Error al listar calendarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Obtiene eventos de un calendario
 */
export async function getEvents(
  calendarId: string = 'primary',
  days: number = 7
): Promise<string> {
  try {
    const calendar = await getCalendarClient();

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + days);

    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    });

    if (!response.data.items || response.data.items.length === 0) {
      return `No hay eventos en los próximos ${days} días.`;
    }

    let output = `📅 **Eventos para los próximos ${days} días:**\n\n`;

    for (const event of response.data.items) {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;

      output += `🗓️  **${event.summary || 'Sin título'}**\n`;
      output += `   Inicio: ${start ? new Date(start).toLocaleString('es-ES') : 'Todo el día'}\n`;
      if (end) {
        output += `   Fin: ${new Date(end).toLocaleString('es-ES')}\n`;
      }
      if (event.location) {
        output += `   📍 ${event.location}\n`;
      }
      if (event.description) {
        const desc = event.description.length > 100
          ? event.description.substring(0, 100) + '...'
          : event.description;
        output += `   📝 ${desc}\n`;
      }
      if (event.hangoutLink) {
        output += `   🔗 Meet: ${event.hangoutLink}\n`;
      }
      output += '\n';
    }

    return output;
  } catch (error) {
    throw new Error(`Error al obtener eventos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Busca eventos específicos
 */
export async function searchEvents(query: string, calendarId: string = 'primary'): Promise<string> {
  try {
    const calendar = await getCalendarClient();

    const now = new Date();
    const endDate = new Date();
    endDate.setFullYear(now.getFullYear() + 1);

    const response = await calendar.events.list({
      calendarId,
      q: query,
      timeMin: now.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      maxResults: 20,
    });

    if (!response.data.items || response.data.items.length === 0) {
      return `No se encontraron eventos con: "${query}"`;
    }

    let output = `🔍 **Eventos encontrados con "${query}":**\n\n`;

    for (const event of response.data.items) {
      const start = event.start?.dateTime || event.start?.date;

      output += `🗓️  **${event.summary || 'Sin título'}**\n`;
      output += `   Fecha: ${start ? new Date(start).toLocaleString('es-ES') : 'Todo el día'}\n`;
      output += `   ID: ${event.id}\n\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Error al buscar eventos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Crea un nuevo evento
 */
export async function createEvent(
  calendarId: string,
  summary: string,
  start: string,
  end: string,
  description?: string,
  location?: string
): Promise<string> {
  try {
    const calendar = await getCalendarClient();

    const event = {
      summary,
      start: {
        dateTime: new Date(start).toISOString(),
      },
      end: {
        dateTime: new Date(end).toISOString(),
      },
      description,
      location,
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return `✅ **Evento creado:** ${summary}\n` +
           `📅 Inicio: ${new Date(start).toLocaleString('es-ES')}\n` +
           `📅 Fin: ${new Date(end).toLocaleString('es-ES')}\n` +
           `🔗 Link: ${response.data.htmlLink || ''}`;
  } catch (error) {
    throw new Error(`Error al crear evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Obtiene eventos de hoy
 */
export async function getTodayEvents(calendarId: string = 'primary'): Promise<string> {
  try {
    const calendar = await getCalendarClient();

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    });

    if (!response.data.items || response.data.items.length === 0) {
      return '📅 No tienes eventos hoy.';
    }

    let output = `📅 **Eventos de hoy (${now.toLocaleDateString('es-ES')}):**\n\n`;

    for (const event of response.data.items) {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;

      output += `🗓️  **${event.summary || 'Sin título'}**\n`;
      output += `   ${start ? new Date(start).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}) : 'Todo el día'}`;
      if (end && event.start?.dateTime) {
        output += ` - ${new Date(end).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}`;
      }
      if (event.location) {
        output += `\n   📍 ${event.location}`;
      }
      output += '\n\n';
    }

    return output;
  } catch (error) {
    throw new Error(`Error al obtener eventos de hoy: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
