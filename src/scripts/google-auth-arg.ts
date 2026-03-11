/**
 * Script para obtener OAuth tokens de Google (con código como argumento)
 * Ejecuta: tsx src/scripts/google-auth-arg.ts "codigo_autorizacion"
 */

import dotenv from 'dotenv';
import { google } from 'googleapis';

// Cargar variables de entorno
dotenv.config();

// Cliente ID y Secret desde variables de entorno
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Obtener código de los argumentos
const code = process.argv[2];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ ERROR: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET son requeridos');
  process.exit(1);
}

if (!code) {
  console.error('❌ ERROR: Debes proporcionar el código de autorización');
  console.error('Uso: tsx src/scripts/google-auth-arg.ts "codigo_autorizacion"');
  process.exit(1);
}

async function main() {
  console.log('🔄 Obteniendo tokens...\n');

  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost');

  // Scopes para Gmail, Calendar y Drive
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
  ];

  // Generar URL de autorización con todos los scopes
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  console.log('📋 URL de autorización con todos los permisos (Gmail + Calendar + Drive):');
  console.log(authUrl + '\n');

  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('✅ **Tokens obtenidos correctamente!**\n');
    console.log('='.repeat(60));
    console.log('\n📋 Añade esto a tu archivo .env:\n');
    console.log(`GOOGLE_CLIENT_ID="${CLIENT_ID}"`);
    console.log(`GOOGLE_CLIENT_SECRET="${CLIENT_SECRET}"`);
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log(`GOOGLE_EMAIL="tu_email@gmail.com"  # Reemplaza con tu email\n`);

    console.log('⚠️  IMPORTANTE:');
    console.log('- Guarda el REFRESH_TOKEN de forma segura');
    console.log('- No compartas tus tokens con nadie');
    console.log('- El access token expira, pero el refresh_token es permanente');
    console.log('\n✅ Setup completado! Reinicia el bot para usar Google Workspace.\n');

  } catch (error) {
    console.error('❌ Error al obtener tokens:', error);
    process.exit(1);
  }
}

main();
