# AI Architecture

## Gemini API Integration

### AI Service Architecture

```typescript
// src/services/ai.service.ts
import { VertexAI } from '@google-cloud/vertexai';

class AIService {
  private vertexAI: VertexAI;
  private model: string;
  
  constructor() {
    this.vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT!,
      location: process.env.GOOGLE_CLOUD_LOCATION!,
    });
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  }

  private async generateContent(prompt: string, context?: any): Promise<string> {
    const generativeModel = this.vertexAI.getGenerativeModel({
      model: this.model,
    });

    const request = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40,
      },
    };

    const result = await generativeModel.generateContent(request);
    return result.response.text();
  }

  async generateInsights(electionId: string): Promise<Insight[]> {
    const election = await this.electionService.getElection(electionId);
    const results = await this.analyticsService.getElectionResults(electionId);
    
    const prompt = this.buildInsightPrompt(election, results);
    const response = await this.generateContent(prompt);
    
    return this.parseInsights(response, electionId);
  }

  async analyzeConstituency(
    electionId: string,
    constituencyId: string
  ): Promise<ConstituencyAnalysis> {
    const constituency = await this.constituencyService.getConstituency(constituencyId);
    const results = await this.analyticsService.getConstituencyResults(constituencyId);
    
    const prompt = this.buildConstituencyPrompt(constituency, results);
    const response = await this.generateContent(prompt);
    
    return this.parseConstituencyAnalysis(response);
  }

  async processNaturalQuery(
    query: string,
    context: QueryContext
  ): Promise<QueryResponse> {
    const prompt = this.buildQueryPrompt(query, context);
    const response = await this.generateContent(prompt);
    
    return this.parseQueryResponse(response);
  }

  async compareElections(
    electionId1: string,
    electionId2: string
  ): Promise<ComparisonResult> {
    const election1 = await this.electionService.getElection(electionId1);
    const election2 = await this.electionService.getElection(electionId2);
    
    const prompt = this.buildComparisonPrompt(election1, election2);
    const response = await this.generateContent(prompt);
    
    return this.parseComparisonResult(response);
  }

  async predictTrends(electionId: string): Promise<TrendPrediction> {
    const election = await this.electionService.getElection(electionId);
    const historicalData = await this.analyticsService.getHistoricalData(electionId);
    
    const prompt = this.buildTrendPrompt(election, historicalData);
    const response = await this.generateContent(prompt);
    
    return this.parseTrendPrediction(response);
  }
}
```

## Prompt Engineering

### Insight Generation Prompt

```typescript
function buildInsightPrompt(election: Election, results: Result[]): string {
  return `
You are an expert election analyst. Analyze the following election data and generate actionable insights.

Election Details:
- Name: ${election.name}
- Type: ${election.electionType}
- Date: ${election.date}
- Country: ${election.country}
- Total Seats: ${election.totalSeats}

Results Summary:
${JSON.stringify(results, null, 2)}

Generate 5-7 insights covering:
1. Overall trends and patterns
2. Key winning factors
3. Regional variations
4. Demographic insights (if available)
5. Unexpected outcomes or anomalies
6. Historical comparisons (if applicable)
7. Future predictions

For each insight, provide:
- Type: (TREND, PREDICTION, ANOMALY, COMPARISON, DEMOGRAPHIC, GEOGRAPHIC)
- Title: Concise, descriptive title
- Content: Detailed explanation (2-3 paragraphs)
- Confidence: Score from 0-1
- Metadata: Supporting data points

Format as JSON array.
`;
}
```

### Natural Language Query Prompt

```typescript
function buildQueryPrompt(query: string, context: QueryContext): string {
  return `
You are a SQL and data analysis expert. Convert the natural language query into a structured response.

User Query: ${query}

Available Data Context:
- Elections: ${context.elections.map(e => e.name).join(', ')}
- Available metrics: voter turnout, vote counts, winning margins, demographic breakdowns
- Available dimensions: constituencies, candidates, parties, regions, time periods

Respond with:
1. Interpretation: What the user is asking for
2. SQL Query: The SQL query to answer the question (if applicable)
3. Visualization Type: Recommended chart type
4. Data Requirements: What data is needed
5. Response Format: How to present the results

Format as JSON.
`;
}
```

## AI Response Parsing

```typescript
// src/utils/ai-parser.ts
class AIParser {
  static parseInsights(response: string, electionId: string): Insight[] {
    try {
      const data = JSON.parse(response);
      return data.map((item: any) => ({
        id: generateId(),
        electionId,
        type: item.type,
        title: item.title,
        content: item.content,
        confidence: item.confidence,
        metadata: item.metadata,
        status: InsightStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (error) {
      throw new Error('Failed to parse AI insights');
    }
  }

  static parseQueryResponse(response: string): QueryResponse {
    try {
      const data = JSON.parse(response);
      return {
        interpretation: data.interpretation,
        sqlQuery: data.sqlQuery,
        visualizationType: data.visualizationType,
        dataRequirements: data.dataRequirements,
        responseFormat: data.responseFormat,
      };
    } catch (error) {
      throw new Error('Failed to parse query response');
    }
  }
}
```

## AI Caching Strategy

```typescript
// Cache AI responses to reduce API costs
class AICacheService {
  async getCachedInsights(electionId: string): Promise<Insight[] | null> {
    const key = `insights:${electionId}`;
    const cached = await this.cache.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheInsights(electionId: string, insights: Insight[]): Promise<void> {
    const key = `insights:${electionId}`;
    await this.cache.set(key, JSON.stringify(insights), '1h');
  }

  async getCachedQuery(queryHash: string): Promise<QueryResponse | null> {
    const key = `query:${queryHash}`;
    const cached = await this.cache.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheQuery(queryHash: string, response: QueryResponse): Promise<void> {
    const key = `query:${queryHash}`;
    await this.cache.set(key, JSON.stringify(response), '24h');
  }
}
```

## AI Cost Management

```typescript
// Track and limit AI API usage
class AIUsageTracker {
  async trackUsage(userId: string, tokens: number, cost: number): Promise<void> {
    await this.usageRepository.create({
      userId,
      tokens,
      cost,
      timestamp: new Date(),
    });
  }

  async checkLimits(userId: string): Promise<boolean> {
    const monthlyUsage = await this.usageRepository.getMonthlyUsage(userId);
    const userPlan = await this.userService.getPlan(userId);
    
    return monthlyUsage.tokens <= userPlan.maxTokens;
  }

  async getCostEstimate(prompt: string): Promise<number> {
    const tokenCount = this.estimateTokens(prompt);
    const costPerToken = 0.000001; // $1 per 1M tokens
    return tokenCount * costPerToken;
  }
}
```

## AI Quality Assurance

```typescript
// Validate AI-generated content
class AIValidator {
  static validateInsight(insight: Insight): ValidationResult {
    const errors: string[] = [];
    
    if (!insight.title || insight.title.length < 10) {
      errors.push('Title must be at least 10 characters');
    }
    
    if (!insight.content || insight.content.length < 50) {
      errors.push('Content must be at least 50 characters');
    }
    
    if (insight.confidence < 0 || insight.confidence > 1) {
      errors.push('Confidence must be between 0 and 1');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateQueryResponse(response: QueryResponse): ValidationResult {
    const errors: string[] = [];
    
    if (!response.interpretation) {
      errors.push('Interpretation is required');
    }
    
    if (response.sqlQuery && !this.isValidSQL(response.sqlQuery)) {
      errors.push('Invalid SQL query');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

## Background Job Processing

```typescript
// src/jobs/insight-generator.job.ts
export class InsightGeneratorJob {
  constructor(
    private aiService: AIService,
    private insightRepository: InsightRepository,
    private cacheService: AICacheService
  ) {}

  async process(electionId: string): Promise<void> {
    // Check cache first
    const cached = await this.cacheService.getCachedInsights(electionId);
    if (cached) {
      return;
    }

    // Generate insights
    const insights = await this.aiService.generateInsights(electionId);
    
    // Validate insights
    const validInsights = insights.filter(insight => 
      AIValidator.validateInsight(insight).isValid
    );
    
    // Store insights
    for (const insight of validInsights) {
      await this.insightRepository.create(insight);
    }
    
    // Cache results
    await this.cacheService.cacheInsights(electionId, validInsights);
  }
}
```

## AI Configuration

```typescript
// src/config/gemini.ts
export const geminiConfig = {
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
    topP: 0.8,
    topK: 40,
  },
  
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
};
```

## AI Error Handling

```typescript
class AIErrorHandler {
  static handleGeminiError(error: any): never {
    if (error.code === 'RESOURCE_EXHAUSTED') {
      throw new RateLimitError('AI rate limit exceeded');
    }
    
    if (error.code === 'INVALID_ARGUMENT') {
      throw new ValidationError('Invalid AI request');
    }
    
    if (error.code === 'PERMISSION_DENIED') {
      throw new AuthenticationError('AI authentication failed');
    }
    
    throw new AIServiceError('AI service error', error);
  }
}
```

## AI Monitoring

```typescript
// Track AI performance
class AIMetrics {
  static trackRequest(model: string, operation: string, duration: number): void {
    metrics.aiRequestDuration.observe({ model, operation }, duration);
    metrics.aiRequestsTotal.inc({ model, operation });
  }

  static trackTokensUsed(model: string, tokens: number): void {
    metrics.aiTokensUsed.inc({ model }, tokens);
  }

  static trackCost(model: string, cost: number): void {
    metrics.aiCost.inc({ model }, cost);
  }
}
```
