import { validateConfig } from './infrastructure/config/config/index.js';
import { TelegramBot } from './integrations/telegram/index.js';

async function main(): Promise<void> {
  try {
    // Validar configuración
    validateConfig();

    // Crear e iniciar bot
    const bot = new TelegramBot();
    await bot.start();

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error fatal:', error.message);
      if (error.message.includes('Configuración inválida')) {
        console.error('\n💡 Asegúrate de configurar tu archivo .env con las credenciales necesarias.');
      }
    } else {
      console.error('❌ Error fatal desconocido:', error);
    }
    process.exit(1);
  }
}

main();
