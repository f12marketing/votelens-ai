import { AnalyticsData, ChartConfig } from './analytics-retriever.service';
import { ParsedQuery } from './query-parser.service';

export interface ConversationalResponse {
  message: string;
  data: AnalyticsData;
  charts: ChartConfig[];
  followUpQuestions: string[];
  metadata: ResponseMetadata;
}

export interface ResponseMetadata {
  queryType: string;
  confidence: number;
  dataPoints: number;
  hasCharts: boolean;
  processingTime: number;
  relatedQueries: string[];
}

export class ConversationalResponseService {
  /**
   * Format analytics data into conversational response
   */
  formatResponse(
    parsedQuery: ParsedQuery,
    data: AnalyticsData,
    charts: ChartConfig[]
  ): ConversationalResponse {
    const message = this.generateMessage(parsedQuery, data);
    const followUpQuestions = this.generateFollowUpQuestions(parsedQuery, data);
    const metadata = this.generateMetadata(parsedQuery, data, charts);

    return {
      message,
      data,
      charts,
      followUpQuestions,
      metadata,
    };
  }

  /**
   * Generate conversational message from data
   */
  private generateMessage(parsedQuery: ParsedQuery, data: AnalyticsData): string {
    const parts: string[] = [];

    // Add opening based on intent
    switch (parsedQuery.intent) {
      case 'find_constituencies':
        parts.push(this.formatConstituencies(data.constituencies, parsedQuery));
        break;
      case 'find_candidates':
        parts.push(this.formatCandidates(data.candidates, parsedQuery));
        break;
      case 'compare_regions':
        parts.push(this.formatRegions(data.regions, parsedQuery));
        break;
      case 'find_closest_races':
        parts.push(this.formatClosestRaces(data.constituencies));
        break;
      case 'find_highest_turnout':
        parts.push(this.formatHighestTurnout(data.constituencies));
        break;
      case 'find_flipped_parties':
        parts.push(this.formatFlippedParties(data.constituencies));
        break;
      case 'analyze_momentum':
        parts.push(this.formatMomentum(data.candidates));
        break;
      case 'get_statistics':
        parts.push(this.formatStatistics(data.statistics));
        break;
      default:
        parts.push(this.formatGeneralResponse(data));
    }

    // Add context if available
    if (parsedQuery.entities.states && parsedQuery.entities.states.length > 0) {
      parts.push(`in ${parsedQuery.entities.states.join(', ')}`);
    }

    return parts.join(' ');
  }

  /**
   * Format constituencies response
   */
  private formatConstituencies(
    constituencies: any[] | undefined,
    _parsedQuery: ParsedQuery
  ): string {
    if (!constituencies || constituencies.length === 0) {
      return 'No constituencies found matching your criteria.';
    }

    const count = constituencies.length;
    const names = constituencies.slice(0, 3).map((c: any) => c.name).join(', ');
    const more = constituencies.length > 3 ? ` and ${constituencies.length - 3} more` : '';

    return `Found ${count} constituenc${count === 1 ? 'y' : 'ies'}: ${names}${more}.`;
  }

  /**
   * Format candidates response
   */
  private formatCandidates(candidates: any[] | undefined, _parsedQuery: ParsedQuery): string {
    if (!candidates || candidates.length === 0) {
      return 'No candidates found matching your criteria.';
    }

    const count = candidates.length;
    const names = candidates.slice(0, 3).map((c: any) => c.name).join(', ');
    const more = candidates.length > 3 ? ` and ${candidates.length - 3} more` : '';

    return `Found ${count} candidate${count === 1 ? '' : 's'}: ${names}${more}.`;
  }

  /**
   * Format regions response
   */
  private formatRegions(regions: any[] | undefined, _parsedQuery: ParsedQuery): string {
    if (!regions || regions.length === 0) {
      return 'No regions found matching your criteria.';
    }

    const count = regions.length;
    const names = regions.slice(0, 3).map((r: any) => r.name).join(', ');
    const more = regions.length > 3 ? ` and ${regions.length - 3} more` : '';

    return `Comparing ${count} region${count === 1 ? '' : 's'}: ${names}${more}.`;
  }

  /**
   * Format closest races response
   */
  private formatClosestRaces(constituencies: any[] | undefined): string {
    if (!constituencies || constituencies.length === 0) {
      return 'No close races found.';
    }

    const top3 = constituencies.slice(0, 3);
    const details = top3.map((c: any) => 
      `${c.name} (${c.margin}% margin, ${c.winner} won)`
    ).join('; ');

    return `The closest race${top3.length > 1 ? 's are' : ' is'}: ${details}.`;
  }

  /**
   * Format highest turnout response
   */
  private formatHighestTurnout(constituencies: any[] | undefined): string {
    if (!constituencies || constituencies.length === 0) {
      return 'No turnout data available.';
    }

    const top = constituencies[0];
    const details = constituencies.slice(0, 3).map((c: any) => 
      `${c.name} (${c.turnout}%)`
    ).join(', ');

    return `The highest turnout is in ${top.name} at ${top.turnout}%. Other top areas: ${details}.`;
  }

  /**
   * Format flipped parties response
   */
  private formatFlippedParties(constituencies: any[] | undefined): string {
    if (!constituencies || constituencies.length === 0) {
      return 'No flipped constituencies found.';
    }

    const count = constituencies.length;
    const details = constituencies.slice(0, 3).map((c: any) => 
      `${c.name} (flipped from ${c.previousWinner} to ${c.winner})`
    ).join('; ');

    return `Found ${count} flipped constituenc${count === 1 ? 'y' : 'ies'}: ${details}.`;
  }

  /**
   * Format momentum response
   */
  private formatMomentum(candidates: any[] | undefined): string {
    if (!candidates || candidates.length === 0) {
      return 'No momentum data available.';
    }

    const gaining = candidates.filter((c: any) => c.momentum > 0);
    const losing = candidates.filter((c: any) => c.momentum < 0);

    const parts: string[] = [];

    if (gaining.length > 0) {
      const topGainer = gaining[0];
      parts.push(`${topGainer.name} (${topGainer.party}) has the highest momentum at ${topGainer.momentum.toFixed(1)}`);
    }

    if (losing.length > 0) {
      const topLoser = losing[0];
      parts.push(`${topLoser.name} (${topLoser.party}) is losing momentum at ${Math.abs(topLoser.momentum).toFixed(1)}`);
    }

    return parts.join('. ');
  }

  /**
   * Format statistics response
   */
  private formatStatistics(stats: any): string {
    if (!stats) {
      return 'No statistics available.';
    }

    const parts: string[] = [
      `Overall turnout: ${stats.overallTurnout?.toFixed(1)}%`,
      `Total votes: ${stats.totalVotes?.toLocaleString()}`,
      `Average margin: ${stats.averageMargin?.toFixed(1)}%`,
    ];

    if (stats.closeRaces !== undefined) {
      parts.push(`Close races: ${stats.closeRaces}`);
    }

    if (stats.flippedConstituencies !== undefined) {
      parts.push(`Flipped constituencies: ${stats.flippedConstituencies}`);
    }

    return parts.join(', ');
  }

  /**
   * Format general response
   */
  private formatGeneralResponse(data: AnalyticsData): string {
    const parts: string[] = [];

    if (data.constituencies && data.constituencies.length > 0) {
      parts.push(`${data.constituencies.length} constituencies found`);
    }

    if (data.candidates && data.candidates.length > 0) {
      parts.push(`${data.candidates.length} candidates found`);
    }

    if (data.regions && data.regions.length > 0) {
      parts.push(`${data.regions.length} regions found`);
    }

    if (data.statistics) {
      parts.push(`Statistics available`);
    }

    return parts.length > 0 ? parts.join(', ') + '.' : 'No data available.';
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(parsedQuery: ParsedQuery, _data: AnalyticsData): string[] {
    const questions: string[] = [];

    // Based on intent
    switch (parsedQuery.intent) {
      case 'find_constituencies':
        questions.push('Which of these had the highest turnout?');
        questions.push('Show me the closest races among these.');
        questions.push('Which parties won in these constituencies?');
        break;
      case 'find_closest_races':
        questions.push('Which candidates are leading these races?');
        questions.push('What was the turnout in these constituencies?');
        questions.push('Did any of these flip parties?');
        break;
      case 'find_highest_turnout':
        questions.push('Which party won these high-turnout areas?');
        questions.push('Compare with the lowest turnout areas.');
        questions.push('What was the average margin in these areas?');
        break;
      case 'find_flipped_parties':
        questions.push('What was the swing in these constituencies?');
        questions.push('Which party gained the most seats?');
        questions.push('Show me the overall party performance.');
        break;
      case 'analyze_momentum':
        questions.push('Which constituencies did these candidates win?');
        questions.push('Compare with the losing candidates.');
        questions.push('What is driving this momentum?');
        break;
      default:
        questions.push('Show me the closest races.');
        questions.push('Which constituencies had the highest turnout?');
        questions.push('Which parties flipped seats?');
    }

    // Based on entities
    if (parsedQuery.entities.states && parsedQuery.entities.states.length > 0) {
      questions.push('How does this compare to other states?');
    }

    if (parsedQuery.entities.parties && parsedQuery.entities.parties.length > 0) {
      questions.push('What are these parties doing in other regions?');
    }

    return questions.slice(0, 3); // Limit to 3 follow-up questions
  }

  /**
   * Generate response metadata
   */
  private generateMetadata(
    parsedQuery: ParsedQuery,
    data: AnalyticsData,
    charts: ChartConfig[]
  ): ResponseMetadata {
    const dataPoints = 
      (data.constituencies?.length || 0) +
      (data.candidates?.length || 0) +
      (data.regions?.length || 0);

    const relatedQueries = this.generateRelatedQueries(parsedQuery);

    return {
      queryType: parsedQuery.intent,
      confidence: parsedQuery.confidence,
      dataPoints,
      hasCharts: charts.length > 0,
      processingTime: 0, // Will be set by caller
      relatedQueries,
    };
  }

  /**
   * Generate related queries
   */
  private generateRelatedQueries(parsedQuery: ParsedQuery): string[] {
    const queries: string[] = [];

    switch (parsedQuery.intent) {
      case 'find_constituencies':
        queries.push('Which constituencies flipped parties?');
        queries.push('Where was turnout highest?');
        queries.push('Which races are closest?');
        break;
      case 'find_closest_races':
        queries.push('Which constituencies flipped parties?');
        queries.push('Which candidate gained momentum?');
        queries.push('Compare regions by turnout');
        break;
      case 'find_highest_turnout':
        queries.push('Which constituencies flipped parties?');
        queries.push('Which races are closest?');
        queries.push('Compare regions by turnout');
        break;
      case 'find_flipped_parties':
        queries.push('Which candidate gained momentum?');
        queries.push('Which races are closest?');
        queries.push('Where was turnout highest?');
        break;
      case 'analyze_momentum':
        queries.push('Which constituencies flipped parties?');
        queries.push('Which races are closest?');
        queries.push('Find candidates by party');
        break;
      default:
        queries.push('Which constituencies flipped parties?');
        queries.push('Where was turnout highest?');
        queries.push('Which races are closest?');
    }

    return queries.slice(0, 3);
  }

  /**
   * Format error response
   */
  formatErrorResponse(error: Error, parsedQuery: ParsedQuery): ConversationalResponse {
    return {
      message: `I couldn't process that query. ${error.message}. Try rephrasing your question or asking about constituencies, candidates, or regions.`,
      data: {},
      charts: [],
      followUpQuestions: [
        'Which constituencies flipped parties?',
        'Where was turnout highest?',
        'Which races are closest?',
      ],
      metadata: {
        queryType: parsedQuery.intent,
        confidence: 0,
        dataPoints: 0,
        hasCharts: false,
        processingTime: 0,
        relatedQueries: [],
      },
    };
  }

  /**
   * Format empty response
   */
  formatEmptyResponse(parsedQuery: ParsedQuery): ConversationalResponse {
    return {
      message: 'No data found matching your query. Try adjusting your criteria or ask about a different topic.',
      data: {},
      charts: [],
      followUpQuestions: [
        'Which constituencies flipped parties?',
        'Where was turnout highest?',
        'Which races are closest?',
      ],
      metadata: {
        queryType: parsedQuery.intent,
        confidence: parsedQuery.confidence,
        dataPoints: 0,
        hasCharts: false,
        processingTime: 0,
        relatedQueries: [],
      },
    };
  }
}

// Singleton instance
let conversationalResponseService: ConversationalResponseService | null = null;

export function getConversationalResponseService(): ConversationalResponseService {
  if (!conversationalResponseService) {
    conversationalResponseService = new ConversationalResponseService();
  }
  return conversationalResponseService;
}
