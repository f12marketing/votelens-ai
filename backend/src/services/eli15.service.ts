import { BaseService } from './base.service';

/**
 * Explain Like I'm 15 Service
 * Simplifies election analytics for common citizens using easy language and analogies
 */

interface ELI15Explanation {
  id: string;
  originalTopic: string;
  simplifiedExplanation: string;
  analogy: string;
  visualStory: string;
  keyPoints: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
  readingTime: number; // in minutes
}

interface AnalyticsData {
  metric: string;
  value: number;
  change?: number;
  context?: string;
}

interface ElectionData {
  electionName: string;
  totalVotes: number;
  voterTurnout: number;
  leadingCandidate: string;
  margin: number;
  constituencies: number;
}

export class ELI15Service extends BaseService {
  private analogyLibrary: Record<string, string[]> = {
    voting: [
      "Think of voting like choosing your favorite ice cream flavor - everyone gets to pick what they like best, and the most popular flavor wins!",
      "Voting is like picking teams for a school project - everyone gets a say in who they want to work with.",
      "Imagine voting is like choosing the class president - everyone casts their vote and the person with the most votes wins.",
    ],
    turnout: [
      "Voter turnout is like attendance at a party - not everyone invited shows up, but the more people who come, the better the party!",
      "Think of turnout like a sports game - when more fans show up, the atmosphere is more exciting and the result means more.",
      "Turnout is like homework submission - when more students turn in their work, the class average better represents everyone's knowledge.",
    ],
    margin: [
      "The winning margin is like the score difference in a basketball game - a close score means it was a tough match!",
      "Think of the margin like the gap between first and second place in a race - sometimes it's a close finish, sometimes it's a blowout.",
      "The margin is like the difference between test scores - a small difference means the competition was tight.",
    ],
    constituency: [
      "A constituency is like a school district - each area gets to vote for who represents them in the big decisions.",
      "Think of constituencies like different neighborhoods in a city - each one chooses its own local leader.",
      "Constituencies are like class sections - each one has its own representative who speaks for their group.",
    ],
    trends: [
      "Election trends are like fashion trends - they show which way people's opinions are moving over time.",
      "Think of trends like the weather forecast - they help predict what might happen next based on patterns.",
      "Trends are like your grades over time - they show if you're improving, staying the same, or need to work harder.",
    ],
    percentage: [
      "A percentage is like a slice of pizza - if you have 100 slices and eat 25, you've had 25% of the pizza!",
      "Think of percentages like a progress bar - 50% means you're halfway done, just like being halfway to your destination.",
      "Percentages are like a battery indicator - 75% means you have three-quarters of power remaining.",
    ],
    swing: [
      "A swing vote is like being undecided about which movie to watch - you might change your mind at the last minute!",
      "Think of swing voters as people who haven't picked a team yet - they could go either way depending on what they hear.",
      "Swing is like a pendulum - it can swing back and forth between different choices.",
    ],
  };

  private simpleLanguageRules = {
    maxSentenceLength: 15,
    maxWordSyllables: 3,
    avoidJargon: [
      'electorate',
      'demographics',
      'constituency',
      'marginal seat',
      'swing voter',
      'turnout rate',
      'projection',
      'extrapolation',
      'statistical significance',
      'margin of error',
    ],
    simpleReplacements: {
      'electorate': 'voters',
      'demographics': 'groups of people',
      'constituency': 'voting area',
      'marginal seat': 'close race',
      'swing voter': 'undecided voter',
      'turnout rate': 'how many people voted',
      'projection': 'prediction',
      'extrapolation': 'estimate',
      'statistical significance': 'important difference',
      'margin of error': 'possible mistake',
    },
  };

  /**
   * Simplify election analytics data
   */
  async simplifyAnalytics(data: AnalyticsData[]): Promise<ELI15Explanation> {
    const topic = this.identifyTopic(data);
    const explanation = this.generateSimpleExplanation(data);
    const analogy = this.selectAnalogy(topic);
    const visualStory = this.generateVisualStory(data);
    const keyPoints = this.extractKeyPoints(data);

    return {
      id: this.generateId(),
      originalTopic: topic,
      simplifiedExplanation: explanation,
      analogy,
      visualStory,
      keyPoints,
      difficultyLevel: 'easy',
      readingTime: this.estimateReadingTime(explanation),
    };
  }

  /**
   * Simplify election data for teenagers
   */
  async simplifyElectionData(election: ElectionData): Promise<ELI15Explanation> {
    const explanation = this.generateElectionExplanation(election);
    const analogy = this.selectAnalogy('voting');
    const visualStory = this.generateElectionVisualStory(election);
    const keyPoints = this.extractElectionKeyPoints(election);

    return {
      id: this.generateId(),
      originalTopic: election.electionName,
      simplifiedExplanation: explanation,
      analogy,
      visualStory,
      keyPoints,
      difficultyLevel: 'easy',
      readingTime: this.estimateReadingTime(explanation),
    };
  }

  /**
   * Simplify a complex concept
   */
  async simplifyConcept(concept: string, context?: string): Promise<ELI15Explanation> {
    const explanation = this.generateConceptExplanation(concept, context);
    const analogy = this.selectAnalogy(concept.toLowerCase());
    const visualStory = this.generateConceptVisualStory(concept);
    const keyPoints = this.extractConceptKeyPoints(concept);

    return {
      id: this.generateId(),
      originalTopic: concept,
      simplifiedExplanation: explanation,
      analogy,
      visualStory,
      keyPoints,
      difficultyLevel: 'easy',
      readingTime: this.estimateReadingTime(explanation),
    };
  }

  /**
   * Generate a step-by-step explanation
   */
  async generateStepByStepExplanation(process: string, steps: string[]): Promise<{
    simplifiedSteps: string[];
    analogy: string;
    visualStory: string;
  }> {
    const simplifiedSteps = steps.map(step => this.simplifyText(step));
    const analogy = this.selectAnalogy(process.toLowerCase());
    const visualStory = this.generateProcessVisualStory(process, simplifiedSteps);

    return {
      simplifiedSteps,
      analogy,
      visualStory,
    };
  }

  /**
   * Simplify text using simple language rules
   */
  private simplifyText(text: string): string {
    let simplified = text;

    // Replace jargon with simple terms
    for (const [jargon, replacement] of Object.entries(this.simpleLanguageRules.simpleReplacements)) {
      const regex = new RegExp(jargon, 'gi');
      simplified = simplified.replace(regex, replacement);
    }

    // Break long sentences
    const sentences = simplified.split('. ');
    const shortSentences = sentences.map(sentence => {
      const words = sentence.split(' ');
      if (words.length > this.simpleLanguageRules.maxSentenceLength) {
        const mid = Math.floor(words.length / 2);
        return words.slice(0, mid).join(' ') + '. ' + words.slice(mid).join(' ');
      }
      return sentence;
    });

    return shortSentences.join('. ');
  }

  /**
   * Identify the main topic from data
   */
  private identifyTopic(data: AnalyticsData[]): string {
    if (data.length === 0) return 'general';
    return data[0].metric.toLowerCase();
  }

  /**
   * Generate simple explanation from analytics data
   */
  private generateSimpleExplanation(data: AnalyticsData[]): string {
    if (data.length === 0) {
      return "Here's what the numbers are telling us in simple terms.";
    }

    let explanation = "Let me break this down for you: ";

    for (const item of data) {
      explanation += `${this.simplifyText(item.metric)} is ${this.formatNumber(item.value)}. `;
      
      if (item.change !== undefined) {
        if (item.change > 0) {
          explanation += `This went up by ${this.formatNumber(item.change)}, which is good news! `;
        } else if (item.change < 0) {
          explanation += `This went down by ${this.formatNumber(Math.abs(item.change))}, which means things changed. `;
        }
      }
    }

    return explanation;
  }

  /**
   * Generate election explanation
   */
  private generateElectionExplanation(election: ElectionData): string {
    const turnoutPercent = (election.voterTurnout * 100).toFixed(1);
    
    let explanation = `In the ${election.electionName}, ${this.formatNumber(election.totalVotes)} people voted. `;
    explanation += `That's ${turnoutPercent}% of all eligible voters - think of it like ${turnoutPercent} out of every 100 people showing up to vote. `;
    
    explanation += `${election.leadingCandidate} is currently winning by ${election.margin}%. `;
    explanation += `This means for every 100 votes cast, ${election.leadingCandidate} got about ${election.margin} more votes than the second-place candidate. `;
    
    explanation += `The results are coming from ${election.constituencies} different areas, like different neighborhoods voting for their local representative.`;

    return explanation;
  }

  /**
   * Select an analogy for a topic
   */
  private selectAnalogy(topic: string): string {
    const lowerTopic = topic.toLowerCase();
    
    for (const [key, analogies] of Object.entries(this.analogyLibrary)) {
      if (lowerTopic.includes(key)) {
        return analogies[Math.floor(Math.random() * analogies.length)];
      }
    }

    return "Think of this like keeping score in a game - the numbers help us see who's winning and by how much!";
  }

  /**
   * Generate visual story description
   */
  private generateVisualStory(data: AnalyticsData[]): string {
    if (data.length === 0) {
      return "Picture a simple bar chart showing the numbers going up or down, like steps on a staircase.";
    }

    let story = "Imagine a picture where: ";
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      story += `${this.simplifyText(item.metric)} is shown as a bar reaching ${this.formatNumber(item.value)} on the chart. `;
      
      if (i < data.length - 1) {
        story += "Next to it, ";
      }
    }

    return story;
  }

  /**
   * Generate election visual story
   */
  private generateElectionVisualStory(election: ElectionData): string {
    return `Picture a pie chart divided among candidates, with ${election.leadingCandidate}'s slice being ${election.margin}% bigger than the others. Imagine ${this.formatNumber(election.totalVotes)} people standing in a line, each one representing a voter. The line would stretch for miles!`;
  }

  /**
   * Generate concept visual story
   */
  private generateConceptVisualStory(concept: string): string {
    return `Imagine a simple diagram showing how ${this.simplifyText(concept)} works, with arrows pointing to the main parts and labels in big, clear letters.`;
  }

  /**
   * Generate process visual story
   */
  private generateProcessVisualStory(process: string, steps: string[]): string {
    return `Picture a flowchart with ${steps.length} boxes connected by arrows, each box showing one simple step of the process, like following a treasure map with clear directions.`;
  }

  /**
   * Extract key points from data
   */
  private extractKeyPoints(data: AnalyticsData[]): string[] {
    const keyPoints: string[] = [];

    for (const item of data) {
      keyPoints.push(`${this.simplifyText(item.metric)}: ${this.formatNumber(item.value)}`);
      
      if (item.change !== undefined && item.change !== 0) {
        const direction = item.change > 0 ? 'increased' : 'decreased';
        keyPoints.push(`It ${direction} by ${this.formatNumber(Math.abs(item.change))}`);
      }
    }

    return keyPoints;
  }

  /**
   * Extract election key points
   */
  private extractElectionKeyPoints(election: ElectionData): string[] {
    return [
      `${this.formatNumber(election.totalVotes)} total votes cast`,
      `${(election.voterTurnout * 100).toFixed(1)}% of people voted`,
      `${election.leadingCandidate} is leading`,
      `Lead is ${election.margin}%`,
      `${election.constituencies} areas reporting`,
    ];
  }

  /**
   * Extract concept key points
   */
  private extractConceptKeyPoints(concept: string): string[] {
    return [
      `${this.simplifyText(concept)} affects how elections work`,
      `It's important for fair voting`,
      `Understanding it helps you know your vote counts`,
    ];
  }

  /**
   * Generate concept explanation
   */
  private generateConceptExplanation(concept: string, context?: string): string {
    const simplifiedConcept = this.simplifyText(concept);
    
    let explanation = `Here's what ${simplifiedConcept} means in simple terms: `;
    explanation += `It's basically how elections make sure everyone's vote is counted fairly. `;
    
    if (context) {
      explanation += `In this case, ${this.simplifyText(context)}. `;
    }
    
    explanation += `Think of it like the rules for a fair game - everyone follows the same rules so the result is fair for everyone.`;

    return explanation;
  }

  /**
   * Format number for easy reading
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
   * Estimate reading time in minutes
   */
  private estimateReadingTime(text: string): number {
    const words = text.split(/\s+/).length;
    // Average reading speed: 200 words per minute for teenagers
    return Math.ceil(words / 200);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `eli15_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate quiz question for learning
   */
  async generateQuizQuestion(topic: string, explanation: string): Promise<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }> {
    const questions: Record<string, any> = {
      voting: {
        question: "Why is voting important?",
        options: [
          "Because everyone gets a say in who leads",
          "Because it's mandatory",
          "Because it's fun",
          "Because it's a holiday",
        ],
        correctAnswer: 0,
        explanation: "Voting lets everyone have a voice in choosing their leaders - it's like picking your class president where everyone gets to vote!",
      },
      turnout: {
        question: "What does voter turnout mean?",
        options: [
          "How many people won",
          "How many people voted",
          "How many people are registered",
          "How many people are watching",
        ],
        correctAnswer: 1,
        explanation: "Turnout is like attendance at a party - it shows how many people actually showed up to vote!",
      },
    };

    const quiz = questions[topic.toLowerCase()] || {
      question: `What did you learn about ${this.simplifyText(topic)}?`,
      options: [
        "It helps make elections fair",
        "It's not important",
        "Only for politicians",
        "Too complicated",
      ],
      correctAnswer: 0,
      explanation: explanation,
    };

    return quiz;
  }

  /**
   * Generate glossary entry for election terms
   */
  async generateGlossaryEntry(term: string): Promise<{
    term: string;
    simpleDefinition: string;
    example: string;
    relatedTerms: string[];
  }> {
    const glossary: Record<string, any> = {
      ballot: {
        simpleDefinition: "The paper or screen where you mark your choice when voting",
        example: "When you go to vote, you mark your choice on the ballot",
        relatedTerms: ['vote', 'election', 'polling station'],
      },
      constituency: {
        simpleDefinition: "A geographic area that elects one representative to make decisions",
        example: "Your neighborhood is part of a constituency that elects someone to speak for your area",
        relatedTerms: ['representative', 'district', 'voting area'],
      },
      turnout: {
        simpleDefinition: "The percentage of people who actually voted out of everyone who could have voted",
        example: "If 100 people could vote but only 70 did, the turnout is 70%",
        relatedTerms: ['voting', 'election', 'participation'],
      },
      margin: {
        simpleDefinition: "The difference in votes between the winner and the runner-up",
        example: "If Candidate A got 55 votes and Candidate B got 45 votes, the margin is 10 votes",
        relatedTerms: ['winner', 'votes', 'lead'],
      },
    };

    const entry = glossary[term.toLowerCase()] || {
      simpleDefinition: this.simplifyText(term),
      example: `This is an example of how ${this.simplifyText(term)} works in elections`,
      relatedTerms: [],
    };

    return {
      term,
      ...entry,
    };
  }

  /**
   * Generate interactive learning module
   */
  async generateLearningModule(topic: string): Promise<{
    title: string;
    introduction: string;
    sections: {
      heading: string;
      content: string;
      interactive: string;
    }[];
    quiz: any;
  }> {
    const sections = [
      {
        heading: `What is ${this.simplifyText(topic)}?`,
        content: this.simplifyText(`Let's learn about ${topic} in a way that's easy to understand.`),
        interactive: `Imagine ${this.selectAnalogy(topic.toLowerCase())}`,
      },
      {
        heading: "Why does it matter?",
        content: "This affects how your vote counts and how fair elections are. Understanding it helps you be a better voter!",
        interactive: "Think about how this would work in your school or community.",
      },
      {
        heading: "In simple terms",
        content: this.generateConceptExplanation(topic),
        interactive: "Can you think of a real-life example that's similar?",
      },
    ];

    const quiz = await this.generateQuizQuestion(topic, "");

    return {
      title: `Understanding ${this.simplifyText(topic)}`,
      introduction: "Welcome! Let's learn about this election concept in a way that's easy to understand.",
      sections,
      quiz,
    };
  }
}
