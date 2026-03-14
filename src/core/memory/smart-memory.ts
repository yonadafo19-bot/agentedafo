/**
 * SmartMemory - Servicio de Memoria Inteligente
 * Sistema de extracción de hechos, búsqueda semántica y resumen de conversaciones
 */

import type { Message, Tool } from '../../shared/types/index.js';
import type {
  Fact,
  ConversationSummary,
  FactExtractionResult,
  MemorySearchResult,
  SmartMemoryConfig,
  EnhancedContext,
} from '../../shared/types/memory.js';
import { withFallback } from '../../integrations/llm/index.js';
import type { AgentResponse } from '../../types/index.js';

// Simple tools para el LLM de fact extraction
const factExtractionTools: Tool[] = [
  {
    name: 'save_extracted_facts',
    description: 'Guarda los hechos extraídos de la conversación',
    parameters: {
      type: 'object',
      properties: {
        facts: {
          type: 'array',
          description: 'Lista de hechos extraídos',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['preference', 'relationship', 'goal', 'event', 'fact', 'routine', 'task', 'location', 'contact', 'project'],
                description: 'Tipo del hecho'
              },
              category: {
                type: 'string',
                enum: ['personal', 'work', 'family', 'health', 'finance', 'education', 'hobbies', 'social', 'travel', 'other'],
                description: 'Categoría del hecho'
              },
              content: {
                type: 'string',
                description: 'Descripción completa del hecho'
              },
              key: {
                type: 'string',
                description: 'Palabra clave o nombre del hecho (ej: "nombre", "color preferido", "cumpleaños")'
              },
              value: {
                type: 'string',
                description: 'Valor del hecho (ej: "Juan", "azul", "15 de enero")'
              },
              confidence: {
                type: 'number',
                description: 'Nivel de confianza (0-1) en que este hecho es correcto'
              },
              priority: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'Prioridad o importancia del hecho'
              }
            },
            required: ['type', 'category', 'content', 'key', 'value', 'confidence']
          }
        }
      },
      required: ['facts']
    },
    execute: async () => 'Hechos recibidos'
  }
];

export class SmartMemory {
  private config: SmartMemoryConfig;
  private userId: string;

  constructor(userId: string, config: SmartMemoryConfig) {
    this.userId = userId;
    this.config = config;
  }

  /**
   * Extraer hechos de una conversación usando el LLM
   */
  async extractFacts(messages: Message[]): Promise<FactExtractionResult> {
    if (!this.config.enableFactExtraction) {
      return { facts: [], newFacts: 0, updatedFacts: 0, errors: [] };
    }

    // Limitar a los últimos N mensajes para la extracción
    const recentMessages = messages.slice(-50);

    // Construir el prompt de extracción
    const extractionPrompt = this.buildExtractionPrompt(recentMessages);

    try {
      const response = await withFallback(async (provider) => {
        return provider.complete(
          [{ role: 'system', content: extractionPrompt }, { role: 'user', content: 'Extrae los hechos importantes de esta conversación.' }],
          factExtractionTools
        );
      });

      // Procesar la respuesta
      const facts: Fact[] = [];

      if (response.toolCalls && response.toolCalls.length > 0) {
        const saveFactsCall = response.toolCalls.find(tc => tc.name === 'save_extracted_facts');
        if (saveFactsCall) {
          const extractedFacts = saveFactsCall.arguments.facts as any[];
          for (const ef of extractedFacts) {
            if (ef.confidence >= this.config.minConfidenceThreshold) {
              facts.push({
                userId: this.userId,
                type: ef.type,
                category: ef.category,
                content: ef.content,
                key: ef.key.toLowerCase(),
                value: ef.value,
                confidence: ef.confidence,
                confirmations: 0,
                extractedAt: new Date(),
                priority: ef.priority || 'medium',
              });
            }
          }
        }
      } else if (response.content) {
        // Fallback: intentar parsear JSON de la respuesta de texto
        try {
          const jsonMatch = response.content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const extractedFacts = JSON.parse(jsonMatch[0]) as any[];
            for (const ef of extractedFacts) {
              if (ef.confidence >= this.config.minConfidenceThreshold) {
                facts.push({
                  userId: this.userId,
                  type: ef.type,
                  category: ef.category,
                  content: ef.content,
                  key: ef.key.toLowerCase(),
                  value: ef.value,
                  confidence: ef.confidence,
                  confirmations: 0,
                  extractedAt: new Date(),
                  priority: ef.priority || 'medium',
                });
              }
            }
          }
        } catch {
          // No se pudo parsear, retornar vacío
        }
      }

      return {
        facts,
        newFacts: facts.length,
        updatedFacts: 0,
        errors: [],
      };
    } catch (error) {
      return {
        facts: [],
        newFacts: 0,
        updatedFacts: 0,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      };
    }
  }

  /**
   * Resumir una conversación larga
   */
  async summarizeConversation(messages: Message[], title?: string): Promise<ConversationSummary | null> {
    if (!this.config.enableAutoSummarization) {
      return null;
    }

    if (messages.length < 10) {
      return null; // No resumir conversaciones muy cortas
    }

    const summarizationPrompt = this.buildSummarizationPrompt(messages);

    try {
      const response = await withFallback(async (provider) => {
        return provider.complete([{ role: 'user', content: summarizationPrompt }], []);
      });

      const summaryContent = response.content || '';

      // Extraer información estructurada del resumen
      const keyPoints = this.extractKeyPoints(summaryContent);
      const topics = this.extractTopics(summaryContent);
      const sentiment = this.detectSentiment(summaryContent);

      // Obtener fechas de la conversación
      const startDate = messages[0].timestamp || new Date();
      const endDate = messages[messages.length - 1].timestamp || new Date();

      return {
        userId: this.userId,
        title: title || this.generateTitle(messages, summaryContent),
        summary: summaryContent,
        keyPoints,
        startDate,
        endDate,
        messageCount: messages.length,
        createdAt: new Date(),
        topics,
        sentiment,
      };
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      return null;
    }
  }

  /**
   * Búsqueda semántica (simplificada - búsqueda por palabras clave)
   */
  async semanticSearch(query: string, facts: Fact[]): Promise<MemorySearchResult[]> {
    if (!query || facts.length === 0) {
      return [];
    }

    const results: MemorySearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    for (const fact of facts) {
      let score = 0;
      const factText = `${fact.key} ${fact.value} ${fact.content}`.toLowerCase();

      // Búsqueda exacta de la query
      if (factText.includes(queryLower)) {
        score += 1.0;
      }

      // Búsqueda de palabras individuales
      for (const word of queryWords) {
        if (fact.key.includes(word)) score += 0.5;
        if (fact.value.includes(word)) score += 0.3;
        if (fact.content.includes(word)) score += 0.2;
        if (fact.tags?.some(tag => tag.includes(word))) score += 0.3;
      }

      // Bonus por prioridad
      if (fact.priority === 'high') score *= 1.5;
      if (fact.priority === 'medium') score *= 1.2;

      // Bonus por confirmaciones previas
      score *= (1 + fact.confirmations * 0.1);

      if (score > 0.1) {
        results.push({
          type: 'fact',
          content: `${fact.key}: ${fact.value}`,
          score: Math.min(score, 1),
          metadata: {
            factType: fact.type,
            category: fact.category,
            date: fact.extractedAt,
          },
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxFactsReturned);
  }

  /**
   * Construir contexto enriquecido para el agente
   */
  async buildEnhancedContext(
    messages: Message[],
    facts: Fact[],
    summaries: ConversationSummary[],
    userQuery?: string
  ): Promise<EnhancedContext> {
    const relevantInfo: MemorySearchResult[] = [];

    // Si hay una query, buscar información relevante
    if (userQuery && this.config.enableSemanticSearch) {
      const searchResults = await this.semanticSearch(userQuery, facts);
      relevantInfo.push(...searchResults);
    }

    // Formatear el contexto para el sistema
    let systemContext = '';

    if (facts.length > 0) {
      systemContext += '\n## 🧠 DATOS CONOCIDOS DEL USUARIO\n\n';
      const groupedFacts = this.groupFactsByType(facts);
      for (const [type, typeFacts] of Object.entries(groupedFacts)) {
        systemContext += `### ${this.formatFactType(type)}\n`;
        for (const fact of typeFacts.slice(0, 5)) {
          systemContext += `- **${fact.key}**: ${fact.value}\n`;
        }
        systemContext += '\n';
      }
    }

    if (summaries.length > 0) {
      systemContext += '\n## 📋 CONVERSACIONES ANTERIORES RELEVANTES\n\n';
      for (const summary of summaries.slice(0, 2)) {
        systemContext += `### ${summary.title}\n`;
        systemContext += `${summary.summary}\n`;
        if (summary.keyPoints.length > 0) {
          systemContext += '**Puntos clave:**\n';
          for (const point of summary.keyPoints.slice(0, 3)) {
            systemContext += `- ${point}\n`;
          }
        }
        systemContext += '\n';
      }
    }

    return {
      knownFacts: facts,
      conversationSummaries: summaries,
      relevantInfo,
      systemContext,
    };
  }

  /**
   * Determinar si es momento de extraer hechos
   */
  shouldExtractFacts(messageCount: number): boolean {
    return messageCount % this.config.factExtractionInterval === 0;
  }

  /**
   * Determinar si es momento de resumir
   */
  shouldSummarize(messageCount: number): boolean {
    return messageCount >= this.config.summarizationThreshold;
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private buildExtractionPrompt(messages: Message[]): string {
    const conversationText = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    return `Eres un experto en extraer información importante de conversaciones.

Analiza la siguiente conversación y extrae TODOS los hechos importantes sobre el usuario.

CATEGORÍAS DE HECHOS A EXTRAER:
- **preference**: Gustos, preferencias, cosas que le gustan o disgustan
- **relationship**: Personas importantes (familia, amigos, colegas)
- **goal**: Metas, objetivos, cosas que quiere lograr
- **event**: Eventos importantes pasados o futuros
- **fact**: Hechos biográficos (edad, ciudad, profesión, etc.)
- **routine**: Rutinas, hábitos diarios
- **task**: Tareas pendientes o recurrentes
- **location**: Lugares importantes (casa, trabajo, gimnasio, etc.)
- **contact**: Información de contacto
- **project**: Proyectos en los que está trabajando

CONVERSACIÓN:
${conversationText}

IMPORTANTE:
1. Extrae SOLO información explícitamente mencionada
2. Asigna un nivel de confianza (0-1) basado en qué tan claro está el hecho
3. Prioriza hechos personales y únicos sobre información genérica
4. Usa "key" para identificar el tipo de información (ej: "nombre", "cumpleaños", "color favorito")
5. Usa "value" para el valor específico (ej: "María", "15 de enero", "azul")
6. La "category" ayuda a organizar: personal, work, family, health, finance, etc.

Responde usando la herramienta save_extracted_facts con TODOS los hechos encontrados.`;
  }

  private buildSummarizationPrompt(messages: Message[]): string {
    const conversationText = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    return `Eres un experto en resumir conversaciones.

Resume la siguiente conversación de forma clara y concisa.

CONVERSACIÓN:
${conversationText}

Tu resumen debe:
1. Capturar los temas principales discutidos
2. Identificar decisiones tomadas o acciones acordadas
3. Resaltar información importante sobre el usuario
4. Ser claro y estructurado

Formato de respuesta:
## Resumen
[Escribe aquí el resumen de la conversación]

## Puntos Clave
- [Punto 1]
- [Punto 2]
- [Punto 3]

## Temas
[Lista los temas principales: trabajo, salud, familia, etc.]`;
  }

  private extractKeyPoints(summary: string): string[] {
    const points: string[] = [];
    const lines = summary.split('\n');

    let inPointsSection = false;
    for (const line of lines) {
      if (line.includes('Puntos Clave') || line.includes('Puntos clave')) {
        inPointsSection = true;
        continue;
      }
      if (inPointsSection && line.trim().startsWith('-')) {
        points.push(line.replace(/^-\s*/, '').trim());
      } else if (inPointsSection && line.startsWith('##')) {
        break;
      }
    }

    return points.slice(0, 5);
  }

  private extractTopics(summary: string): string[] {
    const topics: string[] = [];

    const topicPatterns = [
      /temas?:\s*([^\n]+)/i,
      /topics?:\s*([^\n]+)/i,
    ];

    for (const pattern of topicPatterns) {
      const match = summary.match(pattern);
      if (match) {
        const topicList = match[1].split(/[,-]/).map(t => t.trim());
        topics.push(...topicList);
      }
    }

    return topics.slice(0, 5);
  }

  private detectSentiment(summary: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['feliz', 'contento', 'exitoso', 'logrado', 'bien', 'genial', 'excelente', 'gracias'];
    const negativeWords = ['triste', 'preocupado', 'problema', 'difícil', 'mal', 'error', 'falló', 'frustrado'];

    const summaryLower = summary.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (summaryLower.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
      if (summaryLower.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private generateTitle(messages: Message[], summary: string): string {
    // Obtener las primeras palabras del primer mensaje
    const firstMessage = messages.find(m => m.role === 'user')?.content || '';
    const words = firstMessage.split(/\s+/).slice(0, 6).join(' ');
    return words.length > 30 ? words.slice(0, 30) + '...' : words;
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
}
