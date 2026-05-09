/**
 * Query Parser Service
 * Converts natural language queries to structured election analytics queries
 */

export interface ParsedQuery {
  intent: QueryIntent;
  entities: QueryEntities;
  filters: QueryFilters;
  aggregations: QueryAggregation[];
  sort?: QuerySort;
  limit?: number;
  originalQuery: string;
  confidence: number;
}

export type QueryIntent =
  | 'find_constituencies'
  | 'find_candidates'
  | 'compare_regions'
  | 'analyze_trends'
  | 'get_statistics'
  | 'find_closest_races'
  | 'find_highest_turnout'
  | 'find_flipped_parties'
  | 'analyze_momentum'
  | 'general_query';

export interface QueryEntities {
  constituencies?: string[];
  states?: string[];
  parties?: string[];
  candidates?: string[];
  metrics?: string[];
  timeRanges?: TimeRange[];
}

export interface TimeRange {
  start?: Date;
  end?: Date;
  relative?: 'current' | 'previous' | 'last_election' | 'last_5_years';
}

export interface QueryFilters {
  turnout?: { min?: number; max?: number };
  margin?: { min?: number; max?: number };
  voteShare?: { min?: number; max?: number };
  swing?: { min?: number; max?: number };
  party?: string[];
  outcome?: 'won' | 'lost' | 'contested';
  competitiveness?: 'close' | 'competitive' | 'safe';
}

export interface QueryAggregation {
  type: 'count' | 'sum' | 'average' | 'max' | 'min' | 'group_by';
  field: string;
  alias?: string;
}

export interface QuerySort {
  field: string;
  direction: 'asc' | 'desc';
}

export class QueryParserService {
  private intentPatterns: Map<QueryIntent, RegExp[]> = new Map();
  private entityPatterns: Map<string, RegExp> = new Map();
  private metricSynonyms: Map<string, string> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Intent patterns
    this.intentPatterns.set('find_constituencies', [
      /which constituenc(y|ies)/i,
      /show me constituenc(y|ies)/i,
      /list constituenc(y|ies)/i,
      /find constituenc(y|ies)/i,
    ]);

    this.intentPatterns.set('find_candidates', [
      /which candidate(s)?/i,
      /show me candidate(s)?/i,
      /list candidate(s)?/i,
      /find candidate(s)?/i,
    ]);

    this.intentPatterns.set('compare_regions', [
      /compare (states?|regions?)/i,
      /difference between/i,
      /vs (states?|regions?)/i,
    ]);

    this.intentPatterns.set('analyze_trends', [
      /trend/i,
      /over time/i,
      /historical/i,
      /changing/i,
    ]);

    this.intentPatterns.set('get_statistics', [
      /statistics/i,
      /stats/i,
      /average/i,
      /total/i,
    ]);

    this.intentPatterns.set('find_closest_races', [
      /closest race(s)?/i,
      /tightest race(s)?/i,
      /narrowest margin/i,
      /closest contest/i,
      /most competitive/i,
    ]);

    this.intentPatterns.set('find_highest_turnout', [
      /highest turnout/i,
      /most voters/i,
      /best turnout/i,
      /highest participation/i,
    ]);

    this.intentPatterns.set('find_flipped_parties', [
      /flipped/i,
      /changed hands/i,
      /switched parties/i,
      /party change/i,
    ]);

    this.intentPatterns.set('analyze_momentum', [
      /momentum/i,
      /gaining/i,
      /losing/i,
      /surge/i,
      /momentum shift/i,
    ]);

    // Entity patterns
    this.entityPatterns.set('state', /\b(?:in|from|of|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g);
    this.entityPatterns.set('party', /\b(?:party|candidate from)\s+([A-Z][A-Z]+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g);
    this.entityPatterns.set('constituency', /\b(?:constituency|seat|district)\s+(?:of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g);
    this.entityPatterns.set('candidate', /\bcandidate\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g);

    // Metric synonyms
    this.metricSynonyms.set('turnout', 'turnout');
    this.metricSynonyms.set('voter turnout', 'turnout');
    this.metricSynonyms.set('participation', 'turnout');
    this.metricSynonyms.set('margin', 'margin');
    this.metricSynonyms.set('victory margin', 'margin');
    this.metricSynonyms.set('vote share', 'voteShare');
    this.metricSynonyms.set('swing', 'swing');
    this.metricSynonyms.set('vote swing', 'swing');
    this.metricSynonyms.set('votes', 'votes');
    this.metricSynonyms.set('seats', 'seats');
  }

  /**
   * Parse natural language query
   */
  parse(query: string): ParsedQuery {
    const intent = this.detectIntent(query);
    const entities = this.extractEntities(query);
    const filters = this.extractFilters(query);
    const aggregations = this.extractAggregations(query, intent);
    const sort = this.extractSort(query, intent);
    const limit = this.extractLimit(query);
    const confidence = this.calculateConfidence(query, intent, entities);

    return {
      intent,
      entities,
      filters,
      aggregations,
      sort,
      limit,
      originalQuery: query,
      confidence,
    };
  }

  /**
   * Detect query intent
   */
  private detectIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();

    // Check each intent pattern
    for (const [intent, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          return intent;
        }
      }
    }

    return 'general_query';
  }

  /**
   * Extract entities from query
   */
  private extractEntities(query: string): QueryEntities {
    const entities: QueryEntities = {};

    // Extract states
    const stateMatches = query.matchAll(this.entityPatterns.get('state')!);
    entities.states = Array.from(stateMatches).map(m => m[1]);

    // Extract parties
    const partyMatches = query.matchAll(this.entityPatterns.get('party')!);
    entities.parties = Array.from(partyMatches).map(m => m[1]);

    // Extract constituencies
    const constituencyMatches = query.matchAll(this.entityPatterns.get('constituency')!);
    entities.constituencies = Array.from(constituencyMatches).map(m => m[1]);

    // Extract candidates
    const candidateMatches = query.matchAll(this.entityPatterns.get('candidate')!);
    entities.candidates = Array.from(candidateMatches).map(m => m[1]);

    // Extract metrics
    entities.metrics = this.extractMetrics(query);

    // Extract time ranges
    entities.timeRanges = this.extractTimeRanges(query);

    return entities;
  }

  /**
   * Extract metrics from query
   */
  private extractMetrics(query: string): string[] {
    const metrics: string[] = [];

    for (const [synonym, metric] of this.metricSynonyms) {
      if (query.toLowerCase().includes(synonym)) {
        metrics.push(metric);
      }
    }

    return metrics;
  }

  /**
   * Extract time ranges from query
   */
  private extractTimeRanges(query: string): TimeRange[] {
    const ranges: TimeRange[] = [];
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('current') || lowerQuery.includes('this election')) {
      ranges.push({ relative: 'current' });
    }
    if (lowerQuery.includes('previous') || lowerQuery.includes('last election')) {
      ranges.push({ relative: 'previous' });
    }
    if (lowerQuery.includes('last 5 years') || lowerQuery.includes('recent')) {
      ranges.push({ relative: 'last_5_years' });
    }

    return ranges;
  }

  /**
   * Extract filters from query
   */
  private extractFilters(query: string): QueryFilters {
    const filters: QueryFilters = {};
    const lowerQuery = query.toLowerCase();

    // Turnout filters
    if (lowerQuery.includes('turnout')) {
      const turnoutMatch = query.match(/turnout\s+(?:over|above|greater than)\s+(\d+)/i);
      if (turnoutMatch) {
        filters.turnout = { min: parseInt(turnoutMatch[1]) };
      }
      const turnoutMatch2 = query.match(/turnout\s+(?:under|below|less than)\s+(\d+)/i);
      if (turnoutMatch2) {
        filters.turnout = { max: parseInt(turnoutMatch2[1]) };
      }
    }

    // Margin filters
    if (lowerQuery.includes('close') || lowerQuery.includes('tight') || lowerQuery.includes('narrow')) {
      filters.margin = { max: 5 }; // Close races have margin under 5%
      filters.competitiveness = 'close';
    }

    // Party filters
    if (lowerQuery.includes('won')) {
      filters.outcome = 'won';
    }
    if (lowerQuery.includes('lost')) {
      filters.outcome = 'lost';
    }

    // Competitiveness filters
    if (lowerQuery.includes('competitive')) {
      filters.competitiveness = 'competitive';
    }
    if (lowerQuery.includes('safe')) {
      filters.competitiveness = 'safe';
    }

    return filters;
  }

  /**
   * Extract aggregations from query
   */
  private extractAggregations(query: string, intent: QueryIntent): QueryAggregation[] {
    const aggregations: QueryAggregation[] = [];
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('count') || lowerQuery.includes('how many')) {
      aggregations.push({ type: 'count', field: '*' });
    }
    if (lowerQuery.includes('average') || lowerQuery.includes('mean')) {
      aggregations.push({ type: 'average', field: 'turnout' });
    }
    if (lowerQuery.includes('total') || lowerQuery.includes('sum')) {
      aggregations.push({ type: 'sum', field: 'votes' });
    }
    if (lowerQuery.includes('highest') || lowerQuery.includes('maximum') || lowerQuery.includes('max')) {
      aggregations.push({ type: 'max', field: 'turnout' });
    }
    if (lowerQuery.includes('lowest') || lowerQuery.includes('minimum') || lowerQuery.includes('min')) {
      aggregations.push({ type: 'min', field: 'turnout' });
    }
    if (lowerQuery.includes('by state') || lowerQuery.includes('by region')) {
      aggregations.push({ type: 'group_by', field: 'state' });
    }
    if (lowerQuery.includes('by party')) {
      aggregations.push({ type: 'group_by', field: 'party' });
    }

    return aggregations;
  }

  /**
   * Extract sort order from query
   */
  private extractSort(query: string, intent: QueryIntent): QuerySort | undefined {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('highest') || lowerQuery.includes('top') || lowerQuery.includes('most')) {
      return { field: 'turnout', direction: 'desc' };
    }
    if (lowerQuery.includes('lowest') || lowerQuery.includes('bottom') || lowerQuery.includes('least')) {
      return { field: 'turnout', direction: 'asc' };
    }
    if (lowerQuery.includes('closest') || lowerQuery.includes('tightest')) {
      return { field: 'margin', direction: 'asc' };
    }

    return undefined;
  }

  /**
   * Extract limit from query
   */
  private extractLimit(query: string): number | undefined {
    const limitMatch = query.match(/(?:top|first|show)\s+(\d+)/i);
    if (limitMatch) {
      return parseInt(limitMatch[1]);
    }

    // Default limits based on intent
    if (query.toLowerCase().includes('top 10')) return 10;
    if (query.toLowerCase().includes('top 5')) return 5;
    if (query.toLowerCase().includes('top 3')) return 3;

    return undefined;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(query: string, intent: QueryIntent, entities: QueryEntities): number {
    let score = 0.5; // Base score

    // Intent detection confidence
    if (intent !== 'general_query') {
      score += 0.2;
    }

    // Entity extraction confidence
    const entityCount = Object.values(entities).filter(v => v && v.length > 0).length;
    score += Math.min(entityCount * 0.1, 0.3);

    // Query length confidence (longer queries are typically more specific)
    if (query.length > 20) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Convert parsed query to SQL-like structure
   */
  toSQL(parsedQuery: ParsedQuery): string {
    let sql = 'SELECT ';

    // Add aggregations or fields
    if (parsedQuery.aggregations.length > 0) {
      sql += parsedQuery.aggregations.map(a => {
        switch (a.type) {
          case 'count': return 'COUNT(*)';
          case 'sum': return `SUM(${a.field})`;
          case 'average': return `AVG(${a.field})`;
          case 'max': return `MAX(${a.field})`;
          case 'min': return `MIN(${a.field})`;
          case 'group_by': return a.field;
          default: return '*';
        }
      }).join(', ');
    } else {
      sql += '*';
    }

    sql += ' FROM election_data';

    // Add WHERE clause
    const conditions: string[] = [];

    if (parsedQuery.filters.turnout?.min !== undefined) {
      conditions.push(`turnout >= ${parsedQuery.filters.turnout.min}`);
    }
    if (parsedQuery.filters.turnout?.max !== undefined) {
      conditions.push(`turnout <= ${parsedQuery.filters.turnout.max}`);
    }
    if (parsedQuery.filters.margin?.max !== undefined) {
      conditions.push(`margin <= ${parsedQuery.filters.margin.max}`);
    }
    if (parsedQuery.entities.states && parsedQuery.entities.states.length > 0) {
      conditions.push(`state IN (${parsedQuery.entities.states.map(s => `'${s}'`).join(', ')})`);
    }
    if (parsedQuery.entities.parties && parsedQuery.entities.parties.length > 0) {
      conditions.push(`party IN (${parsedQuery.entities.parties.map(p => `'${p}'`).join(', ')})`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Add GROUP BY
    const groupByFields = parsedQuery.aggregations
      .filter(a => a.type === 'group_by')
      .map(a => a.field);

    if (groupByFields.length > 0) {
      sql += ' GROUP BY ' + groupByFields.join(', ');
    }

    // Add ORDER BY
    if (parsedQuery.sort) {
      sql += ` ORDER BY ${parsedQuery.sort.field} ${parsedQuery.sort.direction.toUpperCase()}`;
    }

    // Add LIMIT
    if (parsedQuery.limit) {
      sql += ` LIMIT ${parsedQuery.limit}`;
    }

    return sql;
  }

  /**
   * Get explanation of parsed query
   */
  explain(parsedQuery: ParsedQuery): string {
    const parts: string[] = [];

    parts.push(`Intent: ${parsedQuery.intent}`);
    parts.push(`Confidence: ${(parsedQuery.confidence * 100).toFixed(0)}%`);

    if (Object.keys(parsedQuery.entities).length > 0) {
      parts.push(`Entities: ${JSON.stringify(parsedQuery.entities, null, 2)}`);
    }

    if (Object.keys(parsedQuery.filters).length > 0) {
      parts.push(`Filters: ${JSON.stringify(parsedQuery.filters, null, 2)}`);
    }

    if (parsedQuery.aggregations.length > 0) {
      parts.push(`Aggregations: ${JSON.stringify(parsedQuery.aggregations, null, 2)}`);
    }

    if (parsedQuery.sort) {
      parts.push(`Sort: ${parsedQuery.sort.field} ${parsedQuery.sort.direction}`);
    }

    if (parsedQuery.limit) {
      parts.push(`Limit: ${parsedQuery.limit}`);
    }

    return parts.join('\n');
  }
}

// Singleton instance
let queryParserService: QueryParserService | null = null;

export function getQueryParserService(): QueryParserService {
  if (!queryParserService) {
    queryParserService = new QueryParserService();
  }
  return queryParserService;
}
