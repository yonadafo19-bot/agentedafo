import initSqlJs, { Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Message, ConversationContext } from '../../shared/types/index.js';
import type { Fact, ConversationSummary } from '../../shared/types/memory.js';
import type { SmartMemoryConfig } from '../../shared/types/config.js';
import { withFallback } from '../../integrations/llm/index.js';
import { firestoreQuery, firestoreSetDocument, firestoreGetDocument, isFirebaseAvailable } from '../../integrations/firebase/firebase-mcp.js';
import { SmartMemory } from './smart-memory.js';

export class Memory {
  private db: Database | null = null;
  private dbPath: string;
  private smartMemoryEnabled: boolean = false;
  private smartMemoryInstances: Map<string, SmartMemory> = new Map();
  private smartMemoryConfig?: SmartMemoryConfig;

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

  /**
   * Inicializar Smart Memory con configuración
   */
  initializeWithSmartMemory(config: SmartMemoryConfig): void {
    this.smartMemoryConfig = config;
    this.smartMemoryEnabled = config.enabled;
  }

  /**
   * Obtener instancia de Smart Memory para un usuario
   */
  getSmartMemory(userId: string): SmartMemory | null {
    if (!this.smartMemoryEnabled || !this.smartMemoryConfig) {
      return null;
    }

    if (!this.smartMemoryInstances.has(userId)) {
      this.smartMemoryInstances.set(userId, new SmartMemory(userId, this.smartMemoryConfig));
    }

    return this.smartMemoryInstances.get(userId)!;
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

    // Tabla de hechos (Smart Memory)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS smart_facts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0.5,
        confirmations INTEGER NOT NULL DEFAULT 0,
        extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed_at DATETIME,
        expires_at DATETIME,
        tags TEXT,
        priority TEXT DEFAULT 'medium',
        source_message_id TEXT
      )
    `);

    // Tabla de resúmenes de conversación
    this.db.run(`
      CREATE TABLE IF NOT EXISTS conversation_summaries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        key_points TEXT,
        fact_ids TEXT,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        message_count INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        topics TEXT,
        sentiment TEXT
      )
    `);

    // Índices
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_smart_facts_user_id ON smart_facts(user_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_smart_facts_type ON smart_facts(type)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_smart_facts_key ON smart_facts(key)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_conversation_summaries_user_id ON conversation_summaries(user_id)
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

  // ============================================================================
  // SMART MEMORY METHODS
  // ============================================================================

  /**
   * Habilitar Smart Memory
   */
  enableSmartMemory(enabled: boolean): void {
    this.smartMemoryEnabled = enabled;
  }

  /**
   * Guardar un hecho en la memoria
   */
  async saveFact(fact: Fact): Promise<void> {
    // Primero intentar guardar en Firebase
    if (isFirebaseAvailable()) {
      try {
        const factId = fact.id || `${fact.userId}_${fact.type}_${Date.now()}`;
        await firestoreSetDocument('SmartFacts', factId, {
          userId: fact.userId,
          type: fact.type,
          category: fact.category,
          content: fact.content,
          key: fact.key,
          value: fact.value,
          confidence: fact.confidence,
          confirmations: fact.confirmations,
          extractedAt: fact.extractedAt.toISOString(),
          lastAccessedAt: fact.lastAccessedAt?.toISOString(),
          expiresAt: fact.expiresAt?.toISOString(),
          tags: fact.tags || [],
          priority: fact.priority || 'medium',
          sourceMessageId: fact.sourceMessageId,
        });
        return;
      } catch (error) {
        console.error('Error saving fact to Firebase, falling back to SQLite:', error);
      }
    }

    // Fallback a SQLite
    if (!this.db) throw new Error('Database not initialized');

    const factId = fact.id || `${fact.userId}_${fact.type}_${Date.now()}`;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO smart_facts
      (id, user_id, type, category, content, key, value, confidence, confirmations,
       extracted_at, last_accessed_at, expires_at, tags, priority, source_message_id)
      VALUES (:id, :userId, :type, :category, :content, :key, :value, :confidence,
              :confirmations, :extractedAt, :lastAccessedAt, :expiresAt, :tags, :priority, :sourceMessageId)
    `);
    stmt.bind({
      [':id']: factId,
      [':userId']: fact.userId,
      [':type']: fact.type,
      [':category']: fact.category,
      [':content']: fact.content,
      [':key']: fact.key,
      [':value']: fact.value,
      [':confidence']: fact.confidence,
      [':confirmations']: fact.confirmations,
      [':extractedAt']: fact.extractedAt.toISOString(),
      [':lastAccessedAt']: fact.lastAccessedAt?.toISOString() || null,
      [':expiresAt']: fact.expiresAt?.toISOString() || null,
      [':tags']: fact.tags ? JSON.stringify(fact.tags) : null,
      [':priority']: fact.priority || 'medium',
      [':sourceMessageId']: fact.sourceMessageId || null,
    });
    stmt.step();
    stmt.free();

    await this.save();
  }

  /**
   * Obtener hechos de un usuario
   */
  async getFacts(userId: string, filters?: {
    type?: Fact['type'];
    category?: Fact['category'];
    limit?: number;
    activeOnly?: boolean;
  }): Promise<Fact[]> {
    const facts: Fact[] = [];

    // Primero intentar obtener de Firebase
    if (isFirebaseAvailable()) {
      try {
        let queryResults: any[] = [];

        if (filters?.type) {
          queryResults = await firestoreQuery('SmartFacts', 'userId', '==', userId, 100);
          queryResults = queryResults.filter((f: any) => f.type === filters.type);
        } else {
          queryResults = await firestoreQuery('SmartFacts', 'userId', '==', userId, filters?.limit || 50);
        }

        for (const doc of queryResults) {
          if (filters?.category && doc.category !== filters.category) continue;
          if (filters?.activeOnly && doc.expiresAt && new Date(doc.expiresAt) < new Date()) continue;

          facts.push({
            id: doc.id,
            userId: doc.userId,
            type: doc.type,
            category: doc.category,
            content: doc.content,
            key: doc.key,
            value: doc.value,
            confidence: doc.confidence,
            confirmations: doc.confirmations,
            extractedAt: new Date(doc.extractedAt),
            lastAccessedAt: doc.lastAccessedAt ? new Date(doc.lastAccessedAt) : undefined,
            expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : undefined,
            tags: doc.tags || [],
            priority: doc.priority,
            sourceMessageId: doc.sourceMessageId,
          });
        }
        return facts.slice(0, filters?.limit || 50);
      } catch (error) {
        console.error('Error fetching facts from Firebase, falling back to SQLite:', error);
      }
    }

    // Fallback a SQLite
    if (!this.db) return facts;

    let query = 'SELECT * FROM smart_facts WHERE user_id = :userId';
    const params: Record<string, any> = { [':userId']: userId };

    if (filters?.type) {
      query += ' AND type = :type';
      params[':type'] = filters.type;
    }

    if (filters?.category) {
      query += ' AND category = :category';
      params[':category'] = filters.category;
    }

    if (filters?.activeOnly) {
      query += ' AND (expires_at IS NULL OR expires_at > datetime("now"))';
    }

    query += ' ORDER BY extracted_at DESC';

    if (filters?.limit) {
      query += ' LIMIT :limit';
      params[':limit'] = filters.limit;
    }

    const stmt = this.db.prepare(query);
    Object.entries(params).forEach(([key, value]) => stmt.bind({ [key]: value }));

    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      facts.push({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        category: row.category,
        content: row.content,
        key: row.key,
        value: row.value,
        confidence: row.confidence,
        confirmations: row.confirmations,
        extractedAt: new Date(row.extracted_at),
        lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : undefined,
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        tags: row.tags ? JSON.parse(row.tags) : [],
        priority: row.priority,
        sourceMessageId: row.source_message_id,
      });
    }
    stmt.free();

    return facts;
  }

  /**
   * Guardar un resumen de conversación
   */
  async saveSummary(summary: ConversationSummary): Promise<void> {
    // Primero intentar guardar en Firebase
    if (isFirebaseAvailable()) {
      try {
        const summaryId = summary.id || `${summary.userId}_summary_${Date.now()}`;
        await firestoreSetDocument('ConversationSummaries', summaryId, {
          userId: summary.userId,
          title: summary.title,
          summary: summary.summary,
          keyPoints: summary.keyPoints,
          factIds: summary.factIds || [],
          startDate: summary.startDate.toISOString(),
          endDate: summary.endDate.toISOString(),
          messageCount: summary.messageCount,
          createdAt: summary.createdAt.toISOString(),
          topics: summary.topics || [],
          sentiment: summary.sentiment || 'neutral',
        });
        return;
      } catch (error) {
        console.error('Error saving summary to Firebase, falling back to SQLite:', error);
      }
    }

    // Fallback a SQLite
    if (!this.db) throw new Error('Database not initialized');

    const summaryId = summary.id || `${summary.userId}_summary_${Date.now()}`;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO conversation_summaries
      (id, user_id, title, summary, key_points, fact_ids, start_date, end_date,
       message_count, created_at, topics, sentiment)
      VALUES (:id, :userId, :title, :summary, :keyPoints, :factIds, :startDate,
              :endDate, :messageCount, :createdAt, :topics, :sentiment)
    `);
    stmt.bind({
      [':id']: summaryId,
      [':userId']: summary.userId,
      [':title']: summary.title,
      [':summary']: summary.summary,
      [':keyPoints']: JSON.stringify(summary.keyPoints),
      [':factIds']: summary.factIds ? JSON.stringify(summary.factIds) : null,
      [':startDate']: summary.startDate.toISOString(),
      [':endDate']: summary.endDate.toISOString(),
      [':messageCount']: summary.messageCount,
      [':createdAt']: summary.createdAt.toISOString(),
      [':topics']: summary.topics ? JSON.stringify(summary.topics) : null,
      [':sentiment']: summary.sentiment || 'neutral',
    });
    stmt.step();
    stmt.free();

    await this.save();
  }

  /**
   * Obtener resúmenes de conversación de un usuario
   */
  async getSummaries(userId: string, limit: number = 10): Promise<ConversationSummary[]> {
    const summaries: ConversationSummary[] = [];

    // Primero intentar obtener de Firebase
    if (isFirebaseAvailable()) {
      try {
        const results = await firestoreQuery('ConversationSummaries', 'userId', '==', userId, limit);

        for (const doc of results) {
          summaries.push({
            id: doc.id,
            userId: doc.userId,
            title: doc.title,
            summary: doc.summary,
            keyPoints: doc.keyPoints || [],
            factIds: doc.factIds || [],
            startDate: new Date(doc.startDate),
            endDate: new Date(doc.endDate),
            messageCount: doc.messageCount,
            createdAt: new Date(doc.createdAt),
            topics: doc.topics || [],
            sentiment: doc.sentiment || 'neutral',
          });
        }
        return summaries;
      } catch (error) {
        console.error('Error fetching summaries from Firebase, falling back to SQLite:', error);
      }
    }

    // Fallback a SQLite
    if (!this.db) return summaries;

    const stmt = this.db.prepare(`
      SELECT * FROM conversation_summaries
      WHERE user_id = :userId
      ORDER BY created_at DESC
      LIMIT :limit
    `);
    stmt.bind({
      [':userId']: userId,
      [':limit']: limit,
    });

    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      summaries.push({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        summary: row.summary,
        keyPoints: JSON.parse(row.key_points || '[]'),
        factIds: row.fact_ids ? JSON.parse(row.fact_ids) : [],
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        messageCount: row.message_count,
        createdAt: new Date(row.created_at),
        topics: row.topics ? JSON.parse(row.topics) : [],
        sentiment: row.sentiment || 'neutral',
      });
    }
    stmt.free();

    return summaries;
  }

  /**
   * Obtener contexto enriquecido para el agente
   */
  async getEnhancedContext(userId: string, userQuery?: string): Promise<string> {
    if (!this.smartMemoryEnabled) {
      return '';
    }

    const facts = await this.getFacts(userId, { activeOnly: true, limit: 20 });
    const summaries = await this.getSummaries(userId, 5);

    const contextParts: string[] = [];

    // Agregar hechos conocidos
    if (facts.length > 0) {
      contextParts.push('## 🧠 DATOS CONOCIDOS DEL USUARIO\n');
      const groupedFacts = this.groupFactsByType(facts);
      for (const [type, typeFacts] of Object.entries(groupedFacts)) {
        contextParts.push(`### ${this.formatFactType(type)}`);
        for (const fact of typeFacts.slice(0, 5)) {
          contextParts.push(`- **${fact.key}**: ${fact.value}`);
        }
        contextParts.push('');
      }
    }

    // Agregar resúmenes relevantes
    if (summaries.length > 0) {
      contextParts.push('## 📋 RESÚMENES DE CONVERSACIONES ANTERIORES\n');
      for (const summary of summaries.slice(0, 3)) {
        contextParts.push(`### ${summary.title}`);
        contextParts.push(summary.summary);
        if (summary.keyPoints.length > 0) {
          contextParts.push('**Puntos clave:**');
          for (const point of summary.keyPoints.slice(0, 3)) {
            contextParts.push(`- ${point}`);
          }
        }
        contextParts.push('');
      }
    }

    return contextParts.join('\n');
  }

  private groupFactsByType(facts: Fact[]): Record<string, Fact[]> {
    const grouped: Record<string, Fact[]> = {};
    for (const fact of facts) {
      if (!grouped[fact.type]) {
        grouped[fact.type] = [];
      }
      grouped[fact.type].push(fact);
    }
    return grouped;
  }

  private formatFactType(type: string): string {
    const typeLabels: Record<string, string> = {
      preference: '👤 Preferencias',
      relationship: '👥 Relaciones',
      goal: '🎯 Metas',
      event: '📅 Eventos',
      fact: '📝 Hechos',
      routine: '🔄 Rutinas',
      task: '✅ Tareas',
      location: '📍 Ubicaciones',
      contact: '📞 Contactos',
      project: '💼 Proyectos',
    };
    return typeLabels[type] || type;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
