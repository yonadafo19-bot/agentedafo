/**
 * Script para obtener OAuth tokens de Google
 * Ejecuta: npm run google-auth
 */

import dotenv from 'dotenv';
import * as readline from 'readline';
import { google } from 'googleapis';

// Cargar variables de entorno
dotenv.config();

// Cliente ID y Secret desde variables de entorno
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ ERROR: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET son requeridos');
  console.error('\nAñade estas variables a tu .env:');
  console.error('GOOGLE_CLIENT_ID="tu_client_id"');
  console.error('GOOGLE_CLIENT_SECRET="tu_client_secret"\n');
  console.error('Obtén estas credenciales desde: https://console.cloud.google.com/apis/credentials');
  process.exit(1);
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🔑 **Google OAuth 2.0 - Setup para AgenteDafo**\n');

  const OAuth2 = google.auth.OAuth2;

  const oauth2Client = new OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'http://localhost'
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  console.log('📋 PASO 1: Autoriza AgenteDafo');
  console.log('='.repeat(60));
  console.log('\n1. Copia esta URL y ábrela en tu navegador:\n');
  console.log(authUrl + '\n');
  console.log('2. Inicia sesión con tu cuenta de Google');
  console.log('3. Concede los permisos solicitados');
  console.log('4. Copia el código de autorización que aparece\n');

  const code = await askQuestion('📝 Pega aquí el código de autorización: ');

  try {
    console.log('\n🔄 Obteniendo tokens...\n');

    const { tokens } = await oauth2Client.getToken(code);

    console.log('✅ **Tokens obtenidos correctamente!**\n');
    console.log('='.repeat(60));
    console.log('\n📋 Añade esto a tu archivo .env:\n');
    console.log(`GOOGLE_CLIENT_ID="${CLIENT_ID}"`);
    console.log(`GOOGLE_CLIENT_SECRET="${CLIENT_SECRET}"`);
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log(`GOOGLE_EMAIL="tu_email@gmail.com"  # Reemplaza con tu email\n`);

    if (tokens.access_token) {
      console.log('🎫 Access Token (expira pronto):');
      console.log(tokens.access_token.substring(0, 50) + '...\n');
    }

    console.log('⚠️  IMPORTANTE:');
    console.log('- Guarda el REFRESH_TOKEN de forma segura');
    console.log('- No compartas tus tokens con nadie');
    console.log('- El access token expira, pero el refresh_token es permanente');
    console.log('\n✅ Setup completado! Reinicia el bot para usar Google Workspace.\n');

  } catch (error) {
    console.error('❌ Error al obtener tokens:', error);
    console.error('\nAsegúrate de:');
    console.error('- Haber copiado el código correctamente');
    console.error('- Que el CLIENT_ID y CLIENT_SECRET son correctos');
    console.error('- Que has concedido todos los permisos\n');
    process.exit(1);
  }
}

main();
