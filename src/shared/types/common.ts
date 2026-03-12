/**
 * Tipos comunes usados en toda la aplicación
 */

/**
 * Paginación
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Resultados de una operación
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Entidad base con timestamps
 */
export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad base con ID
 */
export interface Entity {
  id: string;
}

/**
 * Entidad completa
 */
export interface BaseEntity extends Entity, Timestamped {}

/**
 * Opciones de búsqueda genéricas
 */
export interface SearchOptions {
  query?: string;
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: PaginationOptions;
}

/**
 * Resultados de búsqueda
 */
export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Estado de una tarea/job
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Prioridad de una tarea/job
 */
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Metadata de un job
 */
export interface JobMetadata {
  id: string;
  status: JobStatus;
  priority: JobPriority;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  progress?: number;
}
