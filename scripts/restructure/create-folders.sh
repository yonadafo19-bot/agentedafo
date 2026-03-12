#!/bin/bash
# scripts/restructure/create-folders.sh
# Crea la nueva estructura de carpetas sin mover archivos aún

set -e

echo "📁 Creando nueva estructura de carpetas..."

# Core
mkdir -p src/core/agent
mkdir -p src/core/memory
mkdir -p src/core/prompts
mkdir -p src/core/reasoning

# Domain
mkdir -p src/domain/entities
mkdir -p src/domain/repositories
mkdir -p src/domain/services
mkdir -p src/domain/value-objects

# Infrastructure
mkdir -p src/infrastructure/database
mkdir -p src/infrastructure/database/migrations
mkdir -p src/infrastructure/database/seeds
mkdir -p src/infrastructure/cache
mkdir -p src/infrastructure/queue
mkdir -p src/infrastructure/monitoring
mkdir -p src/infrastructure/config

# Shared
mkdir -p src/shared/errors
mkdir -p src/shared/utils
mkdir -p src/shared/constants
mkdir -p src/shared/types

# Integrations (reorganizar)
mkdir -p src/integrations/telegram

echo "✅ Estructura de carpetas creada"
echo ""
echo "Nuevas carpetas creadas:"
tree src/ -L 3 -d
