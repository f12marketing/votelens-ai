import { BaseService } from './base.service';
import { getGeminiService } from './gemini.service';
import { ElectionComparison } from '../types/comparison.schema';

export class ComparisonAIService extends BaseService {
  private geminiService = getGeminiService({
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  });

  /**
   * Generate AI-powered comparison summary
   */
  async generateComparisonSummary(comparison: ElectionComparison): Promise<string> {
    const prompt = this.buildComparisonPrompt(comparison);

    try {
      const response = await this.geminiService.generateText({
        prompt,
        temperature: 0.7,
      });

      return response.text;
    } catch (error: any) {
      this.logError('Failed to generate AI comparison summary', error);
      return this.generateFallbackSummary(comparison);
    }
  }

  /**
   * Build comparison prompt for AI
   */
  private buildComparisonPrompt(comparison: ElectionComparison): string {
    return `You are an election analyst. Provide a comprehensive, neutral, and analytical comparison between the ${comparison.year1} and ${comparison.year2} elections.

ELECTION COMPARISON DATA:

Turnout Change: ${comparison.summary.overallTurnoutChangePercentage.toFixed(1)}% (${comparison.year1}: ${comparison.year1}, ${comparison.year2}: ${comparison.year2})
Total Flipped Constituencies: ${comparison.summary.totalFlippedConstituencies}
Average Swing: ${comparison.summary.averageSwing.toFixed(1)}%

VOTE SHARE CHANGES:
${comparison.voteShareChanges.map(c => 
  `- ${c.party}: ${c.year1Share.toFixed(1)}% → ${c.year2Share.toFixed(1)}% (${c.change > 0 ? '+' : ''}${c.change.toFixed(1)}%, ${c.trend})`
).join('\n')}

PARTY PERFORMANCE:
${comparison.partyPerformanceChanges.map(p => 
  `- ${p.party}: Seats ${p.year1Seats} → ${p.year2Seats} (${p.seatsChange > 0 ? '+' : ''}${p.seatsChange}), ${p.performance}`
).join('\n')}

KEY CONSTITUENCY SWINGS:
${comparison.constituencySwings.slice(0, 5).map(s => 
  `- ${s.constituencyName}: ${s.year1Party} (${s.year1Margin}%) → ${s.year2Party} (${s.year2Margin}%)${s.flipped ? ' [FLIPPED]' : ''}`
).join('\n')}

REGIONAL COMPARISONS:
${comparison.regionalComparisons.map(r => 
  `- ${r.region}: Turnout ${r.year1Turnout.toFixed(1)}% → ${r.year2Turnout.toFixed(1)}% (${r.turnoutChange > 0 ? '+' : ''}${r.turnoutChange.toFixed(1)}%)`
).join('\n')}

TASK: Generate a comprehensive comparison summary (200-300 words) that:
1. Provides an overall assessment of the election shift
2. Highlights the most significant changes in party performance
3. Analyzes turnout patterns and their implications
4. Identifies key constituency swings and their significance
5. Discusses regional trends and patterns
6. Concludes with the most important takeaway

Tone: Analytical, neutral, non-partisan, data-driven
Avoid: Political bias, speculation without data support, partisan language`;
  }

  /**
   * Generate fallback summary when AI fails
   */
  private generateFallbackSummary(comparison: ElectionComparison): string {
    const parts: string[] = [];

    parts.push(`The ${comparison.year2} election showed a ${comparison.summary.overallTurnoutChangePercentage.toFixed(1)}% change in turnout compared to ${comparison.year1}.`);

    parts.push(`${comparison.summary.totalFlippedConstituencies} constituencies changed hands, with an average swing of ${comparison.summary.averageSwing.toFixed(1)}%.`);

    const biggestGainer = comparison.voteShareChanges.find(c => c.trend === 'gaining');
    if (biggestGainer) {
      parts.push(`${biggestGainer.party} gained the most vote share (${biggestGainer.change > 0 ? '+' : ''}${biggestGainer.change.toFixed(1)}%).`);
    }

    const biggestLoser = comparison.voteShareChanges.find(c => c.trend === 'losing');
    if (biggestLoser) {
      parts.push(`${biggestLoser.party} lost the most vote share (${biggestLoser.change.toFixed(1)}%).`);
    }

    const flippedConstituencies = comparison.constituencySwings.filter(s => s.flipped);
    if (flippedConstituencies.length > 0) {
      parts.push(`Key flips include ${flippedConstituencies.slice(0, 3).map(s => s.constituencyName).join(', ')}.`);
    }

    return parts.join(' ');
  }

  /**
   * Generate insights from comparison data
   */
  async generateInsights(comparison: ElectionComparison): Promise<string[]> {
    const prompt = `Based on the following election comparison data, generate 3-5 key insights:

${JSON.stringify(comparison, null, 2)}

Each insight should:
- Be data-driven
- Focus on significant patterns or anomalies
- Be concise (1-2 sentences)
- Be analytical and neutral

Output format: Insight 1. [text] Insight 2. [text] ...`;

    try {
      const response = await this.geminiService.generateText({
        prompt,
        temperature: 0.7,
      });

      return response.text.split(/Insight \d+\./).filter(i => i.trim());
    } catch (error: any) {
      this.logError('Failed to generate AI insights', error);
      return this.generateFallbackInsights(comparison);
    }
  }

  /**
   * Generate fallback insights
   */
  private generateFallbackInsights(comparison: ElectionComparison): string[] {
    const insights: string[] = [];

    if (Math.abs(comparison.summary.overallTurnoutChangePercentage) > 2) {
      insights.push(`Turnout ${comparison.summary.overallTurnoutChangePercentage > 0 ? 'increased' : 'decreased'} significantly by ${Math.abs(comparison.summary.overallTurnoutChangePercentage).toFixed(1)}%.`);
    }

    if (comparison.summary.totalFlippedConstituencies > 10) {
      insights.push(`High number of flipped constituencies (${comparison.summary.totalFlippedConstituencies}) indicates significant voter shift.`);
    }

    const topGainer = comparison.voteShareChanges[0];
    if (topGainer && Math.abs(topGainer.change) > 3) {
      insights.push(`${topGainer.party} showed ${topGainer.trend === 'gaining' ? 'strong' : 'significant'} performance change.`);
    }

    const highSwingConstituencies = comparison.constituencySwings.filter(s => s.swing > 5);
    if (highSwingConstituencies.length > 0) {
      insights.push(`${highSwingConstituencies.length} constituencies showed high swing (>5%).`);
    }

    return insights.slice(0, 5);
  }

  /**
   * Generate trend analysis
   */
  async generateTrendAnalysis(comparison: ElectionComparison): Promise<string> {
    const prompt = `Analyze the following election comparison data and provide a trend analysis:

${JSON.stringify(comparison, null, 2)}

Focus on:
1. Overall political direction (shift left/right/center)
2. Party momentum trends
3. Regional trend patterns
4. Turnout trend implications

Provide a concise analysis (150-200 words) that identifies clear trends supported by data.`;

    try {
      const response = await this.geminiService.generateText({
        prompt,
        temperature: 0.7,
      });

      return response.text;
    } catch (error: any) {
      this.logError('Failed to generate trend analysis', error);
      return 'Trend analysis unavailable. Please review the comparison data for patterns.';
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return this.geminiService.healthCheck();
  }
}

// Singleton instance
let comparisonAIService: ComparisonAIService | null = null;

export function getComparisonAIService(): ComparisonAIService {
  if (!comparisonAIService) {
    comparisonAIService = new ComparisonAIService();
  }
  return comparisonAIService;
}
