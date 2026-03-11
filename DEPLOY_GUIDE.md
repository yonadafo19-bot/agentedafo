# 🚀 Despliegue en la Nube - AgenteDafo Siempre Online

## 📋 Opciones de Hosting

Tu bot puede estar siempre online en la nube. Aquí están las mejores opciones:

### 1. **Railway** ⭐ RECOMENDADO
- ✅ Plan gratuito generoso
- ✅ Auto deploy desde GitHub
- ✅ Se mantiene siempre activo
- ✅ Fácil configuración
- 💰 $5/mes después del free tier

### 2. **Render**
- ✅ Buen plan gratuito
- ✅ Auto deploy
- ✅ Always active en plan gratuito
- 💰 $7/mes después del free tier

### 3. **Fly.io**
- ✅ Plan gratuito decente
- ✅ Always active
- ⚠️ Un poco más complejo

### 4. **VPS Barato** (DigitalOcean, Hetzner)
- ✅ Control total
- ✅ Muy barato ($4-6/mes)
- ⚠️ Requiere más configuración

---

## 🚀 GUÍA - Despliegue en Railway (Método Fácil)

### Paso 1: Preparar tu repositorio en GitHub

```bash
# En tu terminal local:
cd C:/Users/EQUIPO/Desktop/Antigravity/AgentePro
git init
git add .
git commit -m "Initial commit - AgenteDafo bot"
```

Luego ve a [GitHub.com](https://github.com) y:
1. Crea un nuevo repositorio (llámalo "agentedafo" o lo que quieras)
2. NO marques "Add README" (ya tenemos uno)
3. Sube tu código:

```bash
git remote add origin https://github.com/TU_USUARIO/agentedafo.git
git branch -M main
git push -u origin main
```

### Paso 2: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub (es más fácil)
3. Verifica tu email

### Paso 3: Crear nuevo proyecto en Railway

1. Clic en **"New Project"** → **"Deploy from GitHub repo"**
2. Selecciona tu repositorio "agentedafo"
3. Railway detectará automáticamente que es Node.js

### Paso 4: Configurar Variables de Entorno

En Railway, ve a la pestaña **"Variables"** y agrega TODAS estas variables desde tu archivo `.env`:

```
TELEGRAM_BOT_TOKEN=SUSTITUYE_POR_EL_TUYO
TELEGRAM_ALLOWED_USER_IDS=SUSTITUYE_POR_EL_TUYO
OPENAI_API_KEY=SUSTITUYE_POR_EL_TUYO
OPENAI_MODEL=gpt-4o-mini
BRAVE_API_KEY=SUSTITUYE_POR_EL_TUYO
GOOGLE_API_KEY=SUSTITUYE_POR_EL_TUYO
GOOGLE_SEARCH_ENGINE_ID=SUSTITUYE_POR_EL_TUYO
GROQ_API_KEY=SUSTITUYE_POR_EL_TUYO
GROQ_MODEL=llama-3.3-70b-versatile
OPENROUTER_API_KEY=SUSTITUYE_POR_EL_TUYO
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free
DB_PATH=./memory.db
GOOGLE_CLIENT_ID=SUSTITUYE_POR_EL_TUYO
GOOGLE_CLIENT_SECRET=SUSTITUYE_POR_EL_TUYO
GOOGLE_OAUTH_REFRESH_TOKEN=SUSTITUYE_POR_EL_TUYO
GOOGLE_EMAIL=tu_email@gmail.com
ELEVENLABS_API_KEY=SUSTITUYE_POR_EL_TUYO
ELEVENLABS_VOICE_ID=iP95p4xoKVk53GoZ742B
ELEVENLABS_MODEL=eleven_multilingual_v2
FIREBASE_DATABASE_URL=https://tu-proyecto.firebaseio.com
FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
```

### Paso 5: Subir archivos de configuración de Google

Necesitas subir `service-account.json`:

1. En Railway, ve a la pestaña **"Variables"**
2. En lugar de subir el archivo, conviértelo a una variable:

```bash
# En tu terminal local, convierte el service-account a una línea:
cat service-account.json | jq -c .
```

3. Crea una variable llamada `GOOGLE_SERVICE_ACCOUNT_JSON` con ese contenido

### Paso 6: Deploy

1. Railway hará deploy automáticamente
2. Ve a la pestaña **"Deployments"** para ver el progreso
3. Cuando esté verde, ¡tu bot está online!

### Paso 7: Verificar que funciona

1. En Telegram, manda un mensaje a tu bot
2. Debería responder aunque tu PC esté apagada
3. En Railway → "Metrics" puedes ver si está activo

---

## 🔧 Guía Alternativa - Render (Si Railway no funciona)

### Pasos para Render:

1. Ve a [render.com](https://render.com)
2. Regístrate con GitHub
3. Clic **"New +"** → **"Web Service"**
4. Conecta tu repositorio de GitHub
5. Configura:
   - **Name**: agentedafo
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

6. En **"Environment Variables"**, agrega las mismas variables que arriba

7. Clic **"Create Web Service"**

8. ¡Listo! Tu bot estará siempre online

---

## 📱 MONITOREO

### En Railway:
- **Metrics**: CPU, memoria, uso
- **Logs**: Ver si hay errores
- **Deployments**: Historial de despliegues

### En Render:
- **Metrics**: Uso de recursos
- **Logs**: Logs en tiempo real
- **Events**: Eventos del servicio

---

## ⚠️ IMPORTANTE - Limitaciones del Plan Gratuito

### Railway Free Tier:
- ~$5 de crédito al mes
- 512MB RAM
- 1 vCPU
- El servicio puede "dormirse" sin tráfico (se despierta rápido al recibir mensaje)

### Render Free Tier:
- 512MB RAM
- 512MB CPU credits
- El servicio duerme después de 15min sin actividad
- Se despierta en ~30 segundos cuando llega un mensaje

**Recomendación**: Si usas mucho el bot, considera el plan pagado ($5-7/mes)

---

## 🎯 COMANDOS ÚTILES

### Ver logs en Railway:
```bash
# En la terminal de Railway del proyecto
railway logs
```

### Ver logs en Render:
- Ve a tu servicio → "Logs"

### Redeploy manual:
- Railway: Clic en "Redeploy"
- Render: Clic en "Manual Deploy" → "Deploy latest commit"

---

## ✅ VERIFICACIÓN

Para verificar que tu bot está siempre online:

1. Apaga tu PC
2. Desde tu celular, manda un mensaje al bot en Telegram
3. Si responde, ¡funciona! 🎉

---

## 🆘 PROBLEMAS COMUNES

### "El bot no responde"
- Revisa los logs en Railway/Render
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que el build fue exitoso

### "Service sleeping" (Render)
- Es normal en el plan gratuito
- El primer mensaje puede tardar 30 segundos
- Los siguientes son instantáneos

### "Out of memory"
- El plan gratuito tiene 512MB RAM
- Si necesitas más, actualiza el plan

---

## 💡 MEJORAR RENDIMIENTO

Si quieres mejor rendimiento:

1. **Usa un plan pagado** ($5/mes)
   - Más RAM
   - Sin sleep
   - Más CPU

2. **Optimiza el código**
   - Reduce el tamaño del contexto
   - Usa modelos más pequeños (groq en lugar de openai)

3. **Cache de respuestas**
   - Guarda respuestas frecuentes en Redis
