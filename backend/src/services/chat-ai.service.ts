import { BaseService } from './base.service';
import { getQueryParserService, ParsedQuery } from './query-parser.service';
import { getAnalyticsRetrieverService, AnalyticsData, ChartConfig } from './analytics-retriever.service';
import { getConversationalResponseService, ConversationalResponse } from './conversational-response.service';
import { getGeminiService } from './gemini.service';

export interface ChatRequest {
  query: string;
  conversationId?: string;
  context?: ChatContext;
}

export interface ChatContext {
  electionId?: string;
  constituencyId?: string;
  state?: string;
  previousQueries?: string[];
}

export interface ChatResponse {
  response: ConversationalResponse;
  parsedQuery: ParsedQuery;
  conversationId: string;
  timestamp: Date;
}

export class ChatAIService extends BaseService {
  private queryParser = getQueryParserService();
  private analyticsRetriever = getAnalyticsRetrieverService();
  private responseFormatter = getConversationalResponseService();
  private geminiService = getGeminiService({
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  });

  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  /**
   * Process chat query
   */
  async processQuery(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // Parse the natural language query
      const parsedQuery = this.queryParser.parse(request.query);

      // Retrieve analytics data based on parsed query
      const data = await this.analyticsRetriever.retrieve(parsedQuery);

      // Generate chart configurations
      const charts = this.analyticsRetriever.getChartConfig(data, parsedQuery);

      // Format conversational response
      const response = this.responseFormatter.formatResponse(parsedQuery, data, charts);

      // Update response metadata with processing time
      response.metadata.processingTime = Date.now() - startTime;

      // Store in conversation history
      const conversationId = request.conversationId || this.generateConversationId();
      this.addToHistory(conversationId, {
        role: 'user',
        content: request.query,
        timestamp: new Date(),
      });
      this.addToHistory(conversationId, {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      });

      return {
        response,
        parsedQuery,
        conversationId,
        timestamp: new Date(),
      };
    } catch (error: any) {
      this.logError('Failed to process chat query', error);

      // Format error response
      const parsedQuery = this.queryParser.parse(request.query);
      const errorResponse = this.responseFormatter.formatErrorResponse(error, parsedQuery);

      return {
        response: errorResponse,
        parsedQuery,
        conversationId: request.conversationId || this.generateConversationId(),
        timestamp: new Date(),
      };
    }
  }

  /**
   * Process query with AI enhancement
   */
  async processQueryWithAI(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // Parse the natural language query
      const parsedQuery = this.queryParser.parse(request.query);

      // Retrieve analytics data
      const data = await this.analyticsRetriever.retrieve(parsedQuery);
      const charts = this.analyticsRetriever.getChartConfig(data, parsedQuery);

      // Get conversation context
      const context = this.getConversationContext(request.conversationId);

      // Build AI prompt
      const prompt = this.buildAIPrompt(request.query, parsedQuery, data, context);

      // Generate enhanced response with Gemini
      const aiResponse = await this.geminiService.generateText({
        prompt,
        temperature: 0.7,
      });

      // Format response
      const response = this.responseFormatter.formatResponse(parsedQuery, data, charts);

      // Replace message with AI-enhanced version
      response.message = aiResponse.text;

      // Update metadata
      response.metadata.processingTime = Date.now() - startTime;

      // Store in conversation history
      const conversationId = request.conversationId || this.generateConversationId();
      this.addToHistory(conversationId, {
        role: 'user',
        content: request.query,
        timestamp: new Date(),
      });
      this.addToHistory(conversationId, {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      });

      return {
        response,
        parsedQuery,
        conversationId,
        timestamp: new Date(),
      };
    } catch (error: any) {
      this.logError('Failed to process AI-enhanced query', error);

      // Fall back to regular processing
      return this.processQuery(request);
    }
  }

  /**
   * Build AI prompt with context
   */
  private buildAIPrompt(
    query: string,
    parsedQuery: ParsedQuery,
    data: AnalyticsData,
    context: ChatMessage[]
  ): string {
    let prompt = `You are an election analytics assistant. Answer the user's question in a helpful, neutral, and analytical tone.

User Query: ${query}

Parsed Intent: ${parsedQuery.intent}
Confidence: ${(parsedQuery.confidence * 100).toFixed(0)}%

`;

    // Add conversation context
    if (context && context.length > 0) {
      prompt += 'Recent conversation:\n';
      context.slice(-3).forEach(msg => {
        prompt += `${msg.role}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    // Add data context
    prompt += 'Available Data:\n';
    if (data.constituencies && data.constituencies.length > 0) {
      prompt += `- ${data.constituencies.length} constituencies\n`;
    }
    if (data.candidates && data.candidates.length > 0) {
      prompt += `- ${data.candidates.length} candidates\n`;
    }
    if (data.regions && data.regions.length > 0) {
      prompt += `- ${data.regions.length} regions\n`;
    }
    if (data.statistics) {
      prompt += `- Election statistics\n`;
    }

    prompt += `
Provide a concise, conversational response (under 150 words). Focus on the data and be specific. If data is insufficient, clearly state what additional information is needed.

Response format:
- Start with a direct answer
- Include specific numbers and percentages
- Mention key entities (constituencies, candidates, parties)
- End with a relevant follow-up question suggestion`;

    return prompt;
  }

  /**
   * Get conversation context
   */
  private getConversationContext(conversationId?: string): ChatMessage[] {
    if (!conversationId) return [];
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Add message to conversation history
   */
  private addToHistory(conversationId: string, message: ChatMessage): void {
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    this.conversationHistory.get(conversationId)!.push(message);

    // Keep only last 10 messages
    const history = this.conversationHistory.get(conversationId)!;
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): ChatMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Clear all conversations
   */
  clearAllConversations(): void {
    this.conversationHistory.clear();
  }

  /**
   * Get query suggestions based on context
   */
  getQuerySuggestions(conversationId?: string): string[] {
    const suggestions = [
      'Which constituencies flipped parties?',
      'Where was turnout highest?',
      'Which races are closest?',
      'Which candidate gained momentum?',
      'Compare regions by turnout',
      'Show me the party performance',
    ];

    // If there's conversation context, add related suggestions
    if (conversationId) {
      const history = this.getConversationHistory(conversationId);
      const lastQuery = history[history.length - 1];
      if (lastQuery && lastQuery.role === 'user') {
        const parsed = this.queryParser.parse(lastQuery.content);
        const related = parsed.originalQuery.toLowerCase();
        
        if (related.includes('constituency')) {
          suggestions.push('Which constituencies had the highest turnout?');
          suggestions.push('Show me the closest races');
        }
        if (related.includes('candidate')) {
          suggestions.push('Which candidate gained momentum?');
          suggestions.push('Compare candidates by party');
        }
        if (related.includes('turnout')) {
          suggestions.push('Which constituencies flipped parties?');
          suggestions.push('Compare regions by turnout');
        }
      }
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return this.geminiService.healthCheck();
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Singleton instance
let chatAIService: ChatAIService | null = null;

export function getChatAIService(): ChatAIService {
  if (!chatAIService) {
    chatAIService = new ChatAIService();
  }
  return chatAIService;
}
