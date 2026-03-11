# AgenteDafo

Agente de IA personal con Telegram como interfaz, ejecutado completamente en local.

## Características

- 🤖 Comunicación vía Telegram
- 🧠 Pensamiento con LLM (Groq / OpenRouter)
- 🔧 Sistema de herramientas extensible
- 💾 Memoria persistente con SQLite
- 🔥 **Integración con Firebase (Firestore, Realtime Database, Storage)**
- 🔒 Seguridad con whitelist de usuarios
- 🏃 Ejecución local sin servidor web

## Instalación

```bash
npm install
```

## Configuración

1. Copia `.env.example` a `.env`
2. Configura tus credenciales:
   - `TELEGRAM_BOT_TOKEN`: Obténlo de [@BotFather](https://t.me/BotFather)
   - `TELEGRAM_ALLOWED_USER_IDS`: Tu ID de Telegram (obtenlo de [@userinfobot](https://t.me/userinfobot))
   - `GROQ_API_KEY`: Obténlo de [Groq Console](https://console.groq.com)
   - `OPENROUTER_API_KEY`: Opcional, como fallback

### Configuración de Firebase (Opcional)

Para habilitar las herramientas de Firebase, consulta la guía completa en [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

Básicamente necesitas:
1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Descargar el archivo `service-account.json`
3. Configurar las variables de entorno en `.env`

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
npm start
```

## Estructura del proyecto

```
src/
├── bot/          # Integración con Telegram
├── agent/        # Lógica del agente y loop
├── tools/        # Herramientas disponibles
├── memory/       # Persistencia con SQLite
├── firebase/     # Integración con Firebase MCP
├── config/       # Configuración centralizada
├── types/        # Definiciones de TypeScript
└── index.ts      # Punto de entrada
```

## Herramientas disponibles

### Sistema
- `get_current_time` - Obtiene la fecha y hora actual

### Firebase (requiere configuración)
- **Firestore**: CRUD completo de documentos
- **Realtime Database**: Gestión de datos en tiempo real
- **Storage**: Subida, eliminación y listado de archivos

Ver [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) para configurar Firebase.

## Escalabilidad futura

El proyecto está diseñado para ser fácilmente extendible con:
- Transcripción de audio
- Texto a voz (ElevenLabs)
- Más integraciones en la nube
- Más herramientas y canales de comunicación
