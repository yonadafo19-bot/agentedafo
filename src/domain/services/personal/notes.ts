/**
 * Personal Notes & Tasks Manager
 * Para gestionar información personal del usuario
 * Usa Firebase cuando está disponible, sino usa SQLite local
 */

import { getFirestore, isFirebaseAvailable } from '../../../integrations/firebase/firebase.js';
import initSqlJs, { Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const COLLECTION_NOTES = 'PersonalNotes';
const COLLECTION_TASKS = 'PersonalTasks';

// Base de datos local como fallback
let localDb: Database | null = null;
const localDbPath = './personal_data.db';

// Inicializar BD local si Firebase no está disponible
async function initLocalDb(): Promise<Database> {
  if (localDb) return localDb;

  const SQL = await initSqlJs();

  // Cargar o crear base de datos
  if (existsSync(localDbPath)) {
    const buffer = readFileSync(localDbPath);
    localDb = new SQL.Database(buffer);
  } else {
    localDb = new SQL.Database();
  }

  // Crear tablas
  localDb.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  localDb.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      category TEXT DEFAULT 'general',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    )
  `);

  // Índices
  localDb.run('CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)');
  localDb.run('CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category)');
  localDb.run('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)');
  localDb.run('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');

  saveLocalDb();
  return localDb;
}

function saveLocalDb(): void {
  if (localDb) {
    const dir = dirname(localDbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const data = localDb.export();
    writeFileSync(localDbPath, data);
  }
}

function useFirebase(): boolean {
  return isFirebaseAvailable();
}

/**
 * Guarda una nota personal
 */
export async function saveNote(
  userId: string,
  title: string,
  content: string,
  category: string = 'general'
): Promise<string> {
  if (useFirebase()) {
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
      console.warn('⚠️ Firebase error, usando local DB:', error);
      // Fallback a local
    }
  }

  // Usar BD local
  const db = await initLocalDb();
  db.run(
    `INSERT INTO notes (user_id, title, content, category) VALUES (?, ?, ?, ?)`,
    [userId, title, content, category]
  );
  saveLocalDb();
  return `✅ Nota guardada (local): **${title}** (${category})`;
}

/**
 * Busca notas por categoría
 */
export async function searchNotes(
  userId: string,
  category?: string,
  _searchQuery?: string
): Promise<string> {
  if (useFirebase()) {
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
      console.warn('⚠️ Firebase error, usando local DB:', error);
      // Fallback a local
    }
  }

  // Usar BD local
  const db = await initLocalDb();
  let stmt;
  if (category) {
    stmt = db.prepare(
      `SELECT title, content, created_at FROM notes WHERE user_id = ? AND category = ? ORDER BY created_at DESC LIMIT 20`
    );
    stmt.bind([userId, category]);
  } else {
    stmt = db.prepare(
      `SELECT title, content, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    );
    stmt.bind([userId]);
  }

  const notes: any[] = [];
  while (stmt.step()) {
    notes.push(stmt.getAsObject());
  }
  stmt.free();

  if (notes.length === 0) {
    return category
      ? `📝 No tienes notas en la categoría **${category}**.`
      : '📝 No tienes notas guardadas.';
  }

  let output = `📝 **Tus Notas${category ? ` (${category})` : ''}**\n\n`;
  notes.forEach((note) => {
    output += `**${note.title}**\n`;
    output += `${note.content}\n`;
    output += `📅 ${new Date(note.created_at).toLocaleDateString('es-ES')}\n\n`;
  });

  return output;
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
  if (useFirebase()) {
    try {
      const db = getFirestore();
      const taskId = `${userId}_${Date.now()}`;

      await db.collection(COLLECTION_TASKS).doc(taskId).set({
        userId,
        title,
        description,
        dueDate,
        category,
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null,
      });

      return `✅ Tarea creada: **${title}**`;
    } catch (error) {
      console.warn('⚠️ Firebase error, usando local DB:', error);
      // Fallback a local
    }
  }

  // Usar BD local
  const db = await initLocalDb();
  db.run(
    `INSERT INTO tasks (user_id, title, description, due_date, category) VALUES (?, ?, ?, ?, ?)`,
    [userId, title, description, dueDate || null, category]
  );
  saveLocalDb();
  return `✅ Tarea creada (local): **${title}**`;
}

/**
 * Lista tareas pendientes
 */
export async function listPendingTasks(userId: string, category?: string): Promise<string> {
  if (useFirebase()) {
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
      console.warn('⚠️ Firebase error, usando local DB:', error);
      // Fallback a local
    }
  }

  // Usar BD local
  const db = await initLocalDb();
  let stmt;
  if (category) {
    stmt = db.prepare(
      `SELECT id, title, description, due_date, category FROM tasks WHERE user_id = ? AND status = 'pending' AND category = ? ORDER BY created_at DESC LIMIT 50`
    );
    stmt.bind([userId, category]);
  } else {
    stmt = db.prepare(
      `SELECT id, title, description, due_date, category FROM tasks WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 50`
    );
    stmt.bind([userId]);
  }

  const tasks: any[] = [];
  while (stmt.step()) {
    tasks.push(stmt.getAsObject());
  }
  stmt.free();

  if (tasks.length === 0) {
    return category
      ? `✅ No tienes tareas pendientes en **${category}**.`
      : '✅ No tienes tareas pendientes.';
  }

  let output = `📋 **Tareas Pendientes${category ? ` (${category})` : ''}**\n\n`;

  if (category) {
    tasks.forEach((task, i) => {
      output += `${i + 1}. **${task.title}**\n`;
      if (task.description) output += `   ${task.description}\n`;
      if (task.due_date) output += `   📅 Vence: ${new Date(task.due_date).toLocaleDateString('es-ES')}\n`;
      output += `\n`;
    });
  } else {
    const tasksByCategory: Record<string, any[]> = {};
    tasks.forEach((task) => {
      const cat = task.category || 'general';
      if (!tasksByCategory[cat]) tasksByCategory[cat] = [];
      tasksByCategory[cat].push(task);
    });

    for (const [cat, catTasks] of Object.entries(tasksByCategory)) {
      output += `🏷️ **${cat.toUpperCase()}**\n`;
      catTasks.forEach((task, i) => {
        output += `${i + 1}. ${task.title}\n`;
      });
      output += '\n';
    }
  }

  return output;
}

/**
 * Marca una tarea como completada
 */
export async function completeTask(userId: string, taskTitle: string): Promise<string> {
  if (useFirebase()) {
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
      console.warn('⚠️ Firebase error, usando local DB:', error);
      // Fallback a local
    }
  }

  // Usar BD local
  const db = await initLocalDb();
  const stmt = db.prepare(
    `UPDATE tasks SET status = 'completed', completed_at = datetime('now') WHERE user_id = ? AND title = ? AND status = 'pending'`
  );
  stmt.bind([userId, taskTitle]);
  stmt.step();
  const changes = db.getRowsModified();
  stmt.free();
  saveLocalDb();

  if (changes === 0) {
    return `❌ No encontré ninguna tarea pendiente con el título **${taskTitle}**.`;
  }

  return `✅ ¡Tarea completada!: **${taskTitle}** 🎉`;
}

/**
 * Obtiene tareas completadas recientemente
 */
export async function getCompletedTasks(userId: string, days: number = 7): Promise<string> {
  if (useFirebase()) {
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
      console.warn('⚠️ Firebase error, usando local DB:', error);
      // Fallback a local
    }
  }

  // Usar BD local
  const db = await initLocalDb();
  const stmt = db.prepare(
    `SELECT title, completed_at FROM tasks WHERE user_id = ? AND status = 'completed' AND datetime(completed_at) >= datetime('now', '-' || ? || ' days') ORDER BY completed_at DESC LIMIT 20`
  );
  stmt.bind([userId, days.toString()]);

  const tasks: any[] = [];
  while (stmt.step()) {
    tasks.push(stmt.getAsObject());
  }
  stmt.free();

  if (tasks.length === 0) {
    return `📭 No has completado tareas en los últimos ${days} días.`;
  }

  let output = `✅ **Tareas Completadas (últimos ${days} días)**\n\n`;
  tasks.forEach((task) => {
    output += `**${task.title}**\n`;
    output += `✓ Completada: ${new Date(task.completed_at).toLocaleDateString('es-ES')}\n\n`;
  });

  return output;
}

/**
 * Crea una rutina de ejercicios
 */
export async function saveExerciseRoutine(
  userId: string,
  routineName: string,
  exercises: Array<{ name: string; sets?: number; reps?: number; duration?: string }>
): Promise<string> {
  const content = exercises.map(e => {
    let line = `- ${e.name}`;
    if (e.sets) line += ` (${e.sets} series`;
    if (e.reps) line += ` x ${e.reps} reps`;
    if (e.sets) line += ')';
    if (e.duration) line += ` - ${e.duration}`;
    return line;
  }).join('\n');

  if (useFirebase()) {
    try {
      const db = getFirestore();
      const routineId = `${userId}_${routineName}_${Date.now()}`;

      await db.collection(COLLECTION_NOTES).doc(routineId).set({
        userId,
        title: `Rutina: ${routineName}`,
        content,
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
      console.warn('⚠️ Firebase error, usando local DB:', error);
      // Fallback a local
    }
  }

  // Usar BD local
  const db = await initLocalDb();
  db.run(
    `INSERT INTO notes (user_id, title, content, category) VALUES (?, ?, ?, ?)`,
    [userId, `Rutina: ${routineName}`, content, 'ejercicios']
  );
  saveLocalDb();

  let output = `✅ **Rutina de ejercicios guardada (local)**: ${routineName}\n\n`;
  exercises.forEach((ex, i) => {
    output += `${i + 1}. ${ex.name}`;
    if (ex.sets) output += ` - ${ex.sets} series`;
    if (ex.reps) output += ` x ${ex.reps} reps`;
    if (ex.duration) output += ` - ${ex.duration}`;
    output += '\n';
  });

  return output;
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
  if (useFirebase()) {
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
      console.warn('⚠️ Firebase error, usando local DB:', error);
      // Fallback a local
    }
  }

  // Usar BD local
  const db = await initLocalDb();
  db.run(
    `INSERT INTO tasks (user_id, title, description, category, status, completed_at, created_at) VALUES (?, ?, ?, ?, 'completed', datetime('now'), datetime('now'))`,
    [userId, `Sesión: ${routineName}`, `Ejercicios completados: ${exercisesCompleted.join(', ')}`, 'ejercicios_completados']
  );
  saveLocalDb();

  return `✅ **Sesión registrada (local)**: ${routineName}\n\nEjercicios completados:\n${exercisesCompleted.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
}
