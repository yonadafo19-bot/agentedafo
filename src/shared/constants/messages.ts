/**
 * Constantes de mensajes - Respuestas predefinidas
 */

export const MESSAGES = {
  // Bot
  WELCOME: '¡Hola! Soy AgenteDafo, tu asistente de IA personal. ¿En qué puedo ayudarte?',
  GOODBYE: '¡Hasta luego! Si necesitas algo más, estaré aquí.',
  THINKING: '🤔 Procesando...',

  // Errores usuario
  COMMAND_NOT_RECOGNIZED: '❌ No entiendo ese comando. Usa /help para ver los comandos disponibles.',
  SOMETHING_WENT_WRONG: '❌ Algo salió mal. Por favor, inténtalo de nuevo.',
  FEATURE_NOT_AVAILABLE: '⚠️ Esta función no está disponible actualmente.',

  // Tareas
  TASK_CREATED: '✅ Tarea creada exitosamente',
  TASK_COMPLETED: '✅ Tarea completada',
  TASK_NOT_FOUND: '❌ No encontré esa tarea',
  NO_PENDING_TASKS: '✅ No tienes tareas pendientes',

  // Notas
  NOTE_SAVED: '✅ Nota guardada',
  NOTE_NOT_FOUND: '❌ No encontré esa nota',
  NO_NOTES: '📝 No tienes notas guardadas',

  // Rutinas
  ROUTINE_SAVED: '✅ Rutina guardada',
  ROUTINE_NOT_FOUND: '❌ No encontré esa rutina',
  NO_ROUTINES: '🏋️ No tienes rutinas guardadas',

  // Audio
  TRANSCRIBING: '🎤 Transcribiendo audio...',
  TRANSCRIPTION_COMPLETE: '✅ Transcripción completa',
  TRANSCRIPTION_FAILED: '❌ No pude transcribir el audio',

  // Búsqueda
  SEARCHING: '🔍 Buscando...',
  NO_RESULTS: '❌ No encontré resultados',
  RESULTS_FOUND: (count: number) => `✅ Encontré ${count} resultados`,

  // Documentos
  DOC_CREATING: '📄 Creando documento...',
  DOC_CREATED: '✅ Documento creado',
  DOC_UPLOADING: '📤 Subiendo documento...',
  DOC_UPLOADED: '✅ Documento subido',

  // Sistema
  MAINTENANCE_MODE: '🔧 El sistema está en mantenimiento. Intenta más tarde.',
  RATE_LIMITED: '⏳ Has enviado demasiados mensajes. Espera un momento.',
} as const;

export const PROMPTS = {
  // Ayuda del sistema
  HELP_GENERAL: `📖 *Comandos disponibles*

*Información:*
/start - Iniciar el bot
/help - Mostrar esta ayuda
/info - Información del sistema

*Tareas:*
/tarea <texto> - Crear tarea rápida
/tareas - Ver tareas pendientes
/completar <tarea> - Marcar tarea como completa

*Notas:*
/nota <texto> - Guardar nota
/notas - Ver tus notas

*Rutinas:*
/rutina - Ver tu rutina de ejercicios

*Otros:*
/limpiar - Limpiar historial
/resumen - Resumen del día`,

  HELP_ADMIN: `🔧 *Comandos de administrador*

/stats - Estadísticas del sistema
/users - Gestión de usuarios
/logs - Ver logs recientes
/config - Configuración del sistema`,

  CONFIRMATION: (action: string) => `¿Estás seguro de ${action}? Responde "sí" para confirmar.`,
} as const;
