# Configuración de Google Workspace para AgenteDafo

## 📋 Requisitos

Para usar Gmail y Calendar desde AgenteDafo, necesitas configurar OAuth 2.0 de Google.

## 🔧 Pasos de Configuración

### 1. Crear Proyecto en Google Cloud Console

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Crea un nuevo proyecto o selecciona uno existente
3. En "APIs y servicios", habilita:
   - Gmail API
   - Google Calendar API

### 2. Crear Credenciales OAuth 2.0

1. En la pantalla de consentimiento OAuth, configura:
   - **Tipo**: Externo
   - **Nombre**: AgenteDafo
   - **Email de soporte**: tu email
   - **Dominios autorizados**: agente.ai (o el que prefieras)

2. Crea credenciales OAuth:
   - Tipo: **Desktop app**
   - Descarga el JSON con `client_id` y `client_secret`

### 3. Obtener Refresh Token

Ejecuta este script para obtener el refresh token:

```bash
npm run google-auth
```

Sigue estos pasos:
1. Copia la URL que aparece
2. Abrela en tu navegador
3. Inicia sesión y da permisos
4. Copia el código de autorización
5. Pégalo en la terminal
6. Copia el refresh token que aparece

### 4. Configurar Variables de Entorno

Añade a tu archivo `.env`:

```env
# Google Workspace OAuth
GOOGLE_CLIENT_ID="tu_client_id"
GOOGLE_CLIENT_SECRET="tu_client_secret"
GOOGLE_OAUTH_REFRESH_TOKEN="tu_refresh_token"
GOOGLE_EMAIL="tu_email@gmail.com"
```

## 🎯 Comandos Disponibles

Una vez configurado, puedes usar estos comandos desde Telegram:

### Gmail:
- "¿Qué emails tengo pendientes?"
- "Muéstrame los últimos 5 emails"
- "Busca emails de ejemplo.com"
- "Lee el email con ID 12345"

### Calendar:
- "¿Tengo alguna reunión hoy?"
- "¿Qué eventos tengo esta semana?"
- "Busca reuniones con cliente X"
- "Crea una reunión mañana a las 15:00"

## ⚠️ Notas Importantes

- El refresh token permite acceso continuo sin tener que autorizar cada vez
- Guarda el refresh token de forma segura
- Los permisos incluyen lectura y envío de emails, y gestión de calendario
- Si el token expira, necesitas ejecutar `npm run google-auth` nuevamente

## 🔒 Seguridad

- Nunca compartas tu refresh token
- No commiteas el archivo `.env` con tokens reales
- Usa cuentas de prueba durante el desarrollo
- Revoca los tokens cuando ya no los necesites desde: https://myaccount.google.com/permissions
