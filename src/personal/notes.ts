/**
 * Personal Notes & Tasks Manager
 * Para gestionar información personal del usuario en Firestore
 */

import { getFirestore } from '../config/firebase.js';

const COLLECTION_NOTES = 'PersonalNotes';
const COLLECTION_TASKS = 'PersonalTasks';

/**
 * Guarda una nota personal en Firestore
 */
export async function saveNote(
  userId: string,
  title: string,
  content: string,
  category: string = 'general'
): Promise<string> {
  try {
    const db = getFirestore();
    const noteId = `${userId}_${Date.now()}`;

    await db.collection(COLLECTION_NOTES).doc(noteId).set({
      userId,
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return `✅ Nota guardada: **${title}** (${category})`;
  } catch (error) {
    throw new Error(`Error guardando nota: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Busca notas por categoría o texto
 */
export async function searchNotes(
  userId: string,
  category?: string,
  _searchQuery?: string
): Promise<string> {
  try {
    const db = getFirestore();
    let query: any = db.collection(COLLECTION_NOTES).where('userId', '==', userId);

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(20).get();

    if (snapshot.empty) {
      return category
        ? `📝 No tienes notas en la categoría **${category}**.`
        : '📝 No tienes notas guardadas.';
    }

    let output = `📝 **Tus Notas${category ? ` (${category})` : ''}**\n\n`;

    snapshot.forEach((doc: any) => {
      const note = doc.data();
      output += `**${note.title}**\n`;
      output += `${note.content}\n`;
      output += `📅 ${new Date(note.createdAt).toLocaleDateString('es-ES')}\n\n`;
    });

    return output;
  } catch (error) {
    throw new Error(`Error buscando notas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Crea una tarea personal
 */
export async function createTask(
  userId: string,
  title: string,
  description: string,
  dueDate?: string,
  category: string = 'general'
): Promise<string> {
  try {
    const db = getFirestore();
    const taskId = `${userId}_${Date.now()}`;

    await db.collection(COLLECTION_TASKS).doc(taskId).set({
      userId,
      title,
      description,
      dueDate,
      category,
      status: 'pending', // pending, completed
      createdAt: new Date().toISOString(),
      completedAt: null,
    });

    return `✅ Tarea creada: **${title}**`;
  } catch (error) {
    throw new Error(`Error creando tarea: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Lista tareas pendientes
 */
export async function listPendingTasks(userId: string, category?: string): Promise<string> {
  try {
    const db = getFirestore();
    let query: any = db.collection(COLLECTION_TASKS)
      .where('userId', '==', userId)
      .where('status', '==', 'pending');

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();

    if (snapshot.empty) {
      return category
        ? `✅ No tienes tareas pendientes en **${category}**.`
        : '✅ No tienes tareas pendientes.';
    }

    let output = `📋 **Tareas Pendientes${category ? ` (${category})` : ''}**\n\n`;

    // Agrupar por categoría si no se filtra por categoría
    const tasksByCategory: Record<string, any[]> = {};

    snapshot.forEach((doc: any) => {
      const task = doc.data();
      const cat = task.category || 'general';
      if (!tasksByCategory[cat]) tasksByCategory[cat] = [];
      tasksByCategory[cat].push({ id: doc.id, ...task });
    });

    if (category) {
      tasksByCategory[category]?.forEach((task, i) => {
        output += `${i + 1}. **${task.title}**\n`;
        if (task.description) output += `   ${task.description}\n`;
        if (task.dueDate) output += `   📅 Vence: ${new Date(task.dueDate).toLocaleDateString('es-ES')}\n`;
        output += `\n`;
      });
    } else {
      for (const [cat, tasks] of Object.entries(tasksByCategory)) {
        output += `🏷️ **${cat.toUpperCase()}**\n`;
        tasks.forEach((task, i) => {
          output += `${i + 1}. ${task.title}\n`;
        });
        output += '\n';
      }
    }

    return output;
  } catch (error) {
    throw new Error(`Error listando tareas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Marca una tarea como completada
 */
export async function completeTask(userId: string, taskTitle: string): Promise<string> {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION_TASKS)
      .where('userId', '==', userId)
      .where('title', '==', taskTitle)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return `❌ No encontré ninguna tarea pendiente con el título **${taskTitle}**.`;
    }

    const doc = snapshot.docs[0];
    await doc.ref.update({
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    return `✅ ¡Tarea completada!: **${taskTitle}** 🎉`;
  } catch (error) {
    throw new Error(`Error completando tarea: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Obtiene tareas completadas recientemente
 */
export async function getCompletedTasks(userId: string, days: number = 7): Promise<string> {
  try {
    const db = getFirestore();
    const date = new Date();
    date.setDate(date.getDate() - days);

    const snapshot = await db.collection(COLLECTION_TASKS)
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .where('completedAt', '>=', date.toISOString())
      .orderBy('completedAt', 'desc')
      .limit(20)
      .get();

    if (snapshot.empty) {
      return `📭 No has completado tareas en los últimos ${days} días.`;
    }

    let output = `✅ **Tareas Completadas (últimos ${days} días)**\n\n`;

    snapshot.forEach((doc: any) => {
      const task = doc.data();
      output += `**${task.title}**\n`;
      output += `✓ Completada: ${new Date(task.completedAt).toLocaleDateString('es-ES')}\n\n`;
    });

    return output;
  } catch (error) {
    throw new Error(`Error obteniendo tareas completadas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Crea una rutina de ejercicios
 */
export async function saveExerciseRoutine(
  userId: string,
  routineName: string,
  exercises: Array<{ name: string; sets?: number; reps?: number; duration?: string }>
): Promise<string> {
  try {
    const db = getFirestore();
    const routineId = `${userId}_${routineName}_${Date.now()}`;

    await db.collection(COLLECTION_NOTES).doc(routineId).set({
      userId,
      title: `Rutina: ${routineName}`,
      content: JSON.stringify(exercises),
      category: 'ejercicios',
      routineName,
      exercises,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let output = `✅ **Rutina de ejercicios guardada**: ${routineName}\n\n`;
    exercises.forEach((ex, i) => {
      output += `${i + 1}. ${ex.name}`;
      if (ex.sets) output += ` - ${ex.sets} series`;
      if (ex.reps) output += ` x ${ex.reps} reps`;
      if (ex.duration) output += ` - ${ex.duration}`;
      output += '\n';
    });

    return output;
  } catch (error) {
    throw new Error(`Error guardando rutina: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Obtiene la rutina de ejercicios
 */
export async function getExerciseRoutine(userId: string): Promise<string> {
  return searchNotes(userId, 'ejercicios');
}

/**
 * Registra una sesión de ejercicio completada
 */
export async function logExerciseSession(
  userId: string,
  routineName: string,
  exercisesCompleted: string[]
): Promise<string> {
  try {
    const db = getFirestore();
    const sessionId = `${userId}_session_${Date.now()}`;

    await db.collection(COLLECTION_TASKS).doc(sessionId).set({
      userId,
      title: `Sesión: ${routineName}`,
      description: `Ejercicios completados: ${exercisesCompleted.join(', ')}`,
      category: 'ejercicios_completados',
      status: 'completed',
      routineName,
      exercisesCompleted,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    return `✅ **Sesión registrada**: ${routineName}\n\nEjercicios completados:\n${exercisesCompleted.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
  } catch (error) {
    throw new Error(`Error registrando sesión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
