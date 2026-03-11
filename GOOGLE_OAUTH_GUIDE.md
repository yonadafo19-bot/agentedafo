# 🔑 GUÍA PASO A PASO - CONFIGURACIÓN GOOGLE OAUTH

## 📋 Preparación

Antes de empezar, asegúrate de tener:
- ✅ Una cuenta de Google (Gmail o Google Workspace)
- ✅ Acceso a Google Cloud Console
- ✅ 5-10 minutos para completar el proceso

---

## 🎯 PASO 1: Habilitar las APIs

1. Ve a: https://console.cloud.google.com/apis/dashboard
2. Crea un nuevo proyecto o selecciona "AgenteDafo"
3. Haz clic en "+ HABILITAR APIS Y SERVICIOS"
4. Busca y habilita:
   - **Gmail API**
   - **Google Calendar API**

---

## 🔑 PASO 2: Crear Pantalla de Consentimiento

1. Ve a: https://console.cloud.google.com/apis/credentials/consent
2. Selecciona tu proyecto
3. Configura la pantalla de consentimiento:
   - **Tipo**: Externo
   - **Nombre**: AgenteDafo
   - **Email de soporte**: tu email
   - **Dominios autorizados**: agente.local (o el que prefieras)
4. Haz clic en "GUARDAR"

---

## 🎫 PASO 3: Crear Credenciales OAuth

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Selecciona "Credenciales" > "Crear credenciales" > "OAuth client ID"
3. Selecciona **"Desktop app"**
4. Nombre: "AgenteDafo Desktop"
5. Haz clic en **"CREAR"**
6. Se descargará un archivo JSON o verás un diálogo con:
   - **Client ID** (algo como: xxxxx.apps.googleusercontent.com)
   - **Client Secret** (una cadena larga)

✅ **COPIA ESTOS DOS VALORES**

---

## ⚡ PASO 4: Ejecutar el Script de Autenticación

Una vez tengas el Client ID y Client Secret:

1. Añádelos a tu archivo `.env`:
```env
GOOGLE_CLIENT_ID="tu_client_id_aqui"
GOOGLE_CLIENT_SECRET="tu_client_secret_aqui"
```

2. Ejecuta el script:
```bash
npm run google-auth
```

3. El script te mostrará una URL, ábrela en tu navegador

4. Inicia sesión y concede los permisos

5. Copia el código de autorización que aparece

6. Pégalo en la terminal

7. ¡Listo! El script te dará el **REFRESH_TOKEN**

---

## 📝 PASO 5: Configurar Variables Finales

Añade a tu `.env`:
```env
GOOGLE_CLIENT_ID="tu_client_id"
GOOGLE_CLIENT_SECRET="tu_client_secret"
GOOGLE_OAUTH_REFRESH_TOKEN="tu_refresh_token"
GOOGLE_EMAIL="tu_email@gmail.com"
```

---

## 🔄 PASO 6: Reiniciar el Bot

```bash
# Detén el bot actual (Ctrl+C)
# Y reinícialo:
npm run dev
```

---

## ✅ VERIFICACIÓN

Para verificar que todo funciona, envía a AgenteDafo:
- "¿Tengo emails hoy?"
- "¿Qué eventos tengo esta semana?"

Si funciona correctamente, verás tus emails y eventos de Calendar.

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

**Error: "redirect_uri_mismatch"**
- Asegúrate de seleccionar "Desktop app" al crear las credenciales

**Error: "access_denied"**
- Verifica que hayas habilitado Gmail API y Calendar API

**Error: "invalid_client"**
- Verifica que el Client ID y Client Secret son correctos

**Error: "invalid_grant"**
- El refresh token ha expirado o es inválido. Ejecuta `npm run google-auth` nuevamente

---

## 🎯 LISTO

Una vez configurado, podrás usar comandos como:
- "Muéstrame los últimos 3 emails"
- "¿Tengo alguna reunión hoy?"
- "Busca reuniones con cliente X"
- "Crea una reunión mañana a las 15:00 con Juan"

¡AgenteDafo gestionará tu Google Workspace desde Telegram! 🎉
