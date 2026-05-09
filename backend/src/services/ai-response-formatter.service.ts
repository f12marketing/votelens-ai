/**
 * AI Response Formatter Service
 * Formats and structures AI responses for consistent output
 */

export interface FormattedResponse {
  type: 'summary' | 'insight' | 'analysis' | 'explanation' | 'recommendation' | 'error';
  title?: string;
  content: string;
  metadata?: {
    confidence?: number;
    sources?: string[];
    timestamp?: string;
    model?: string;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
  sections?: ResponseSection[];
  keyPoints?: string[];
  visualizations?: VisualizationSuggestion[];
}

export interface ResponseSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'data' | 'chart' | 'table';
}

export interface VisualizationSuggestion {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'map' | 'heatmap';
  title: string;
  data: any;
  config?: any;
}

export class AIResponseFormatter {
  /**
   * Format raw AI text response into structured format
   */
  formatResponse(
    rawResponse: string,
    responseType: FormattedResponse['type'],
    metadata?: Partial<FormattedResponse['metadata']>
  ): FormattedResponse {
    const sections = this.extractSections(rawResponse);
    const keyPoints = this.extractKeyPoints(rawResponse);

    return {
      type: responseType,
      title: this.generateTitle(rawResponse, responseType),
      content: this.cleanContent(rawResponse),
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
      sections,
      keyPoints,
    };
  }

  /**
   * Format JSON response from AI
   */
  formatJSONResponse<T>(jsonResponse: T, responseType: FormattedResponse['type']): FormattedResponse {
    const content = JSON.stringify(jsonResponse, null, 2);

    return {
      type: responseType,
      content,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Format error response
   */
  formatErrorResponse(error: Error, context?: string): FormattedResponse {
    return {
      type: 'error',
      title: 'Analysis Error',
      content: context 
        ? `${context}: ${error.message}`
        : error.message,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Extract sections from markdown-style response
   */
  private extractSections(text: string): ResponseSection[] {
    const sections: ResponseSection[] = [];
    const lines = text.split('\n');
    let currentSection: ResponseSection | null = null;
    let sectionOrder = 0;

    for (const line of lines) {
      // Check for heading (## or ###)
      const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);
      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection);
        }

        // Start new section
        const level = headingMatch[1].length;
        currentSection = {
          id: `section-${sectionOrder}`,
          title: headingMatch[2].trim(),
          content: '',
          order: sectionOrder++,
          type: 'text',
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    // Add last section
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Extract key points from response
   */
  private extractKeyPoints(text: string): string[] {
    const keyPoints: string[] = [];

    // Look for bullet points
    const bulletPatterns = [
      /^-\s+(.+)$/,
      /^\*\s+(.+)$/,
      /^\d+\.\s+(.+)$/,
    ];

    const lines = text.split('\n');
    for (const line of lines) {
      for (const pattern of bulletPatterns) {
        const match = line.match(pattern);
        if (match) {
          keyPoints.push(match[1].trim());
          break;
        }
      }
    }

    return keyPoints.slice(0, 5); // Limit to top 5 key points
  }

  /**
   * Generate title from content
   */
  private generateTitle(content: string, type: FormattedResponse['type']): string | undefined {
    const firstLine = content.split('\n')[0].trim();

    // If first line looks like a heading, use it
    if (firstLine.match(/^[A-Z][^.!?]*$/)) {
      return firstLine;
    }

    // Generate based on type
    const titles: Record<FormattedResponse['type'], string> = {
      summary: 'Election Summary',
      insight: 'Key Insight',
      analysis: 'Analysis Report',
      explanation: 'Explanation',
      recommendation: 'Recommendations',
      error: 'Error',
    };

    return titles[type];
  }

  /**
   * Clean content by removing markdown artifacts
   */
  private cleanContent(content: string): string {
    let cleaned = content;

    // Remove section headers if they're extracted separately
    cleaned = cleaned.replace(/^#{2,3}\s+.+$/gm, '');

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Trim
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Add visualization suggestions based on content
   */
  suggestVisualizations(content: string, data: any): VisualizationSuggestion[] {
    const suggestions: VisualizationSuggestion[] = [];
    const lowerContent = content.toLowerCase();

    // Check for trends over time
    if (lowerContent.includes('trend') || lowerContent.includes('over time') || lowerContent.includes('historical')) {
      suggestions.push({
        type: 'line',
        title: 'Trend Over Time',
        data: data,
      });
    }

    // Check for comparisons
    if (lowerContent.includes('compare') || lowerContent.includes('versus') || lowerContent.includes('vs')) {
      suggestions.push({
        type: 'bar',
        title: 'Comparison',
        data: data,
      });
    }

    // Check for distributions
    if (lowerContent.includes('distribution') || lowerContent.includes('percentage') || lowerContent.includes('share')) {
      suggestions.push({
        type: 'pie',
        title: 'Distribution',
        data: data,
      });
    }

    // Check for geographical data
    if (lowerContent.includes('region') || lowerContent.includes('state') || lowerContent.includes('constituency')) {
      suggestions.push({
        type: 'map',
        title: 'Geographical View',
        data: data,
      });
    }

    // Check for correlations
    if (lowerContent.includes('correlation') || lowerContent.includes('relationship')) {
      suggestions.push({
        type: 'scatter',
        title: 'Correlation Analysis',
        data: data,
      });
    }

    return suggestions;
  }

  /**
   * Format response for streaming
   */
  formatForStreaming(chunk: string, previousContent: string): string {
    return previousContent + chunk;
  }

  /**
   * Truncate response for preview
   */
  truncateForPreview(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }

    return content.substring(0, maxLength) + '...';
  }

  /**
   * Convert response to markdown
   */
  toMarkdown(response: FormattedResponse): string {
    let markdown = '';

    if (response.title) {
      markdown += `# ${response.title}\n\n`;
    }

    if (response.keyPoints && response.keyPoints.length > 0) {
      markdown += '## Key Points\n\n';
      response.keyPoints.forEach(point => {
        markdown += `- ${point}\n`;
      });
      markdown += '\n';
    }

    if (response.sections && response.sections.length > 0) {
      response.sections.forEach(section => {
        markdown += `## ${section.title}\n\n${section.content}\n\n`;
      });
    }

    markdown += response.content;

    return markdown;
  }

  /**
   * Validate response structure
   */
  validateResponse(response: FormattedResponse): boolean {
    return !!(
      response.type &&
      response.content &&
      response.content.length > 0
    );
  }

  /**
   * Merge multiple responses
   */
  mergeResponses(responses: FormattedResponse[]): FormattedResponse {
    if (responses.length === 0) {
      throw new Error('No responses to merge');
    }

    if (responses.length === 1) {
      return responses[0];
    }

    const mergedContent = responses.map(r => r.content).join('\n\n');
    const allKeyPoints = responses.flatMap(r => r.keyPoints || []);
    const allSections = responses.flatMap(r => r.sections || []);

    return {
      type: 'summary',
      title: 'Combined Analysis',
      content: mergedContent,
      metadata: {
        timestamp: new Date().toISOString(),
      },
      sections: allSections,
      keyPoints: allKeyPoints.slice(0, 10), // Limit to 10 key points
    };
  }

  /**
   * Add confidence score to response
   */
  addConfidence(response: FormattedResponse, confidence: number): FormattedResponse {
    return {
      ...response,
      metadata: {
        ...response.metadata,
        confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0 and 1
      },
    };
  }

  /**
   * Format response for different output formats
   */
  formatForOutput(response: FormattedResponse, format: 'json' | 'markdown' | 'text'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(response, null, 2);
      case 'markdown':
        return this.toMarkdown(response);
      case 'text':
        return response.content;
      default:
        return response.content;
    }
  }
}

// Singleton instance
let formatterService: AIResponseFormatter | null = null;

export function getAIResponseFormatter(): AIResponseFormatter {
  if (!formatterService) {
    formatterService = new AIResponseFormatter();
  }
  return formatterService;
}
