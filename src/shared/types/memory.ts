/**
 * Tipos de Memoria Inteligente (Smart Memory)
 * Sistema de extracción, almacenamiento y recuperación de información clave
 */

/**
 * Tipos de hechos que pueden extraerse de las conversaciones
 */
export type FactType =
  | 'preference'      // Preferencias del usuario (gustos, intereses)
  | 'relationship'     // Relaciones con otras personas
  | 'goal'            // Metas y objetivos
  | 'event'           // Eventos pasados o futuros
  | 'fact'            // Hechos declarativos
  | 'routine'         // Rutinas y hábitos
  | 'task'            // Tareas pendientes o recurrentes
  | 'location'        // Ubicaciones importantes
  | 'contact'         // Información de contacto
  | 'project';        // Proyectos y trabajos

/**
 * Categorías para organizar hechos
 */
export type FactCategory =
  | 'personal'        // Información personal
  | 'work'           // Trabajo y profesión
  | 'family'         // Familia
  | 'health'         // Salud y bienestar
  | 'finance'        // Finanzas
  | 'education'      // Educación
  | 'hobbies'        // Pasatiempos
  | 'social'         // Vida social
  | 'travel'         // Viajes
  | 'other';         // Otros

/**
 * Un hecho extraído de una conversación
 */
export interface Fact {
  /** ID único del hecho */
  id?: string;
  /** ID del usuario al que pertenece el hecho */
  userId: string;
  /** Tipo de hecho */
  type: FactType;
  /** Categoría del hecho */
  category: FactCategory;
  /** Contenido del hecho */
  content: string;
  /** Clave principal para búsqueda rápida */
  key: string;
  /** Valor del hecho */
  value: string;
  /** Fuente del hecho (mensaje donde se extrajo) */
  sourceMessageId?: string;
  /** Confianza en la extracción (0-1) */
  confidence: number;
  /** Veces que se ha confirmado este hecho */
  confirmations: number;
  /** Fecha de extracción */
  extractedAt: Date;
  /** Última vez que se usó o actualizó */
  lastAccessedAt?: Date;
  /** Si el hecho es temporal (expira) */
  expiresAt?: Date;
  /** Etiquetas adicionales */
  tags?: string[];
  /** Prioridad del hecho (alta, media, baja) */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Resumen de una conversación
 */
export interface ConversationSummary {
  /** ID único del resumen */
  id?: string;
  /** ID del usuario */
  userId: string;
  /** Título del resumen */
  title: string;
  /** Resumen de la conversación */
  summary: string;
  /** Puntos clave de la conversación */
  keyPoints: string[];
  /** Hechos extraídos durante la conversación */
  factIds?: string[];
  /** Fecha de inicio de la conversación */
  startDate: Date;
  /** Fecha de fin de la conversación */
  endDate: Date;
  /** Cantidad de mensajes resumidos */
  messageCount: number;
  /** Cuando se creó el resumen */
  createdAt: Date;
  /** Temas principales */
  topics?: string[];
  /** Sentimiento general de la conversación */
  sentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * Resultado de búsqueda en memoria
 */
export interface MemorySearchResult {
  /** Tipo de resultado */
  type: 'fact' | 'summary' | 'message';
  /** Contenido relevante */
  content: string;
  /** Puntuación de relevancia (0-1) */
  score: number;
  /** Metadatos adicionales */
  metadata?: {
    factType?: FactType;
    category?: FactCategory;
    date?: Date;
    source?: string;
  };
}

/**
 * Resultado de extracción de hechos
 */
export interface FactExtractionResult {
  /** Hechos extraídos */
  facts: Fact[];
  /** Cantidad de hechos nuevos */
  newFacts: number;
  /** Cantidad de hechos actualizados */
  updatedFacts: number;
  /** Errores durante la extracción */
  errors: string[];
}

/**
 * Contexto enriquecido para el agente
 */
export interface EnhancedContext {
  /** Hechos conocidos del usuario */
  knownFacts: Fact[];
  /** Resúmenes de conversaciones previas */
  conversationSummaries: ConversationSummary[];
  /** Información contextual relevante */
  relevantInfo: MemorySearchResult[];
  /** Formato del contexto para el sistema */
  systemContext: string;
}

/**
 * Opciones para búsqueda de memoria
 */
export interface MemorySearchOptions {
  /** Tipos de hechos a buscar */
  factTypes?: FactType[];
  /** Categorías a filtrar */
  categories?: FactCategory[];
  /** Búsqueda por palabras clave */
  keywords?: string[];
  /** Búsqueda semántica (query en lenguaje natural) */
  semanticQuery?: string;
  /** Límite de resultados */
  limit?: number;
  /** Incluir solo hechos no expirados */
  activeOnly?: boolean;
}
