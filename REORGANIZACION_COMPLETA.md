# ✅ REORGANIZACIÓN DE CÓDIGO COMPLETADA

## 📦 LO QUE SE HA CREADO

### 1. Sistema de Errores Centralizado (`src/shared/errors/`)

Todos los errores ahora heredan de `BaseError` con:
- **Códigos de error estandarizados** (E1xxx para auth, E2xxx para validación, etc.)
- **Niveles de severidad** (low, medium, high, critical)
- **Contexto adicional** para debugging
- **Info de retry** (`shouldRetry()`)

#### Uso:

```typescript
import { UnauthorizedError, ValidationError, RecordNotFoundError } from '@/shared/errors/index.js';

// Error de autenticación
throw new UnauthorizedError('No tienes permiso', { userId: '123' });

// Error de validación con detalles
throw new ValidationError('Datos inválidos', [
  { field: 'email', message: 'Email inválido' },
  { field: 'age', message: 'Debe ser mayor de 18' }
]);

// Error de registro no encontrado
throw new RecordNotFoundError('Usuario', 'user@example.com');

// Verificar si se puede reintentar
if (error.shouldRetry()) {
  // Reintentar operación
}
```

### 2. Constantes Compartidas (`src/shared/constants/`)

Mensajes y límites en un solo lugar:

```typescript
import { MESSAGES, LIMITS, ERROR_MESSAGES } from '@/shared/constants/index.js';

// Mensajes predefinidos
await ctx.reply(MESSAGES.WELCOME);

// Límites configurables
if (text.length > LIMITS.MAX_MESSAGE_LENGTH) {
  throw new ValidationError('Mensaje muy largo');
}

// Códigos de error
ctx.reply(ERROR_MESSAGES.UNAUTHORIZED);
```

### 3. Utilidades Compartidas (`src/shared/utils/`)

Funciones reutilizables:

```typescript
import {
  formatDate,          // Fechas
  truncate,            // Strings
  retry,               // Async con reintentos
  isValidEmail,        // Validación
  formatBytes,         // Formateo
  chunk,               // Arrays
} from '@/shared/utils/index.js';

// Formatear fecha
const dateStr = formatDate(new Date(), 'DD/MM/YYYY HH:mm');

// Reintentar operación
const result = await retry(
  () => fetch(url),
  { maxAttempts: 3, delayMs: 1000 }
);

// Validar email
if (!isValidEmail(email)) {
  throw new ValidationError('Email inválido');
}
```

### 4. Tipos Mejorados (`src/shared/types/`)

TypeScript estricto:

```typescript
import type {
  TelegramUser,
  TelegramMessage,
  AgentResponse,
  ConversationContext,
  PaginationOptions,
  SearchResult
} from '@/shared/types/index.js';

// Tipos específicos de Telegram
function handleUser(user: TelegramUser) {
  console.log(user.username, user.firstName);
}

// Tipos del agente
async function processAgent(
  message: string,
  context: ConversationContext
): Promise<AgentResponse> {
  // ...
}
```

### 5. Path Aliases en `tsconfig.json`

Imports más limpios:

```typescript
// ANTES (relativos largos):
import { Agent } from '../../../agent/index.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

// AHORA (con alias):
import { Agent } from '@/core/agent/index.js';
import { ValidationError } from '@/shared/errors/index.js';
```

---

## 📋 ESTRUCTURA FINAL CREADA

```
src/
├── shared/                          # ✅ NUEVO - Módulo compartido
│   ├── errors/                      # Sistema de errores
│   │   ├── BaseError.ts
│   │   ├── AuthenticationError.ts
│   │   ├── ValidationError.ts
│   │   ├── DatabaseError.ts
│   │   ├── IntegrationError.ts
│   │   ├── BusinessError.ts
│   │   └── index.ts
│   ├── constants/                   # Constantes
│   │   ├── errors.ts
│   │   ├── limits.ts
│   │   ├── messages.ts
│   │   └── index.ts
│   ├── utils/                       # Utilidades
│   │   ├── async.ts
│   │   ├── date.ts
│   │   ├── string.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   ├── types/                       # Tipos TypeScript
│   │   ├── common.ts
│   │   ├── telegram.ts
│   │   ├── agent.ts
│   │   ├── config.ts
│   │   └── index.ts
│   └── index.ts                     # Barrel file
│
├── core/                            # ✅ ESTRUCTURA CREADA (pendiente migrar)
├── domain/                          # ✅ ESTRUCTURA CREADA (pendiente migrar)
├── infrastructure/                  # ✅ ESTRUCTURA CREADA (pendiente migrar)
├── integrations/                    # ✅ ESTRUCTURA CREADA (pendiente migrar)
│
└── [módulos existentes...]         # Pendiente de reorganizar
```

---

## 🚀 CÓMO USAR LO NUEVO

### Ejemplo 1: Manejo de errores en el bot

```typescript
// src/bot/handlers/messageHandler.ts
import { UnauthorizedError, ValidationError } from '@/shared/errors/index.js';
import { LIMITS, MESSAGES } from '@/shared/constants/index.js';
import { truncate } from '@/shared/utils/index.js';

export async function handleMessage(ctx: Context) {
  try {
    const text = ctx.message?.text || '';

    // Validar longitud
    if (text.length > LIMITS.MAX_MESSAGE_LENGTH) {
      throw new ValidationError('message', 'Message too long', { length: text.length });
    }

    // Procesar mensaje...
    const response = await agent.run(text, history);

    // Truncar si es muy largo
    const truncatedResponse = truncate(response.content, 4000);
    await ctx.reply(truncatedResponse);

  } catch (error) {
    if (error instanceof UnauthorizedError) {
      await ctx.reply(MESSAGES.UNAUTHORIZED);
    } else if (error instanceof ValidationError) {
      await ctx.reply(error.details[0]?.message || MESSAGES.SOMETHING_WENT_WRONG);
    } else {
      await ctx.reply(MESSAGES.SOMETHING_WENT_WRONG);
    }
  }
}
```

### Ejemplo 2: Validación de datos

```typescript
import {
  isValidEmail,
  isValidPhone,
  isValidTelegramId,
  isAllowedFileType
} from '@/shared/utils/index.js';
import { ValidationError } from '@/shared/errors/index.js';

function validateUserInput(data: { email: string; phone: string }) {
  const errors: string[] = [];

  if (!isValidEmail(data.email)) {
    errors.push('Email inválido');
  }

  if (!isValidPhone(data.phone)) {
    errors.push('Teléfono inválido');
  }

  if (errors.length > 0) {
    throw new ValidationError('Datos de usuario inválidos', errors.map(e => ({
      field: 'unknown',
      message: e
    })));
  }
}
```

### Ejemplo 3: Reintentos automáticos

```typescript
import { retry, withTimeout } from '@/shared/utils/index.js';
import { LLMProviderError } from '@/shared/errors/index.js';

async function callLLMWithRetry(prompt: string) {
  return retry(
    () => withTimeout(
      llmProvider.complete(prompt),
      30000,
      new Error('LLM timeout')
    ),
    {
      maxAttempts: 3,
      delayMs: 1000,
      backoff: true,
      onRetry: (attempt, error) => {
        console.warn(`Reintentando LLM call (intentos ${attempt}/3)`, error.message);
      }
    }
  );
}
```

---

## ✅ SIGUIENTES PASOS

### Opción A: Migración Manual (Recomendado para empezar)

1. **Probar los nuevos módulos** sin migrar nada:
   ```typescript
   // En un archivo existente, prueba importar:
   import { ValidationError } from './shared/errors/index.js';
   import { formatDate } from './shared/utils/date.js';
   ```

2. **Migrar gradualmente** un módulo a la vez:
   - Empieza con un módulo pequeño (ej: `src/documents`)
   - Mueve los archivos a `src/domain/services/documents/`
   - Actualiza los imports
   - Verifica que compile: `npm run typecheck`

3. **Repetir** con otros módulos

### Opción B: Migración Automática

```bash
# 1. Crear carpetas
chmod +x scripts/restructure/create-folders.sh
./scripts/restructure/create-folders.sh

# 2. Mover archivos (con git mv para preservar historia)
chmod +x scripts/restructure/migrate.sh
./scripts/restructure/migrate.sh

# 3. Verificar cambios
git status

# 4. Commit si todo está bien
git add .
git commit -m "refactor: reorganize codebase into domain-driven structure"
```

---

## 🎯 BENEFICIOS INMEDIATOS

✅ **Errores consistentes** - Todos los errores tienen la misma estructura
✅ **Mensajes centralizados** - Cambia un mensaje, se actualiza en todas partes
✅ **Utilidades reutilizables** - No dupliques código
✅ **Type safety** - Mejor autocompletado y fewer bugs
✅ **Imports limpios** - `@/shared/...` en lugar de `../../shared/...`

---

## 📝 NOTAS IMPORTANTES

1. **El código existente NO se ha modificado**
   - Solo se han agregado nuevos módulos en `src/shared/`
   - Los módulos originales siguen funcionando
   - Puedes adoptar los nuevos módulos gradualmente

2. **Backward compatibility**
   - Los tipos originales en `src/types/index.ts` siguen disponibles
   - Los nuevos tipos extienden o son compatibles con los antiguos

3. **Tests**
   - Los nuevos módulos no tienen tests aún
   - Se recomienda agregar tests antes de usarlos en producción

---

## 🆘 AYUDA RÁPIDA

| Quiero... | Comando |
|-----------|---------|
| Ver errores disponibles | `import * from '@/shared/errors'` |
| Usar constantes | `import { MESSAGES, LIMITS } from '@/shared/constants'` |
| Formatear fecha | `import { formatDate } from '@/shared/utils'` |
| Validar input | `import { isValidEmail } from '@/shared/utils'` |
| Reintentar operación | `import { retry } from '@/shared/utils'` |

---

**¿Listo para el siguiente paso?** Dime si quieres:
1. Migrar los archivos existentes a la nueva estructura
2. Agregar más utilidades o módulos
3. Empezar a usar los nuevos módulos en código existente
4. Otra cosa
