import { BaseService } from './base.service';

/**
 * AI Anchor Service
 * Generates professional news-style commentary for election analytics
 */

interface ElectionTrend {
  electionId: string;
  electionName: string;
  trend: 'rising' | 'falling' | 'stable';
  percentage: number;
  change: number;
  timeFrame: string;
}

interface LiveAnalytics {
  totalVotes: number;
  votesPerMinute: number;
  leadingCandidate: string;
  margin: number;
  constituenciesReporting: number;
  totalConstituencies: number;
  timestamp: Date;
}

interface AnchorCommentary {
  id: string;
  type: 'trend' | 'summary' | 'highlight' | 'analysis';
  content: string;
  tone: 'professional' | 'urgent' | 'celebratory' | 'cautious';
  duration: number; // Estimated speaking time in seconds
  metadata: {
    electionId?: string;
    timestamp: Date;
    confidence: number;
  };
}

interface AnchorConfig {
  style: 'news' | 'sports' | 'documentary';
  pacing: 'slow' | 'normal' | 'fast';
  detailLevel: 'brief' | 'standard' | 'detailed';
  includeNumbers: boolean;
  includePercentages: boolean;
  maxDuration: number; // Maximum segment duration in seconds
}

export class AnchorService extends BaseService {
  private commentaryTemplates: Record<string, string[]> = {
    trend: [
      "Breaking now: {electionName} is showing a {trend} trend with {change} percent change in the {timeFrame}.",
      "We're seeing significant movement in {electionName}. The numbers are {trend} by {percentage} percent.",
      "Latest figures from {electionName} indicate a {trend} pattern as votes continue to be counted.",
      "The story in {electionName} is evolving rapidly, with a {change} percent shift in recent hours.",
    ],
    summary: [
      "With {totalVotes} votes counted so far, {leadingCandidate} is maintaining a lead of {margin} percent.",
      "Current standings show {leadingCandidate} ahead by {margin} percent, with {constituenciesReporting} of {totalConstituencies} constituencies reporting.",
      "We're tracking {votesPerMinute} votes per minute as counting continues across {totalConstituencies} constituencies.",
      "At this pace, we expect final results within the next few hours as {constituenciesReporting} constituencies have reported.",
    ],
    highlight: [
      "This is a significant development in {electionName}, with implications for the overall outcome.",
      "Voters are turning out in record numbers, with {votesPerMinute} votes being processed every minute.",
      "The margin in key battleground constituencies remains tight, making every vote count.",
      "We're seeing unprecedented engagement as {totalVotes} votes have already been cast.",
    ],
    analysis: [
      "Looking at the data, we can see that voter sentiment has shifted significantly in recent days.",
      "The trends we're observing suggest a competitive race that could go either way.",
      "Historical patterns indicate that current leads may not hold as rural constituencies report.",
      "The turnout numbers are exceeding projections, which could impact final results.",
    ],
  };

  private transitionPhrases: string[] = [
    "Let's take a closer look at the numbers.",
    "Moving on to our next update.",
    "This brings us to an important development.",
    "Here's what the data is telling us.",
    "Let's break this down further.",
    "Turning our attention to the latest figures.",
  ];

  private closingPhrases: string[] = [
    "We'll continue to bring you live updates as they come in.",
    "Stay with us for the latest developments.",
    "We'll be back with more analysis shortly.",
    "Keep watching this space for breaking news.",
  ];

  /**
   * Generate commentary for election trends
   */
  async generateTrendCommentary(
    trends: ElectionTrend[],
    config: AnchorConfig
  ): Promise<AnchorCommentary[]> {
    const commentaries: AnchorCommentary[] = [];

    for (const trend of trends) {
      const template = this.selectTemplate('trend');
      const content = this.fillTemplate(template, {
        electionName: trend.electionName,
        trend: trend.trend,
        percentage: trend.percentage,
        change: trend.change,
        timeFrame: trend.timeFrame,
      });

      commentaries.push({
        id: this.generateId(),
        type: 'trend',
        content: this.applyStyle(content, config),
        tone: this.determineTone(trend.trend, trend.change),
        duration: this.estimateDuration(content),
        metadata: {
          electionId: trend.electionId,
          timestamp: new Date(),
          confidence: 0.9,
        },
      });
    }

    return commentaries;
  }

  /**
   * Generate live analytics summary
   */
  async generateLiveSummary(
    analytics: LiveAnalytics,
    config: AnchorConfig
  ): Promise<AnchorCommentary> {
    const template = this.selectTemplate('summary');
    const content = this.fillTemplate(template, {
      totalVotes: this.formatNumber(analytics.totalVotes),
      votesPerMinute: this.formatNumber(analytics.votesPerMinute),
      leadingCandidate: analytics.leadingCandidate,
      margin: analytics.margin.toFixed(1),
      constituenciesReporting: analytics.constituenciesReporting,
      totalConstituencies: analytics.totalConstituencies,
    });

    return {
      id: this.generateId(),
      type: 'summary',
      content: this.applyStyle(content, config),
      tone: 'professional',
      duration: this.estimateDuration(content),
      metadata: {
        timestamp: new Date(),
        confidence: 0.95,
      },
    };
  }

  /**
   * Generate conversational election commentary
   */
  async generateConversationalCommentary(
    trends: ElectionTrend[],
    analytics: LiveAnalytics,
    config: AnchorConfig
  ): Promise<AnchorCommentary[]> {
    const commentaries: AnchorCommentary[] = [];

    // Start with an opening
    commentaries.push({
      id: this.generateId(),
      type: 'summary',
      content: this.generateOpening(analytics),
      tone: 'professional',
      duration: this.estimateDuration(this.generateOpening(analytics)),
      metadata: {
        timestamp: new Date(),
        confidence: 0.95,
      },
    });

    // Add trend analysis
    for (const trend of trends) {
      const commentary = await this.generateTrendCommentary([trend], config);
      commentaries.push(...commentary);
    }

    // Add highlights
    const highlight = this.selectTemplate('highlight');
    commentaries.push({
      id: this.generateId(),
      type: 'highlight',
      content: this.applyStyle(
        this.fillTemplate(highlight, {
          electionName: analytics.leadingCandidate ? 'the race' : 'the election',
          votesPerMinute: this.formatNumber(analytics.votesPerMinute),
          totalVotes: this.formatNumber(analytics.totalVotes),
        }),
        config
      ),
      tone: 'urgent',
      duration: this.estimateDuration(highlight),
      metadata: {
        timestamp: new Date(),
        confidence: 0.85,
      },
    });

    // Add analysis
    if (config.detailLevel !== 'brief') {
      const analysis = this.selectTemplate('analysis');
      commentaries.push({
        id: this.generateId(),
        type: 'analysis',
        content: this.applyStyle(analysis, config),
        tone: 'cautious',
        duration: this.estimateDuration(analysis),
        metadata: {
          timestamp: new Date(),
          confidence: 0.8,
        },
      });
    }

    // Add transition if multiple segments
    if (commentaries.length > 2) {
      const transition = this.selectTransition();
      commentaries.splice(
        Math.floor(commentaries.length / 2),
        0,
        {
          id: this.generateId(),
          type: 'summary',
          content: transition,
          tone: 'professional',
          duration: this.estimateDuration(transition),
          metadata: {
            timestamp: new Date(),
            confidence: 1.0,
          },
        }
      );
    }

    // Add closing
    const closing = this.selectClosing();
    commentaries.push({
      id: this.generateId(),
      type: 'summary',
      content: closing,
      tone: 'professional',
      duration: this.estimateDuration(closing),
      metadata: {
        timestamp: new Date(),
        confidence: 1.0,
      },
    });

    return commentaries;
  }

  /**
   * Generate real-time commentary for live updates
   */
  async generateRealtimeCommentary(
    update: {
      type: 'new_votes' | 'constituency_complete' | 'leader_change';
      data: any;
    },
    config: AnchorConfig
  ): Promise<AnchorCommentary> {
    let content: string;
    let tone: 'professional' | 'urgent' | 'celebratory' | 'cautious';

    switch (update.type) {
      case 'new_votes':
        content = `We have new numbers coming in. ${this.formatNumber(update.data.votes)} additional votes have been counted, bringing the total to ${this.formatNumber(update.data.total)}.`;
        tone = 'professional';
        break;
      case 'constituency_complete':
        content = `${update.data.constituencyName} has completed counting. ${update.data.winner} takes this constituency with ${update.data.percentage}% of the vote.`;
        tone = 'celebratory';
        break;
      case 'leader_change':
        content = `Breaking news: We have a change in leadership! ${update.data.newLeader} has taken the lead with a margin of ${update.data.margin}%.`;
        tone = 'urgent';
        break;
      default:
        content = 'We continue to monitor the situation closely and will bring you updates as they become available.';
        tone = 'professional';
    }

    return {
      id: this.generateId(),
      type: 'summary',
      content: this.applyStyle(content, config),
      tone,
      duration: this.estimateDuration(content),
      metadata: {
        timestamp: new Date(),
        confidence: 0.95,
      },
    };
  }

  /**
   * Generate a complete broadcast script
   */
  async generateBroadcastScript(
    trends: ElectionTrend[],
    analytics: LiveAnalytics,
    config: AnchorConfig,
    maxDuration: number = 120
  ): Promise<{
    script: string;
    segments: AnchorCommentary[];
    totalDuration: number;
  }> {
    const segments = await this.generateConversationalCommentary(trends, analytics, config);
    
    // Trim to max duration
    let currentDuration = 0;
    const trimmedSegments: AnchorCommentary[] = [];
    
    for (const segment of segments) {
      if (currentDuration + segment.duration > maxDuration) {
        break;
      }
      trimmedSegments.push(segment);
      currentDuration += segment.duration;
    }

    const script = trimmedSegments.map(s => s.content).join(' ');

    return {
      script,
      segments: trimmedSegments,
      totalDuration: currentDuration,
    };
  }

  /**
   * Select a random template from the given type
   */
  private selectTemplate(type: 'trend' | 'summary' | 'highlight' | 'analysis'): string {
    const templates = this.commentaryTemplates[type];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Fill template with data
   */
  private fillTemplate(template: string, data: Record<string, any>): string {
    let filled = template;
    for (const [key, value] of Object.entries(data)) {
      filled = filled.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return filled;
  }

  /**
   * Apply style based on configuration
   */
  private applyStyle(content: string, config: AnchorConfig): string {
    let styled = content;

    switch (config.pacing) {
      case 'slow':
        styled = styled.replace(/\./g, '. [PAUSE]');
        break;
      case 'fast':
        styled = styled.replace(/\./g, '.');
        break;
      case 'normal':
        styled = styled.replace(/\./g, '. ');
        break;
    }

    if (!config.includeNumbers) {
      styled = styled.replace(/\d+/g, 'several');
    }

    if (!config.includePercentages) {
      styled = styled.replace(/\d+%/g, 'a significant amount');
    }

    return styled;
  }

  /**
   * Determine tone based on trend and change
   */
  private determineTone(trend: string, change: number): 'professional' | 'urgent' | 'celebratory' | 'cautious' {
    if (Math.abs(change) > 10) return 'urgent';
    if (trend === 'rising' && change > 5) return 'celebratory';
    if (trend === 'falling' && change < -5) return 'cautious';
    return 'professional';
  }

  /**
   * Estimate speaking duration in seconds
   */
  private estimateDuration(content: string): number {
    // Average speaking rate: 150 words per minute
    const words = content.split(/\s+/).length;
    return Math.ceil((words / 150) * 60);
  }

  /**
   * Format number for speech
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)} million`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} thousand`;
    }
    return String(num);
  }

  /**
   * Generate opening statement
   */
  private generateOpening(analytics: LiveAnalytics): string {
    return `Good evening, I'm your AI election anchor. We're tracking ${this.formatNumber(analytics.totalVotes)} votes across ${analytics.totalConstituencies} constituencies, with ${analytics.constituenciesReporting} reporting so far.`;
  }

  /**
   * Select a transition phrase
   */
  private selectTransition(): string {
    return this.transitionPhrases[Math.floor(Math.random() * this.transitionPhrases.length)];
  }

  /**
   * Select a closing phrase
   */
  private selectClosing(): string {
    return this.closingPhrases[Math.floor(Math.random() * this.closingPhrases.length)];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get voice-ready text with SSML markers
   */
  async getVoiceReadyText(commentaries: AnchorCommentary[]): Promise<string> {
    let ssml = '<speak>';
    
    for (const commentary of commentaries) {
      ssml += `<p>${this.addSSMLMarkers(commentary.content, commentary.tone)}</p>`;
      ssml += '<break time="1s"/>';
    }
    
    ssml += '</speak>';
    return ssml;
  }

  /**
   * Add SSML markers for text-to-speech
   */
  private addSSMLMarkers(text: string, tone: string): string {
    let marked = text;

    switch (tone) {
      case 'urgent':
        marked = marked.replace(/([A-Z][^.!?]*)/g, '<emphasis level="strong">$1</emphasis>');
        marked = `<prosody rate="fast">${marked}</prosody>`;
        break;
      case 'celebratory':
        marked = `<prosody pitch="+10%">${marked}</prosody>`;
        break;
      case 'cautious':
        marked = `<prosody rate="slow">${marked}</prosody>`;
        break;
      default:
        marked = `<prosody rate="medium">${marked}</prosody>`;
    }

    // Replace pause markers
    marked = marked.replace(/\[PAUSE\]/g, '<break time="500ms"/>');

    // Emphasize numbers
    marked = marked.replace(/\d+/g, '<say-as interpret-as="number">$&</say-as>');

    // Emphasize percentages
    marked = marked.replace(/\d+%/g, '<say-as interpret-as="number">$&</say-as>');

    return marked;
  }

  /**
   * Generate commentary for specific constituency
   */
  async generateConstituencyCommentary(
    constituency: {
      name: string;
      votes: number;
      leadingCandidate: string;
      margin: number;
      status: 'counting' | 'complete';
    },
    config: AnchorConfig
  ): Promise<AnchorCommentary> {
    const statusText = constituency.status === 'complete' ? 'has completed counting' : 'is still counting';
    const content = `${constituency.name} ${statusText}. ${constituency.leadingCandidate} is leading with ${constituency.margin}% of the vote out of ${this.formatNumber(constituency.votes)} total votes counted.`;

    return {
      id: this.generateId(),
      type: 'summary',
      content: this.applyStyle(content, config),
      tone: constituency.status === 'complete' ? 'celebratory' : 'professional',
      duration: this.estimateDuration(content),
      metadata: {
        timestamp: new Date(),
        confidence: 0.95,
      },
    };
  }

  /**
   * Generate comparative commentary between two time periods
   */
  async generateComparativeCommentary(
    current: LiveAnalytics,
    previous: LiveAnalytics,
    config: AnchorConfig
  ): Promise<AnchorCommentary> {
    const voteChange = current.totalVotes - previous.totalVotes;
    const rateChange = current.votesPerMinute - previous.votesPerMinute;
    const marginChange = current.margin - previous.margin;

    let content = `Comparing our latest numbers with the previous update, we've seen ${this.formatNumber(voteChange)} additional votes counted. `;
    
    if (rateChange > 0) {
      content += `The counting pace has increased by ${this.formatNumber(rateChange)} votes per minute. `;
    } else if (rateChange < 0) {
      content += `The counting pace has decreased by ${this.formatNumber(Math.abs(rateChange))} votes per minute. `;
    }

    if (Math.abs(marginChange) > 0.5) {
      content += `The lead margin has ${marginChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(marginChange).toFixed(1)}%.`;
    }

    return {
      id: this.generateId(),
      type: 'analysis',
      content: this.applyStyle(content, config),
      tone: 'professional',
      duration: this.estimateDuration(content),
      metadata: {
        timestamp: new Date(),
        confidence: 0.9,
      },
    };
  }
}
