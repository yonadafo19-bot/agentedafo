# 🎯 Plan de Reorganización de Código - AgenteDafo

## ✅ COMPLETADO - PASOS 1-5

Se ha creado la base para la nueva estructura:

### 1. Sistema de Errores Centralizado (`src/shared/errors/`)
- ✅ `BaseError.ts` - Clase base con códigos de error, severidad, context
- ✅ `AuthenticationError.ts` - Errores de auth (Unauthorized, Forbidden, Token)
- ✅ `ValidationError.ts` - Errores de validación con detalles
- ✅ `DatabaseError.ts` - Errores de BD (RecordNotFound, Duplicate, Connection)
- ✅ `IntegrationError.ts` - Errores de servicios externos (LLM, Telegram, Google, Firebase)
- ✅ `BusinessError.ts` - Errores de reglas de negocio

### 2. Constantes Compartidas (`src/shared/constants/`)
- ✅ `errors.ts` - Mensajes de error consistentes
- ✅ `limits.ts` - Límites y cuotas (max sizes, rate limits, timeouts)
- ✅ `messages.ts` - Mensajes predefinidos para el bot
- ✅ `index.ts` - Exportaciones y constantes generales

### 3. Utilidades Compartidas (`src/shared/utils/`)
- ✅ `date.ts` - Formateo de fechas, zonas horarias
- ✅ `string.ts` - Manipulación de strings, slugify, escape markdown
- ✅ `async.ts` - Retry, batch, timeout, memoize
- ✅ `validation.ts` - Validación de emails, teléfonos, URLs
- ✅ `index.ts` - Utilidades adicionales (formatBytes, chunk, groupBy, etc.)

### 4. Tipos Compartidos (`src/shared/types/`)
- ✅ `common.ts` - Paginación, Result, Entity, SearchOptions
- ✅ `telegram.ts` - Tipos de Telegram (User, Chat, Message, Callback)
- ✅ `agent.ts` - Tipos del agente (Message, ToolCall, AgentResponse)
- ✅ `config.ts` - Tipos de configuración completa

### 5. Estructura de Carpetas
- ✅ Script `scripts/restructure/create-folders.sh` creado

---

## 📋 PRÓXIMOS PASOS (6-10)

### PASO 6: Mover módulos existentes a la nueva estructura

```bash
# Mover módulos a su nueva ubicación
git mv src/agent src/core/agent
git mv src/memory src/core/memory
git mv src/bot src/integrations/telegram
git mv src/config src/infrastructure/config
git mv src/types src/shared/types # Ya fusionado
```

### PASO 7: Actualizar imports en todos los archivos

```bash
# Buscar y reemplazar imports antigüos
# De: import { ... } from '../memory/index.js'
# A: import { ... } from '@/core/memory/index.js'
```

### PASO 8: Crear módulo de configuración mejorado

```typescript
// src/infrastructure/config/ConfigManager.ts
// - Carga de config desde archivos YAML
// - Validación con Zod
// - Config por ambientes (dev/staging/prod)
// - Secrets management
```

### PASO 9: Crear sistema de logging estructurado

```typescript
// src/infrastructure/monitoring/Logger.ts
// - Reemplazar console.log
// - Levels: trace, debug, info, warn, error, fatal
// - Contexto automático (userId, requestId)
// - Output a consola (dev) o archivo (prod)
```

### PASO 10: Crear handlers de error centralizados

```typescript
// src/shared/errors/ErrorHandler.ts
// - Manejo consistente de errores
// - Transformación de errores a respuestas de usuario
// - Logging automático de errores
// - Retry logic para errores recuperables
```

---

## 🚀 CÓMO CONTINUAR

### Opción A: Ejecutar los cambios automáticamente (recomendado)

```bash
# Crear carpetas
chmod +x scripts/restructure/create-folders.sh
./scripts/restructure/create-folders.sh

# Ejecutar migración (crear script)
npm run restructure:migrate
```

### Opción B: Hacer los cambios manualmente

1. **Mover archivos uno por uno**
2. **Actualizar imports**
3. **Probar que todo compile**: `npm run typecheck`
4. **Ejecutar tests**: `npm test`

---

## 📊 ESTADO ACTUAL DEL PROYECTO

```
agentedafo/
├── src/
│   ├── agent/              # ← MOVER A core/agent
│   ├── audio/              # ← MOVER A integrations/audio
│   ├── bot/                # ← MOVER A integrations/telegram
│   ├── config/             # ← MOVER A infrastructure/config
│   ├── documents/          # ← MOVER A domain/services/DocumentGenerator
│   ├── firebase/           # ← MOVER A integrations/firebase
│   ├── google/             # ← MOVER A integrations/google
│   ├── image/              # ← MOVER A integrations/image
│   ├── llm/                # ← MOVER A integrations/llm
│   ├── memory/             # ← MOVER A core/memory
│   ├── personal/           # ← MOVER A domain/services/PersonalNotes
│   ├── search/             # ← MOVER A domain/services/Search
│   ├── tools/              # ← MOVER A core/tools
│   ├── types/              # ✅ YA EN shared/types
│   ├── index.ts            # ← ACTUALIZAR
│   │
│   ├── core/               # ✅ ESTRUCTURA CREADA
│   │   ├── agent/
│   │   ├── memory/
│   │   ├── prompts/
│   │   └── reasoning/
│   │
│   ├── domain/             # ✅ ESTRUCTURA CREADA
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── value-objects/
│   │
│   ├── infrastructure/     # ✅ ESTRUCTURA CREADA
│   │   ├── database/
│   │   ├── cache/
│   │   ├── queue/
│   │   ├── config/
│   │   └── monitoring/
│   │
│   ├── integrations/       # ✅ ESTRUCTURA CREADA
│   │   └── telegram/
│   │
│   └── shared/             # ✅ COMPLETADO
│       ├── errors/         # ✅
│       ├── utils/          # ✅
│       ├── constants/      # ✅
│       └── types/          # ✅
```

---

## ⚠️ ANTES DE CONTINUAR

1. **Haz un commit** con los cambios actuales:
   ```bash
   git add .
   git commit -m "feat: add shared error system, constants, utils, and types"
   ```

2. **Verifica que el proyecto compila**:
   ```bash
   npm run typecheck
   ```

3. **Ejecuta los tests** (si existen):
   ```bash
   npm test
   ```

---

## 🎯 OBJETIVO FINAL

Al completar esta reorganización:

✅ **Código más mantenible** - Cada cosa en su lugar
✅ **Mejor testabilidad** - Módulos independientes
✅ **Errores consistentes** - Sistema centralizado
✅ **Utilidades reutilizables** - DRY principle
✅ **Tipos estrictos** - Type safety mejorada
✅ **Preparado para escalar** - Estructura enterprise

---

¿Quieres que ejecute el siguiente paso (mover los archivos y actualizar imports)?
