# Guía de Configuración de Firebase MCP

## Pasos para configurar Firebase en tu proyecto

### 1. Crear un proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Sigue los pasos para crear tu proyecto

### 2. Crear una cuenta de servicio

1. En Firebase Console, ve a **Configuración del proyecto** ⚙️
2. En la sección "Cuentas de servicio", haz clic en **Generar nueva clave privada**
3. Descarga el archivo JSON (guárdalo como `service-account.json` en la raíz del proyecto)
4. **IMPORTANTE**: Nunca compartas este archivo ni lo subas a GitHub

### 3. Configurar las bases de datos

#### Firestore
1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en **Crear base de datos**
3. Elige la ubicación más cercana a tus usuarios
4. Selecciona el modo (producción o prueba)

#### Realtime Database
1. En Firebase Console, ve a **Realtime Database**
2. Haz clic en **Crear base de datos**
3. Configura las reglas de seguridad según tus necesidades

#### Storage
1. En Firebase Console, ve a **Storage**
2. Haz clic en **Comenzar**
3. Configura las reglas de seguridad
4. Anota el nombre de tu bucket (usualmente `tu-proyecto.appspot.com`)

### 4. Configurar las variables de entorno

Edita tu archivo `.env` y añade las siguientes variables:

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT='' # Pegar aquí el JSON del service account O usar el archivo service-account.json
FIREBASE_DATABASE_URL="https://tu-proyecto-id.firebaseio.com"
FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
```

**Para obtener el Database URL:**
- Ve a Realtime Database en Firebase Console
- La URL está en la parte superior: `https://tu-proyecto-id.firebaseio.com`

**Para obtener el Storage Bucket:**
- Ve a Storage en Firebase Console
- El nombre del bucket está en la pestaña: `tu-proyecto.appspot.com`

### 5. (Opcional) Usar archivo service-account.json en lugar de variable

Si prefieres usar el archivo `service-account.json` en lugar de la variable de entorno:

1. Coloca el archivo `service-account.json` en la raíz del proyecto
2. Asegúrate de que esté en `.gitignore` para no subirlo a GitHub
3. La aplicación lo detectará automáticamente

### 6. Reglas de seguridad recomendadas

#### Firestore (modo desarrollo - NO usar en producción)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

#### Realtime Database (modo desarrollo - NO usar en producción)
```
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

#### Storage (modo desarrollo - NO usar en producción)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Herramientas MCP Disponibles

Tu agente ahora tiene acceso a las siguientes herramientas de Firebase:

### Firestore
- `firestore_get_document` - Lee un documento
- `firestore_set_document` - Crea o actualiza un documento
- `firestore_delete_document` - Elimina un documento
- `firestore_query` - Consulta con filtros
- `firestore_list_collection` - Lista todos los documentos de una colección

### Realtime Database
- `realtime_get_value` - Lee un valor
- `realtime_set_value` - Establece un valor
- `realtime_update_value` - Actualiza parcialmente
- `realtime_delete_value` - Elimina un valor
- `realtime_query` - Consulta con orden y límites

### Storage
- `storage_upload_file` - Sube un archivo (requiere base64)
- `storage_delete_file` - Elimina un archivo
- `storage_list_files` - Lista archivos
- `storage_get_signed_url` - Genera URL firmada

## Ejemplos de uso con el agente

### Guardar datos en Firestore
```
Tú: Guarda este dato en Firestore: { "nombre": "Juan", "edad": 30 }
Agente: Usaré la herramienta firestore_set_document...
```

### Consultar datos
```
Tú: ¿Qué usuarios hay en la colección "users"?
Agente: Usaré la herramienta firestore_list_collection...
```

### Subir un archivo
```
Tú: Sube este archivo a Storage
Agente: Usaré la herramienta storage_upload_file...
```

## Solución de problemas

### Error: "Could not determine the project ID"
- Asegúrate de que el archivo `service-account.json` es correcto
- Verifica que la variable `FIREBASE_SERVICE_ACCOUNT` tenga el JSON correcto

### Error: "Permission denied"
- Verifica las reglas de seguridad de Firebase
- Asegúrate de que tu cuenta de servicio tiene los permisos necesarios

### Error: "Bucket not found"
- Verifica que el nombre del bucket en `FIREBASE_STORAGE_BUCKET` es correcto
- Asegúrate de que Storage esté habilitado en tu proyecto

## Seguridad

⚠️ **IMPORTANTE**:
- Nunca subas `service-account.json` a GitHub
- Nunca compartas tus credenciales de Firebase
- Usa reglas de seguridad apropiadas en producción
- Considera usar restricciones de IP o autenticación adicional

## Recursos adicionales

- [Documentación de Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Documentación de Firestore](https://firebase.google.com/docs/firestore)
- [Documentación de Realtime Database](https://firebase.google.com/docs/database)
- [Documentación de Storage](https://firebase.google.com/docs/storage)
