import { BaseService } from './base.service';
import { ExecutiveSummary, KeyFinding, Recommendation } from '../types/report.schema';

export class ExecutiveSummaryAIService extends BaseService {
  private geminiApiKey = process.env.GEMINI_API_KEY || '';
  private geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

  /**
   * Generate AI executive summary
   */
  async generateExecutiveSummary(data: any): Promise<ExecutiveSummary> {
    if (!this.geminiApiKey) {
      this.logWarn('GEMINI_API_KEY not set, using fallback summary');
      return this.generateFallbackSummary(data);
    }

    try {
      const prompt = this.buildSummaryPrompt(data);
      const summary = await this.callGeminiAPI(prompt);
      return this.parseSummaryResponse(summary);
    } catch (error) {
      this.logError('Failed to generate AI summary, using fallback', error);
      return this.generateFallbackSummary(data);
    }
  }

  /**
   * Build summary prompt for AI
   */
  private buildSummaryPrompt(data: any): string {
    let prompt = `Generate an executive summary for an election analysis report based on the following data:\n\n`;

    if (data.constituencies) {
      prompt += `Constituencies: ${data.constituencies.length}\n`;
    }

    if (data.elections) {
      prompt += `Elections: ${data.elections.map((e: any) => e.year).join(', ')}\n`;
    }

    if (data.insights) {
      prompt += `Key Insights: ${data.insights.slice(0, 5).map((i: any) => i.title).join('; ')}\n`;
    }

    if (data.performanceMetrics) {
      prompt += `Average Turnout: ${data.performanceMetrics.averageTurnout}%\n`;
      prompt += `Average Margin: ${data.performanceMetrics.averageMargin}%\n`;
    }

    prompt += `\nPlease provide a JSON response with the following structure:
{
  "title": "Executive Summary",
  "overview": "Brief overview of the analysis",
  "keyFindings": [
    {
      "id": "kf-1",
      "category": "performance|trend|anomaly|opportunity|risk",
      "title": "Finding title",
      "description": "Detailed description",
      "supportingData": {},
      "impact": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "priority": "immediate|short_term|long_term",
      "title": "Recommendation title",
      "description": "Description",
      "actionItems": ["Action 1", "Action 2"],
      "expectedOutcome": "Expected outcome"
    }
  ],
  "conclusion": "Concluding statement"
}`;

    return prompt;
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result: any = await response.json();
    return result.candidates[0].content.parts[0].text;
  }

  /**
   * Parse summary response from AI
   */
  private parseSummaryResponse(response: string): ExecutiveSummary {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      const parsed = JSON.parse(jsonString);

      return {
        title: parsed.title || 'Executive Summary',
        overview: parsed.overview || 'Analysis overview',
        keyFindings: parsed.keyFindings || [],
        recommendations: parsed.recommendations || [],
        conclusion: parsed.conclusion || 'Analysis conclusion',
        generatedAt: new Date(),
        aiGenerated: true,
      };
    } catch (error) {
      this.logError('Failed to parse AI response, using fallback', error);
      return this.generateFallbackSummary({});
    }
  }

  /**
   * Generate fallback summary
   */
  private generateFallbackSummary(data: any): ExecutiveSummary {
    const constituencyCount = data.constituencies?.length || 0;
    const electionYears = data.elections?.map((e: any) => e.year).join(', ') || 'N/A';

    return {
      title: 'Executive Summary',
      overview: `This report provides a comprehensive analysis of election data across ${constituencyCount} constituencies for the years ${electionYears}. The analysis examines key performance metrics, trends, and patterns in electoral outcomes.`,
      keyFindings: [
        {
          id: 'kf-1',
          category: 'performance',
          title: 'Overall Performance',
          description: `Analysis of ${constituencyCount} constituencies reveals significant patterns in electoral performance and voter turnout.`,
          supportingData: { constituencyCount },
          impact: 'high',
        },
        {
          id: 'kf-2',
          category: 'trend',
          title: 'Turnout Trends',
          description: 'Voter turnout shows consistent patterns with notable variations across different regions and demographics.',
          supportingData: {},
          impact: 'medium',
        },
        {
          id: 'kf-3',
          category: 'opportunity',
          title: 'Strategic Opportunities',
          description: 'Several constituencies present opportunities for improved engagement and performance optimization.',
          supportingData: {},
          impact: 'high',
        },
      ],
      recommendations: [
        {
          id: 'rec-1',
          priority: 'immediate',
          title: 'Address High-Risk Constituencies',
          description: 'Focus resources on constituencies identified as high-risk for electoral performance.',
          actionItems: ['Implement targeted outreach programs', 'Increase campaign presence', 'Monitor voter sentiment'],
          expectedOutcome: 'Improved electoral performance in targeted areas',
        },
        {
          id: 'rec-2',
          priority: 'short_term',
          title: 'Leverage High Turnout Areas',
          description: 'Capitalize on constituencies with high voter turnout to maximize electoral gains.',
          actionItems: ['Increase campaign resources', 'Engage with local influencers', 'Strengthen grassroots networks'],
          expectedOutcome: 'Enhanced electoral outcomes in high-turnout areas',
        },
        {
          id: 'rec-3',
          priority: 'long_term',
          title: 'Build Sustainable Engagement',
          description: 'Develop long-term strategies for sustained voter engagement and community building.',
          actionItems: ['Establish community programs', 'Create voter education initiatives', 'Build local leadership pipelines'],
          expectedOutcome: 'Sustained electoral success and community trust',
        },
      ],
      conclusion: 'The analysis provides actionable insights for strategic planning and resource allocation. Continued monitoring and adaptive strategies will be essential for achieving electoral objectives.',
      generatedAt: new Date(),
      aiGenerated: false,
    };
  }

  /**
   * Generate key findings
   */
  async generateKeyFindings(data: any): Promise<KeyFinding[]> {
    if (!this.geminiApiKey) {
      return this.generateFallbackKeyFindings(data);
    }

    try {
      const prompt = this.buildKeyFindingsPrompt(data);
      const response = await this.callGeminiAPI(prompt);
      return this.parseKeyFindingsResponse(response);
    } catch (error) {
      this.logError('Failed to generate AI key findings, using fallback', error);
      return this.generateFallbackKeyFindings(data);
    }
  }

  /**
   * Build key findings prompt
   */
  private buildKeyFindingsPrompt(data: any): string {
    let prompt = `Generate 5 key findings from the following election analysis data:\n\n`;
    prompt += JSON.stringify(data, null, 2);
    prompt += `\n\nReturn a JSON array of findings with structure:
[
  {
    "id": "kf-1",
    "category": "performance|trend|anomaly|opportunity|risk",
    "title": "Finding title",
    "description": "Description",
    "supportingData": {},
    "impact": "high|medium|low"
  }
]`;

    return prompt;
  }

  /**
   * Parse key findings response
   */
  private parseKeyFindingsResponse(response: string): KeyFinding[] {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      return JSON.parse(jsonString);
    } catch (error) {
      this.logError('Failed to parse key findings response', error);
      return this.generateFallbackKeyFindings({});
    }
  }

  /**
   * Generate fallback key findings
   */
  private generateFallbackKeyFindings(_data: any): KeyFinding[] {
    return [
      {
        id: 'kf-1',
        category: 'performance',
        title: 'Strong Performance in Urban Areas',
        description: 'Urban constituencies show higher turnout and more competitive races.',
        supportingData: {},
        impact: 'high',
      },
      {
        id: 'kf-2',
        category: 'trend',
        title: 'Increasing Voter Engagement',
        description: 'Overall voter turnout shows positive trend across analyzed constituencies.',
        supportingData: {},
        impact: 'medium',
      },
      {
        id: 'kf-3',
        category: 'opportunity',
        title: 'Untapped Rural Potential',
        description: 'Rural constituencies present opportunities for improved engagement.',
        supportingData: {},
        impact: 'high',
      },
    ];
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations(data: any): Promise<Recommendation[]> {
    if (!this.geminiApiKey) {
      return this.generateFallbackRecommendations(data);
    }

    try {
      const prompt = this.buildRecommendationsPrompt(data);
      const response = await this.callGeminiAPI(prompt);
      return this.parseRecommendationsResponse(response);
    } catch (error) {
      this.logError('Failed to generate AI recommendations, using fallback', error);
      return this.generateFallbackRecommendations(data);
    }
  }

  /**
   * Build recommendations prompt
   */
  private buildRecommendationsPrompt(data: any): string {
    let prompt = `Generate 5 actionable recommendations based on the following election analysis:\n\n`;
    prompt += JSON.stringify(data, null, 2);
    prompt += `\n\nReturn a JSON array of recommendations with structure:
[
  {
    "id": "rec-1",
    "priority": "immediate|short_term|long_term",
    "title": "Recommendation title",
    "description": "Description",
    "actionItems": ["Action 1", "Action 2"],
    "expectedOutcome": "Expected outcome"
  }
]`;

    return prompt;
  }

  /**
   * Parse recommendations response
   */
  private parseRecommendationsResponse(response: string): Recommendation[] {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      return JSON.parse(jsonString);
    } catch (error) {
      this.logError('Failed to parse recommendations response', error);
      return this.generateFallbackRecommendations({});
    }
  }

  /**
   * Generate fallback recommendations
   */
  private generateFallbackRecommendations(_data: any): Recommendation[] {
    return [
      {
        id: 'rec-1',
        priority: 'immediate',
        title: 'Increase Voter Outreach',
        description: 'Implement targeted outreach programs to increase voter engagement.',
        actionItems: ['Door-to-door campaigns', 'Community meetings', 'Social media engagement'],
        expectedOutcome: 'Increased voter turnout and awareness',
      },
      {
        id: 'rec-2',
        priority: 'short_term',
        title: 'Strengthen Local Presence',
        description: 'Build stronger local party infrastructure and volunteer networks.',
        actionItems: ['Recruit local volunteers', 'Establish local offices', 'Train grassroots leaders'],
        expectedOutcome: 'Improved ground-level campaign effectiveness',
      },
      {
        id: 'rec-3',
        priority: 'long_term',
        title: 'Data-Driven Strategy',
        description: 'Implement comprehensive data collection and analysis for strategic planning.',
        actionItems: ['Invest in analytics tools', 'Train staff on data analysis', 'Establish regular reporting'],
        expectedOutcome: 'Improved decision-making and resource allocation',
      },
    ];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; geminiConfigured: boolean }> {
    return {
      status: 'healthy',
      geminiConfigured: !!this.geminiApiKey,
    };
  }
}

// Singleton instance
let executiveSummaryAIService: ExecutiveSummaryAIService | null = null;

export function getExecutiveSummaryAIService(): ExecutiveSummaryAIService {
  if (!executiveSummaryAIService) {
    executiveSummaryAIService = new ExecutiveSummaryAIService();
  }
  return executiveSummaryAIService;
}
