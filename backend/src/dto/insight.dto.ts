import { z } from 'zod';

export const getInsightsSchema = z.object({
  query: z.object({
    electionId: z.string().optional(),
    constituencyId: z.string().optional(),
    type: z.enum(['prediction', 'trend', 'anomaly', 'recommendation']).optional(),
    page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  }),
});

export const generateInsightSchema = z.object({
  body: z.object({
    electionId: z.string(),
    constituencyId: z.string().optional(),
    type: z.enum(['prediction', 'trend', 'anomaly', 'recommendation']),
    parameters: z.record(z.any()).optional(),
  }),
});

export type GetInsightsDto = z.infer<typeof getInsightsSchema>['query'];
export type GenerateInsightDto = z.infer<typeof generateInsightSchema>['body'];
