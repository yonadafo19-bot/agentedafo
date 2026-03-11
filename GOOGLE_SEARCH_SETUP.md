# Guía de Configuración de Google Search

Para habilitar la búsqueda web en AgenteDafo, necesitas configurar Google Custom Search API.

## Paso 1: Obtener una Google API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crea un nuevo proyecto o selecciona uno existente
3. Haz clic en **"Crear credenciales"** > **"API key"**
4. Copia la API key generada

## Paso 2: Crear un Custom Search Engine

1. Ve a [Google Custom Search](https://cse.google.com/cse/all)
2. Haz clic en **"Agregar"**
3. Configura tu motor de búsqueda:
   - **Nombre**: AgenteDafo (o el que prefieras)
   - **Sitios para buscar**: Elige una de las opciones:
     - `*.*/*` para buscar en toda la web (recomendado)
     - O sitios específicos si prefieres
4. Haz clic en **"Crear"**
5. En tu motor de búsqueda, ve a **"Configuración"** > **"Básico"**
6. Copia el **"ID del motor de búsqueda"** (algo como `012345678901234567890:abcdefg`)

## Paso 3: Habilitar la API

1. Ve a [Google Cloud Console > APIs y servicios](https://console.cloud.google.com/apis/library)
2. Busca **"Custom Search API"**
3. Haz clic en ella y luego en **"Habilitar"**

## Paso 4: Configurar en .env

Edita tu archivo `.env` y añade las credenciales:

```env
GOOGLE_API_KEY="TU_API_KEY_AQUI"
GOOGLE_SEARCH_ENGINE_ID="TU_SEARCH_ENGINE_ID_AQUI"
```

## Paso 5: Probar

Reinicia el bot y prueba con un mensaje como:

- "Busca información sobre TypeScript"
- "¿Qué es la IA?"
- "Busca noticias sobre tecnología"

## Límites de la API

Google Custom Search API tiene los siguientes límites:

| Plan | Búsquedas/día | Coste |
|------|---------------|-------|
| Gratis | 100 | $0 |
| Pagado | Hasta 10,000 | $5 por 1000 búsquedas adicionales |

Para uso personal, el plan gratuito suele ser suficiente.

## Solución de problemas

### Error: "GOOGLE_API_KEY no está configurada"
- Asegúrate de haber añadido la API key en el archivo `.env`

### Error: "GOOGLE_SEARCH_ENGINE_ID no está configurado"
- Asegúrate de haber añadido el Search Engine ID en el archivo `.env`

### Error: "API key not valid"
- Verifica que la API key es correcta
- Asegúrate de haber habilitado la Custom Search API

### Error: "Invalid Value"
- Verifica que el Search Engine ID es correcto
- Asegúrate de que el motor de búsqueda esté configurado para buscar en toda la web (`*.*/*`)

## Alternativa: Búsqueda en Wikipedia (Gratis y sin configuración)

Si prefieres no configurar Google Search, también puedes usar la búsqueda en Wikipedia que no requiere API key.
