/**
 * Memory Registry - Singleton para acceder a la instancia de Memory
 * Permite que las tools accedan a Memory sin inyección de dependencias directa
 */

import type { Memory } from './index.js';

let memoryInstance: Memory | null = null;

/**
 * Establece la instancia global de Memory
 */
export function setMemoryInstance(memory: Memory): void {
  memoryInstance = memory;
}

/**
 * Obtiene la instancia global de Memory
 */
export function getMemoryInstance(): Memory | null {
  return memoryInstance;
}

/**
 * Verifica si hay una instancia de Memory registrada
 */
export function hasMemoryInstance(): boolean {
  return memoryInstance !== null;
}
