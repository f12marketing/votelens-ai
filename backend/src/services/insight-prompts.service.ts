/**
 * Insight Generation Prompt Templates
 * Specialized prompts for generating AI election insights
 */

import { InsightType, InsightCategory } from '../types/insight.schema';

export interface InsightPromptTemplate {
  id: string;
  type: InsightType;
  category: InsightCategory;
  template: string;
  outputSchema: any;
  variables: string[];
  tone: 'neutral' | 'analytical' | 'cautious' | 'urgent';
}

export class InsightPromptsService {
  private templates: Map<string, InsightPromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Summary Prompts
    this.addTemplate({
      id: 'summary-overview',
      type: 'summary',
      category: 'party_performance',
      template: `Analyze the following election data and generate a concise summary insight:

Election Metrics:
{{metrics}}

Turnout Data:
{{turnoutData}}

Generate a summary insight with:
- A clear, concise title (under 10 words)
- A 2-3 sentence summary highlighting the most important outcome
- 3-5 key data points with context
- Confidence score (0-1) based on data completeness
- Impact score (1-10) based on significance
- Relevance score (1-10) based on current importance

Tone: Neutral, analytical, non-partisan
Keep it under 150 words total.

Output format:
{
  "title": "...",
  "summary": "...",
  "details": "...",
  "confidence": 0.85,
  "impact": 8,
  "relevance": 9,
  "dataPoints": [{"label": "...", "value": "...", "context": "..."}]
}`,
      outputSchema: {},
      variables: ['metrics', 'turnoutData'],
      tone: 'analytical',
    });

    // Anomaly Detection Prompts
    this.addTemplate({
      id: 'anomaly-turnout',
      type: 'anomaly',
      category: 'turnout',
      template: `Analyze the following turnout data for anomalies:

{{turnoutData}}

Historical Context:
{{historicalData}}

Identify:
1. Unusually high or low turnout rates (statistical outliers)
2. Unexpected turnout patterns compared to historical averages
3. Regional inconsistencies
4. Any suspicious patterns

For each anomaly found:
- Provide a clear title
- Explain what makes it anomalous
- Provide statistical evidence
- Suggest possible explanations (non-partisan)
- Assign confidence (0-1) and impact (1-10)

Tone: Neutral, cautious, analytical
Focus on data-driven analysis without speculation.

Output format:
{
  "title": "...",
  "summary": "...",
  "details": "...",
  "confidence": 0.75,
  "impact": 9,
  "relevance": 8,
  "dataPoints": [...],
  "recommendations": [...]
}`,
      outputSchema: {},
      variables: ['turnoutData', 'historicalData'],
      tone: 'cautious',
    });

    this.addTemplate({
      id: 'anomaly-margin',
      type: 'anomaly',
      category: 'margin',
      template: `Analyze the following election margin data for anomalies:

{{marginData}}

Identify:
1. Unusually large or small victory margins
2. Unexpected margin patterns
3. Margins that don't align with historical trends
4. Statistical outliers in margin distribution

For each anomaly:
- Title the anomaly clearly
- Provide statistical evidence
- Explain why it's unusual
- Suggest possible factors (demographic, political, external)
- Rate confidence and impact

Tone: Analytical, neutral
Avoid political bias or speculation.

Output format:
{
  "title": "...",
  "summary": "...",
  "details": "...",
  "confidence": 0.8,
  "impact": 7,
  "relevance": 7,
  "dataPoints": [...]
}`,
      outputSchema: {},
      variables: ['marginData'],
      tone: 'analytical',
    });

    // Trend Analysis Prompts
    this.addTemplate({
      id: 'trend-turnout',
      type: 'trend',
      category: 'turnout',
      template: `Analyze turnout trends from the following data:

{{turnoutData}}

Historical Trend Data:
{{historicalData}}

Identify:
1. Overall turnout trend (increasing/decreasing/stable)
2. Regional turnout trends
3. Demographic turnout trends (if available)
4. Factors that might explain the trends

Provide:
- A clear trend title
- Summary of the trend with direction and magnitude
- Statistical evidence with percentages
- Possible explanations
- Confidence and impact scores

Tone: Neutral, analytical
Focus on data-driven insights.

Output format:
{
  "title": "...",
  "summary": "...",
  "details": "...",
  "confidence": 0.85,
  "impact": 6,
  "relevance": 8,
  "dataPoints": [...]
}`,
      outputSchema: {},
      variables: ['turnoutData', 'historicalData'],
      tone: 'analytical',
    });

    this.addTemplate({
      id: 'trend-party-performance',
      type: 'trend',
      category: 'party_performance',
      template: `Analyze party performance trends:

{{partyData}}

Historical Comparison:
{{historicalData}}

Identify:
1. Rising parties and growth trajectory
2. Declining parties and reasons
3. Regional performance shifts
4. Vote share trends over time

Provide:
- Clear trend title
- Summary of the trend
- Statistical evidence
- Analysis of factors
- Confidence and impact scores

Tone: Neutral, non-partisan
Avoid political bias.

Output format:
{
  "title": "...",
  "summary": "...",
  "details": "...",
  "confidence": 0.8,
  "impact": 7,
  "relevance": 9,
  "dataPoints": [...]
}`,
      outputSchema: {},
      variables: ['partyData', 'historicalData'],
      tone: 'analytical',
    });

    // Political Movement Prompts
    this.addTemplate({
      id: 'movement-swing',
      type: 'movement',
      category: 'party_performance',
      template: `Analyze political swing movements:

{{swingData}}

Identify:
1. Significant voter shifts between parties
2. Geographic patterns of swing
3. Demographic factors in swing
4. Implications for future elections

Provide:
- Clear movement title
- Summary of the swing
- Statistical evidence with magnitude
- Analysis of causes
- Strategic implications
- Confidence and impact scores

Tone: Analytical, neutral
Focus on voter behavior patterns.

Output format:
{
  "title": "...",
  "summary": "...",
  "details": "...",
  "confidence": 0.75,
  "impact": 9,
  "relevance": 9,
  "dataPoints": [...],
  "recommendations": [...]
}`,
      outputSchema: {},
      variables: ['swingData'],
      tone: 'analytical',
    });

    this.addTemplate({
      id: 'movement-emergence',
      type: 'movement',
      category: 'party_performance',
      template: `Analyze emerging political movements:

{{emergenceData}}

Identify:
1. New or growing political forces
2. Declining established parties
3. Regional emergence patterns
4. Factors driving emergence

Provide:
- Clear emergence title
- Summary of the movement
- Growth trajectory with statistics
- Analysis of drivers
- Future outlook
- Confidence and impact scores

Tone: Analytical, neutral
Avoid partisan language.

Output format:
{
  "title": "...",
  "summary": "...",
  "details": "...",
  "confidence": 0.7,
  "impact": 8,
  "relevance": 8,
  "dataPoints": [...]
}`,
      outputSchema: {},
      variables: ['emergenceData'],
      tone: 'analytical',
    });

    // Comparative Analysis Prompts
    this.addTemplate({
      id: 'comparative-regional',
      type: 'comparative',
      category: 'regional',
      template: `Compare regional election patterns:

{{regionalData}}

Identify:
1. Key differences between regions
2. Similarities across regions
3. Outlier regions
4. Regional performance patterns

Provide:
- Clear comparison title
- Summary of regional differences
- Statistical comparisons
- Analysis of factors
- Confidence and impact scores

Tone: Neutral, analytical
Focus on factual comparisons.

Output format:
{
  "title": "...",
  "summary": "...",
  "details": "...",
  "confidence": 0.85,
  "impact": 6,
  "relevance": 7,
  "dataPoints": [...]
}`,
      outputSchema: {},
      variables: ['regionalData'],
      tone: 'analytical',
    });

    // Prediction Prompts
    this.addTemplate({
      id: 'prediction-outcome',
      type: 'prediction',
      category: 'strategic',
      template: `Based on current election data, analyze potential future outcomes:

{{currentData}}

Historical Context:
{{historicalData}}

Identify:
1. Trends that might continue
2. Potential shifts based on current patterns
3. Factors that could change outcomes
4. Regional implications

Provide:
- Clear prediction title
- Summary of the prediction with qualifiers
- Supporting data
- Confidence level (must be realistic, not overconfident)
- Impact assessment
- Caveats and limitations

Tone: Cautious, analytical
Avoid definitive predictions; use probabilistic language.

Output format:
{
  "title": "...",
  "summary": "...",
  "details": "...",
  "confidence": 0.6,
  "impact": 7,
  "relevance": 8,
  "dataPoints": [...],
  "recommendations": [...]
}`,
      outputSchema: {},
      variables: ['currentData', 'historicalData'],
      tone: 'cautious',
    });

    // Explanation Prompts
    this.addTemplate({
      id: 'explanation-metric',
      type: 'explanation',
      category: 'strategic',
      template: `Explain the following election metric in simple terms:

Metric: {{metricName}}
Value: {{metricValue}}
Context: {{context}}

Provide:
- A clear explanation title
- Simple explanation of what the metric means
- Why it matters for election analysis
- How to interpret the current value
- Contextual comparison
- Confidence and relevance scores

Tone: Educational, neutral
Make it accessible to non-experts.

Output format:
{
  "title": "...",
  "summary": "...",
  "details": "...",
  "confidence": 0.95,
  "impact": 5,
  "relevance": 7,
  "dataPoints": [...]
}`,
      outputSchema: {},
      variables: ['metricName', 'metricValue', 'context'],
      tone: 'analytical',
    });
  }

  private addTemplate(template: InsightPromptTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): InsightPromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(type: InsightType): InsightPromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: InsightCategory): InsightPromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Get templates by tone
   */
  getTemplatesByTone(tone: InsightPromptTemplate['tone']): InsightPromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.tone === tone);
  }

  /**
   * Build prompt from template with variable substitution
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

      const stringValue = typeof value === 'object' 
        ? JSON.stringify(value, null, 2) 
        : String(value);

      prompt = prompt.replace(new RegExp(`{{${variable}}}`, 'g'), stringValue);
    });

    return prompt;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): InsightPromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template output schema
   */
  getOutputSchema(templateId: string): any {
    const template = this.templates.get(templateId);
    return template?.outputSchema;
  }
}

// Singleton instance
let insightPromptsService: InsightPromptsService | null = null;

export function getInsightPromptsService(): InsightPromptsService {
  if (!insightPromptsService) {
    insightPromptsService = new InsightPromptsService();
  }
  return insightPromptsService;
}
