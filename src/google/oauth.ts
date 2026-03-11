/**
 * Google OAuth 2.0 Authentication
 * Para acceder a Gmail, Calendar y otros servicios de Google Workspace
 */

import { google } from 'googleapis';

// Scopes necesarios para cada servicio
export const SCOPES = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ],
  calendar: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  drive: [
    'https://www.googleapis.com/auth/drive.readonly',
  ],
  sheets: [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
  docs: [
    'https://www.googleapis.com/auth/documents.readonly',
  ],
};

/**
 * Crea un cliente OAuth2 autenticado
 */
export async function createOAuth2Client() {
  const OAuth2 = google.auth.OAuth2;

  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID || '',
    process.env.GOOGLE_CLIENT_SECRET || '',
    'http://localhost' // Redirect URL para OAuth
  );

  // Si hay un refresh token, usarlo
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Refrescar el token
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      return oauth2Client;
    } catch (error) {
      console.error('Error al refrescar el token:', error);
      throw new Error('El token de refresco es inválido o ha expirado');
    }
  }

  // Si no hay refresh token, se necesita OAuth flow
  throw new Error(`
⚠️  NO HAY TOKEN DE REFRESCO CONFIGURADO

Para usar Google Workspace (Gmail, Calendar, etc.), necesitas configurar OAuth:

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Crea un "OAuth 2.0 Client ID" (Desktop app)
3. Descarga el JSON con client_id y client_secret
4. Añade estas variables al .env:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - GOOGLE_OAUTH_REFRESH_TOKEN

Para obtener el refresh token, ejecuta: npm run google-auth
  `);
}

/**
 * Obtiene la URL de autorización
 */
export function getAuthUrl() {
  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID || '',
    process.env.GOOGLE_CLIENT_SECRET || '',
    'http://localhost'
  );

  const scopes = [
    ...SCOPES.gmail,
    ...SCOPES.calendar,
    ...SCOPES.drive,
    ...SCOPES.sheets,
    ...SCOPES.docs,
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

/**
 * Intercambia el código de autorización por tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID || '',
    process.env.GOOGLE_CLIENT_SECRET || '',
    'urn:ietf:wg:oauth:2.0:oob'
  );

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}
