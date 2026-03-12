#!/bin/bash
# scripts/restructure/migrate.sh
# Script para migrar archivos a la nueva estructura

set -e

echo "🔄 Iniciando migración de archivos..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mover módulo
move_module() {
    local source=$1
    local target=$2

    if [ -d "$source" ]; then
        echo -e "${YELLOW}Moviendo${NC} $source → $target"
        mkdir -p "$target"

        # Copiar archivos (preservando git history con git mv)
        for file in "$source"/*; do
            if [ -f "$file" ]; then
                git mv "$file" "$target/"
            fi
        done

        # Mover subdirectorios recursivamente
        for dir in "$source"/*/; do
            if [ -d "$dir" ]; then
                local dirname=$(basename "$dir")
                move_module "$dir" "$target/$dirname"
            fi
        done

        # Eliminar directorio original si está vacío
        if [ -z "$(ls -A $source)" ]; then
            rmdir "$source"
        fi
    fi
}

# Ejecutar migración
echo "📁 Migrando módulos a nueva estructura..."
echo ""

# Mover módulos principales
move_module "src/agent" "src/core/agent"
move_module "src/memory" "src/core/memory"

move_module "src/bot" "src/integrations/telegram"
move_module "src/audio" "src/integrations/audio"
move_module "src/image" "src/integrations/image"

move_module "src/llm" "src/integrations/llm"
move_module "src/firebase" "src/integrations/firebase"
move_module "src/google" "src/integrations/google"

move_module "src/config" "src/infrastructure/config"

# Mover servicios de dominio
move_module "src/documents" "src/domain/services/documents"
move_module "src/personal" "src/domain/services/personal"
move_module "src/search" "src/domain/services/search"

# Mantener tools en core (conocimiento)
move_module "src/tools" "src/core/tools"

echo ""
echo -e "${GREEN}✅ Migración de archivos completada${NC}"
echo ""
echo "⚠️  IMPORTANTE: Los imports necesitan ser actualizados"
echo "   Ejecuta: npm run restructure:update-imports"
echo ""
