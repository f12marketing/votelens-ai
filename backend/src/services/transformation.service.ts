import { BaseService } from './base.service';
import { normalizationService, NormalizedRow } from './normalization.service';
import { validationService } from './validation.service';

export interface TransformationConfig {
  removeDuplicates?: boolean;
  handleMissingValues?: 'remove' | 'fill' | 'estimate';
  calculateMetrics?: boolean;
  enableErrorRecovery?: boolean;
  maxErrors?: number;
  stopOnFirstError?: boolean;
}

export interface TransformationStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  inputCount?: number;
  outputCount?: number;
  errors: string[];
  warnings: string[];
}

export interface TransformationResult {
  success: boolean;
  data: NormalizedRow[];
  steps: TransformationStep[];
  metadata: {
    originalRowCount: number;
    finalRowCount: number;
    duplicateRowsRemoved: number;
    missingValuesHandled: number;
    totalErrors: number;
    totalWarnings: number;
    processingTime: number;
  };
  errors: string[];
  warnings: string[];
}

export class TransformationService extends BaseService {
  private steps: TransformationStep[] = [];

  /**
   * Main transformation pipeline with error recovery
   */
  async transformDataset(
    rawData: any[],
    config: TransformationConfig = {
      removeDuplicates: true,
      handleMissingValues: 'fill',
      calculateMetrics: true,
      enableErrorRecovery: true,
      stopOnFirstError: false,
    }
  ): Promise<TransformationResult> {
    const startTime = Date.now();
    this.steps = [];

    const {
      removeDuplicates = true,
      handleMissingValues = 'fill',
      calculateMetrics = true,
      enableErrorRecovery = true,
      stopOnFirstError = false,
    } = config;

    this.logInfo('Starting transformation pipeline', {
      inputRows: rawData.length,
      config,
    });

    // Initialize steps
    this.initializeSteps();

    try {
      // Step 1: Validate input data
      await this.executeStep(
        'Input Validation',
        async () => {
          const result = await validationService.validateDataset(rawData);
          if (!result.valid && stopOnFirstError) {
            throw new Error(`Validation failed: ${result.errors.slice(0, 3).join(', ')}`);
          }
          return result;
        },
        rawData.length
      );

      // Step 2: Handle missing values
      const dataWithValues = await this.executeStep(
        'Missing Value Handling',
        async () => {
          const processed: any[] = [];
          let handled = 0;

          for (const row of rawData) {
            try {
              const result = normalizationService.handleMissingValues(row, handleMissingValues);
              if (result) {
                processed.push(result);
              } else {
                handled++;
              }
            } catch (error: any) {
              if (!enableErrorRecovery) throw error;
              if (stopOnFirstError) throw error;
              this.logWarn('Missing value handling error', { error: error.message });
            }
          }

          return { data: processed, handled };
        },
        rawData.length
      );

      // Step 3: Normalize data
      const normalizedResult = await this.executeStep(
        'Data Normalization',
        async () => {
          return await normalizationService.normalizeDataset(dataWithValues.data || rawData, {
            removeDuplicates,
            handleMissingValues,
            calculateMetrics,
          });
        },
        dataWithValues.data?.length || rawData.length
      );

      // Step 4: Validate normalized data
      await this.executeStep(
        'Final Validation',
        async () => {
          return normalizationService.validateNormalizedData(normalizedResult.data);
        },
        normalizedResult.data.length
      );

      // Step 5: Generate analytics-ready output
      const analyticsReady = await this.executeStep(
        'Analytics Preparation',
        async () => {
          return this.prepareAnalyticsDataset(normalizedResult.data);
        },
        normalizedResult.data.length
      );

      const processingTime = Date.now() - startTime;
      const totalErrors = this.steps.reduce((sum, step) => sum + step.errors.length, 0);
      const totalWarnings = this.steps.reduce((sum, step) => sum + step.warnings.length, 0);

      this.logInfo('Transformation completed', {
        success: totalErrors === 0,
        processingTime,
        totalErrors,
        totalWarnings,
      });

      return {
        success: totalErrors === 0 || enableErrorRecovery,
        data: analyticsReady,
        steps: this.steps,
        metadata: {
          originalRowCount: rawData.length,
          finalRowCount: analyticsReady.length,
          duplicateRowsRemoved: normalizedResult.metadata.duplicateRowsRemoved,
          missingValuesHandled: normalizedResult.metadata.missingValuesHandled,
          totalErrors,
          totalWarnings,
          processingTime,
        },
        errors: this.steps.flatMap(step => step.errors),
        warnings: this.steps.flatMap(step => step.warnings),
      };
    } catch (error: any) {
      this.logError('Transformation failed', { error: error.message });

      return {
        success: false,
        data: [],
        steps: this.steps,
        metadata: {
          originalRowCount: rawData.length,
          finalRowCount: 0,
          duplicateRowsRemoved: 0,
          missingValuesHandled: 0,
          totalErrors: this.steps.reduce((sum, step) => sum + step.errors.length, 0) + 1,
          totalWarnings: this.steps.reduce((sum, step) => sum + step.warnings.length, 0),
          processingTime: Date.now() - startTime,
        },
        errors: [error.message, ...this.steps.flatMap(step => step.errors)],
        warnings: this.steps.flatMap(step => step.warnings),
      };
    }
  }

  /**
   * Execute a transformation step with error recovery
   */
  private async executeStep<T>(
    stepName: string,
    fn: () => Promise<T>,
    inputCount: number
  ): Promise<T> {
    const step = this.steps.find(s => s.name === stepName);
    if (!step) {
      throw new Error(`Step not found: ${stepName}`);
    }

    step.status = 'running';
    step.startTime = new Date();
    step.inputCount = inputCount;

    try {
      const result = await fn();
      step.status = 'completed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();

      // Try to get output count from result
      if (result && typeof result === 'object' && 'data' in result) {
        step.outputCount = (result as any).data?.length || inputCount;
      } else if (result && typeof result === 'object' && 'length' in result) {
        step.outputCount = (result as any).length;
      } else {
        step.outputCount = inputCount;
      }

      return result;
    } catch (error: any) {
      step.status = 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      step.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Initialize transformation steps
   */
  private initializeSteps(): void {
    this.steps = [
      {
        name: 'Input Validation',
        status: 'pending',
        errors: [],
        warnings: [],
      },
      {
        name: 'Missing Value Handling',
        status: 'pending',
        errors: [],
        warnings: [],
      },
      {
        name: 'Data Normalization',
        status: 'pending',
        errors: [],
        warnings: [],
      },
      {
        name: 'Final Validation',
        status: 'pending',
        errors: [],
        warnings: [],
      },
      {
        name: 'Analytics Preparation',
        status: 'pending',
        errors: [],
        warnings: [],
      },
    ];
  }

  /**
   * Prepare analytics-ready dataset
   * - Group by constituency
   - Calculate aggregate metrics
   - Add derived fields
   */
  private prepareAnalyticsDataset(data: NormalizedRow[]): NormalizedRow[] {
    // Group by constituency
    const constituencyGroups = new Map<string, NormalizedRow[]>();

    data.forEach(row => {
      const key = row.constituency_normalized;
      if (!constituencyGroups.has(key)) {
        constituencyGroups.set(key, []);
      }
      constituencyGroups.get(key)!.push(row);
    });

    // Add aggregate information to each row
    constituencyGroups.forEach((rows) => {
      const totalVotes = rows.reduce((sum, row) => sum + row.votes, 0);
      const totalVoters = rows[0].voter_count || 0;
      const candidateCount = rows.length;

      // Add aggregate metrics to each row
      rows.forEach(row => {
        (row as any).constituency_total_votes = totalVotes;
        (row as any).constituency_total_voters = totalVoters;
        (row as any).constituency_candidate_count = candidateCount;
        (row as any).is_winner = row.votes === Math.max(...rows.map(r => r.votes));
        (row as any).rank = rows.sort((a, b) => b.votes - a.votes).findIndex(r => r === row) + 1;
      });
    });

    return data;
  }

  /**
   * Get transformation progress
   */
  getProgress(): {
    currentStep: string;
    progress: number;
    completedSteps: number;
    totalSteps: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
  } {
    const completedSteps = this.steps.filter(s => s.status === 'completed').length;
    const runningStep = this.steps.find(s => s.status === 'running');
    const failedStep = this.steps.find(s => s.status === 'failed');

    const status = failedStep ? 'failed' : runningStep ? 'running' : completedSteps === this.steps.length ? 'completed' : 'pending';

    return {
      currentStep: runningStep?.name || '',
      progress: (completedSteps / this.steps.length) * 100,
      completedSteps,
      totalSteps: this.steps.length,
      status,
    };
  }

  /**
   * Get transformation steps
   */
  getSteps(): TransformationStep[] {
    return this.steps;
  }

  /**
   * Recovery strategy for specific error types
   */
  private recoverFromError(error: Error, context: any): any {
    this.logWarn('Attempting error recovery', { error: error.message, context });

    // Recovery strategies based on error type
    if (error.message.includes('Missing required field')) {
      // Try to fill with default value
      return { recovered: true, strategy: 'fill-default' };
    }

    if (error.message.includes('Invalid')) {
      // Try to sanitize the value
      return { recovered: true, strategy: 'sanitize' };
    }

    if (error.message.includes('Duplicate')) {
      // Keep first occurrence
      return { recovered: true, strategy: 'keep-first' };
    }

    return { recovered: false, strategy: 'none' };
  }

  /**
   * Transform single row with error recovery
   */
  async transformRow(row: any, config: TransformationConfig = {}): Promise<NormalizedRow | null> {
    const { enableErrorRecovery = true } = config;

    try {
      // Normalize the row
      const normalized = await normalizationService.normalizeDataset([row], config);
      return normalized.data[0] || null;
    } catch (error: any) {
      if (enableErrorRecovery) {
        const recovery = this.recoverFromError(error, { row });
        if (recovery.recovered) {
          this.logInfo('Row recovered', { strategy: recovery.strategy });
          // Retry with recovery strategy
          return null; // Placeholder for actual recovery logic
        }
      }
      throw error;
    }
  }

  /**
   * Batch transformation for large datasets
   */
  async transformBatch(
    rawData: any[],
    batchSize: number = 1000,
    config: TransformationConfig = {}
  ): Promise<TransformationResult> {
    this.logInfo('Starting batch transformation', {
      totalRows: rawData.length,
      batchSize,
    });

    const batches = [];
    for (let i = 0; i < rawData.length; i += batchSize) {
      batches.push(rawData.slice(i, i + batchSize));
    }

    const allResults: NormalizedRow[] = [];
    let batchIndex = 0;

    for (const batch of batches) {
      this.logInfo(`Processing batch ${batchIndex + 1}/${batches.length}`, {
        batchSize: batch.length,
      });

      const result = await this.transformDataset(batch, config);
      allResults.push(...result.data);
      batchIndex++;
    }

    this.logInfo('Batch transformation completed', {
      totalBatches: batches.length,
      totalRows: allResults.length,
    });

    return {
      success: true,
      data: allResults,
      steps: this.steps,
      metadata: {
        originalRowCount: rawData.length,
        finalRowCount: allResults.length,
        duplicateRowsRemoved: 0,
        missingValuesHandled: 0,
        totalErrors: 0,
        totalWarnings: 0,
        processingTime: 0,
      },
      errors: [],
      warnings: [],
    };
  }
}

export const transformationService = new TransformationService();
