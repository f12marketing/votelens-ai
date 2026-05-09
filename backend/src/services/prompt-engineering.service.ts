/**
 * Prompt Engineering Service for Election Analysis
 * Manages all AI prompts for various election analysis tasks
 */

export interface PromptTemplate {
  id: string;
  name: string;
  category: 'summary' | 'trend' | 'anomaly' | 'constituency' | 'explanation' | 'query';
  template: string;
  variables: string[];
  outputFormat: 'text' | 'json' | 'markdown';
  temperature?: number;
  maxTokens?: number;
}

export interface PromptContext {
  electionData?: any;
  constituencyData?: any;
  historicalData?: any;
  userQuery?: string;
  analysisType?: string;
}

export class PromptEngineeringService {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Election Summary Prompts
    this.addTemplate({
      id: 'election-overview',
      name: 'Election Overview Summary',
      category: 'summary',
      template: `Analyze the following election data and provide a comprehensive overview:

Election Details:
- Election Name: {{electionName}}
- Date: {{electionDate}}
- Total Constituencies: {{totalConstituencies}}
- Total Voters: {{totalVoters}}
- Overall Turnout: {{overallTurnout}}%

Party Performance:
{{partyPerformance}}

Key Statistics:
{{keyStatistics}}

Provide a concise summary (2-3 paragraphs) highlighting:
1. Overall election outcome
2. Key party performance
3. Notable voter turnout patterns
4. Any significant trends or surprises

Keep the analysis factual and data-driven. Avoid speculation.`,
      variables: ['electionName', 'electionDate', 'totalConstituencies', 'totalVoters', 'overallTurnout', 'partyPerformance', 'keyStatistics'],
      outputFormat: 'text',
      temperature: 0.7,
    });

    this.addTemplate({
      id: 'executive-summary',
      name: 'Executive Summary',
      category: 'summary',
      template: `Create an executive summary for the election results:

{{electionData}}

Format the summary as:
- **Overall Result**: One sentence summary
- **Key Winners**: Top 3 parties with seat counts
- **Turnout**: Overall and state-wise highlights
- **Major Shifts**: Significant changes from previous election
- **Regional Highlights**: Key regional outcomes
- **Recommendations**: 2-3 actionable insights for stakeholders

Keep it under 300 words. Use bullet points where appropriate.`,
      variables: ['electionData'],
      outputFormat: 'markdown',
      temperature: 0.6,
    });

    // Trend Explanation Prompts
    this.addTemplate({
      id: 'turnout-trend-analysis',
      name: 'Turnout Trend Analysis',
      category: 'trend',
      template: `Analyze voter turnout trends based on the following data:

Historical Turnout Data:
{{historicalData}}

Current Election Turnout:
{{currentData}}

Regional Breakdown:
{{regionalData}}

Explain:
1. Overall turnout trend (increasing/decreasing/stable)
2. Factors that might explain the trend
3. Regional variations and their causes
4. Comparison with national averages
5. Implications for future elections

Provide data-driven insights with specific percentages where relevant.`,
      variables: ['historicalData', 'currentData', 'regionalData'],
      outputFormat: 'text',
      temperature: 0.7,
    });

    this.addTemplate({
      id: 'party-performance-trend',
      name: 'Party Performance Trend',
      category: 'trend',
      template: `Analyze party performance trends:

Party Performance Over Time:
{{partyTrendData}}

Key Metrics:
- Vote share trends
- Seat distribution changes
- Regional performance shifts
- Margin patterns

Identify:
1. Rising parties and their growth trajectory
2. Declining parties and reasons for decline
3. Regional strongholds and changes
4. Swing constituencies and patterns
5. Future projections based on current trends

Focus on actionable insights for political strategists and analysts.`,
      variables: ['partyTrendData'],
      outputFormat: 'text',
      temperature: 0.7,
    });

    // Anomaly Detection Prompts
    this.addTemplate({
      id: 'anomaly-detection',
      name: 'Election Anomaly Detection',
      category: 'anomaly',
      template: `Analyze the following election data for anomalies:

{{electionData}}

Look for:
1. Unusual turnout patterns (extremely high/low)
2. Unexpected party performance in specific areas
3. Statistical outliers in vote margins
4. Inconsistent data across related constituencies
5. Deviations from historical patterns

For each potential anomaly:
- Describe the anomaly
- Provide statistical evidence
- Suggest possible explanations
- Recommend further investigation

Rate anomalies by severity: Low, Medium, High, Critical`,
      variables: ['electionData'],
      outputFormat: 'json',
      temperature: 0.5,
    });

    this.addTemplate({
      id: 'fraud-indicators',
      name: 'Fraud Indicator Analysis',
      category: 'anomaly',
      template: `Examine election data for potential fraud indicators:

{{constituencyData}}

Check for:
1. Impossibly high turnout rates (>95%)
2. Identical vote counts across multiple constituencies
3. Suspicious margin patterns
4. Inconsistent voter registration vs turnout
5. Unusual demographic-voting pattern mismatches

Provide a risk assessment with:
- Risk level (Low/Medium/High)
- Specific indicators found
- Statistical significance
- Recommended actions

Be objective and data-focused. Avoid political bias.`,
      variables: ['constituencyData'],
      outputFormat: 'json',
      temperature: 0.3,
    });

    // Constituency Insight Prompts
    this.addTemplate({
      id: 'constituency-analysis',
      name: 'Constituency Deep Analysis',
      category: 'constituency',
      template: `Provide a detailed analysis of the following constituency:

Constituency: {{constituencyName}}
State: {{state}}

Election Results:
{{electionResults}}

Demographics:
{{demographics}}

Historical Performance:
{{historicalData}}

Analysis should include:
1. Current outcome and margin
2. Winner's performance vs historical
3. Key demographic factors
4. Turnout patterns
5. Competitive landscape
6. Future election outlook
7. Strategic recommendations for parties

Provide actionable insights for political strategists.`,
      variables: ['constituencyName', 'state', 'electionResults', 'demographics', 'historicalData'],
      outputFormat: 'text',
      temperature: 0.7,
    });

    this.addTemplate({
      id: 'swing-constituency-analysis',
      name: 'Swing Constituency Analysis',
      category: 'constituency',
      template: `Analyze the following swing constituency:

{{constituencyData}}

Focus on:
1. Why this constituency swung (demographic, economic, political factors)
2. Margin of victory and its significance
3. Role of local issues
4. Candidate impact
5. Implications for future elections
6. Similar constituencies that might follow the same pattern

Provide insights that can help understand broader electoral shifts.`,
      variables: ['constituencyData'],
      outputFormat: 'text',
      temperature: 0.7,
    });

    // Simplified Explanation Prompts
    this.addTemplate({
      id: 'explain-to-beginner',
      name: 'Beginner-Friendly Explanation',
      category: 'explanation',
      template: `Explain the following election concept to someone with no political knowledge:

{{concept}}

{{data}}

Requirements:
- Use simple, everyday language
- Avoid jargon or explain it if necessary
- Use analogies where helpful
- Keep it under 200 words
- Focus on the "why it matters" aspect

Make it engaging and easy to understand.`,
      variables: ['concept', 'data'],
      outputFormat: 'text',
      temperature: 0.8,
    });

    this.addTemplate({
      id: 'explain-complex-metric',
      name: 'Complex Metric Explanation',
      category: 'explanation',
      template: `Explain this complex electoral metric in simple terms:

Metric: {{metricName}}
Value: {{metricValue}}
Context: {{context}}

Break down:
1. What the metric measures
2. Why it's important
3. How to interpret the current value
4. What it means for different stakeholders
5. Historical context if available

Use examples and avoid technical jargon.`,
      variables: ['metricName', 'metricValue', 'context'],
      outputFormat: 'text',
      temperature: 0.7,
    });

    // Conversational Query Prompts
    this.addTemplate({
      id: 'natural-language-query',
      name: 'Natural Language Query Handler',
      category: 'query',
      template: `You are an election data analyst. Answer the user's question based on the available data.

Available Data:
{{availableData}}

User Question: {{userQuery}}

Context: The user is asking about {{analysisType}}.

Provide:
1. A direct answer to the question
2. Supporting data and statistics
3. Relevant context
4. Any caveats or limitations
5. Follow-up questions the user might want to ask

Be accurate, concise, and helpful. If data is insufficient, clearly state what additional information is needed.`,
      variables: ['availableData', 'userQuery', 'analysisType'],
      outputFormat: 'text',
      temperature: 0.7,
    });

    this.addTemplate({
      id: 'comparative-analysis',
      name: 'Comparative Analysis Query',
      category: 'query',
      template: `Perform a comparative analysis based on the user's request:

Comparison Request: {{userQuery}}

Data Set A: {{dataSetA}}
Data Set B: {{dataSetB}}

Compare:
1. Key differences and similarities
2. Statistical significance
3. Context and implications
4. Trend patterns
5. Recommendations

Structure the response clearly with headings and bullet points.`,
      variables: ['userQuery', 'dataSetA', 'dataSetB'],
      outputFormat: 'markdown',
      temperature: 0.7,
    });
  }

  private addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a prompt template by ID
   */
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates by category
   */
  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Build a prompt from a template with variable substitution
   */
  buildPrompt(templateId: string, variables: Record<string, any>): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let prompt = template.template;

    // Replace variables
    template.variables.forEach(variable => {
      const value = variables[variable];
      if (value === undefined) {
        throw new Error(`Missing variable: ${variable}`);
      }

      // Convert objects to string representation
      const stringValue = typeof value === 'object' 
        ? JSON.stringify(value, null, 2) 
        : String(value);

      prompt = prompt.replace(new RegExp(`{{${variable}}}`, 'g'), stringValue);
    });

    return prompt;
  }

  /**
   * Optimize prompt for token usage
   */
  optimizePrompt(prompt: string, maxTokens: number = 30000): string {
    if (prompt.length <= maxTokens) {
      return prompt;
    }

    // Truncate while preserving structure
    const ratio = maxTokens / prompt.length;
    const lines = prompt.split('\n');
    const targetLines = Math.floor(lines.length * ratio);
    
    return lines.slice(0, targetLines).join('\n');
  }

  /**
   * Add context to a prompt
   */
  addContext(prompt: string, context: PromptContext): string {
    const contextBlocks: string[] = [];

    if (context.electionData) {
      contextBlocks.push(`Election Data:\n${JSON.stringify(context.electionData, null, 2)}`);
    }

    if (context.constituencyData) {
      contextBlocks.push(`Constituency Data:\n${JSON.stringify(context.constituencyData, null, 2)}`);
    }

    if (context.historicalData) {
      contextBlocks.push(`Historical Data:\n${JSON.stringify(context.historicalData, null, 2)}`);
    }

    if (context.userQuery) {
      contextBlocks.push(`User Query: ${context.userQuery}`);
    }

    if (context.analysisType) {
      contextBlocks.push(`Analysis Type: ${context.analysisType}`);
    }

    if (contextBlocks.length === 0) {
      return prompt;
    }

    return `${contextBlocks.join('\n\n')}\n\n${prompt}`;
  }

  /**
   * Get template configuration
   */
  getTemplateConfig(templateId: string): {
    temperature?: number;
    maxTokens?: number;
    outputFormat: string;
  } | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    return {
      temperature: template.temperature,
      maxTokens: template.maxTokens,
      outputFormat: template.outputFormat,
    };
  }

  /**
   * List all available templates
   */
  listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }
}

// Singleton instance
let promptService: PromptEngineeringService | null = null;

export function getPromptService(): PromptEngineeringService {
  if (!promptService) {
    promptService = new PromptEngineeringService();
  }
  return promptService;
}
