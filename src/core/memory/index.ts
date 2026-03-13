import initSqlJs, { Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Message, ConversationContext } from '../../shared/types/index.js';

export class Memory {
  private db: Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async initialize(): Promise<void> {
    // Asegurar que el directorio existe
    const dir = dirname(this.dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Cargar SQL.js
    const SQL = await initSqlJs();

    // Cargar base de datos existente o crear nueva
    if (existsSync(this.dbPath)) {
      const buffer = readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.initializeSchema();
    await this.save();
  }

  private initializeSchema(): void {
    if (!this.db) throw new Error('Database not initialized');

    // Tabla de conversaciones
    this.db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de mensajes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_calls TEXT,
        tool_call_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES conversations(user_id)
      )
    `);

    // Índices
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)
    `);
  }

  private async save(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const data = this.db.export();
    writeFileSync(this.dbPath, data);
  }

  getConversation(userId: number): ConversationContext | null {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(
      'SELECT user_id, username, started_at, last_activity FROM conversations WHERE user_id = :userId'
    );
    stmt.bind({ [':userId']: userId });

    const result = stmt.getAsObject() as {
      user_id: number;
      username: string | null;
      started_at: string;
      last_activity: string;
    } | undefined;

    stmt.free();

    if (!result) return null;

    const messages = this.getMessages(userId);

    return {
      userId: String(result.user_id),
      username: result.username || undefined,
      messages,
      startedAt: new Date(result.started_at),
      lastActivity: new Date(result.last_activity),
    };
  }

  createOrUpdateConversation(userId: number, username?: string): void {
    if (!this.db) throw new Error('Database not initialized');

    // Verificar si existe
    const checkStmt = this.db.prepare(
      'SELECT user_id FROM conversations WHERE user_id = :userId'
    );
    checkStmt.bind({ [':userId']: userId });
    const exists = checkStmt.step();
    checkStmt.free();

    if (exists) {
      const stmt = this.db.prepare(
        'UPDATE conversations SET last_activity = CURRENT_TIMESTAMP, username = :username WHERE user_id = :userId'
      );
      stmt.bind({
        [':username']: username || null,
        [':userId']: userId,
      });
      stmt.step();
      stmt.free();
    } else {
      const stmt = this.db.prepare(
        'INSERT INTO conversations (user_id, username) VALUES (:userId, :username)'
      );
      stmt.bind({
        [':userId']: userId,
        [':username']: username || null,
      });
      stmt.step();
      stmt.free();
    }

    this.save().catch(console.error);
  }

  addMessage(userId: number, message: Message): void {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(
      `INSERT INTO messages (user_id, role, content, tool_calls, tool_call_id)
       VALUES (:userId, :role, :content, :toolCalls, :toolCallId)`
    );
    stmt.bind({
      [':userId']: userId,
      [':role']: message.role,
      [':content']: message.content,
      [':toolCalls']: message.toolCalls ? JSON.stringify(message.toolCalls) : null,
      [':toolCallId']: message.toolCallId || null,
    });
    stmt.step();
    stmt.free();

    // Actualizar última actividad
    const updateStmt = this.db.prepare(
      'UPDATE conversations SET last_activity = CURRENT_TIMESTAMP WHERE user_id = :userId'
    );
    updateStmt.bind({ [':userId']: userId });
    updateStmt.step();
    updateStmt.free();

    this.save().catch(console.error);
  }

  getMessages(userId: number, limit: number = 100): Message[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(
      `SELECT role, content, tool_calls, tool_call_id
       FROM messages
       WHERE user_id = :userId
       ORDER BY created_at ASC
       LIMIT :limit`
    );
    stmt.bind({
      [':userId']: userId,
      [':limit']: limit,
    });

    const messages: Message[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as {
        role: string;
        content: string;
        tool_calls: string | null;
        tool_call_id: string | null;
      };
      messages.push({
        role: row.role as Message['role'],
        content: row.content,
        toolCalls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
        toolCallId: row.tool_call_id || undefined,
      });
    }
    stmt.free();

    return messages;
  }

  clearConversation(userId: number): void {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('DELETE FROM messages WHERE user_id = :userId');
    stmt.bind({ [':userId']: userId });
    stmt.step();
    stmt.free();

    const updateStmt = this.db.prepare(
      'UPDATE conversations SET last_activity = CURRENT_TIMESTAMP WHERE user_id = :userId'
    );
    updateStmt.bind({ [':userId']: userId });
    updateStmt.step();
    updateStmt.free();

    this.save().catch(console.error);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
