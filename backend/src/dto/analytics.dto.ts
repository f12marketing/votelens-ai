import { z } from 'zod';

export const getAnalyticsSchema = z.object({
  query: z.object({
    electionId: z.string().optional(),
    constituencyId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    metrics: z.array(z.string()).optional(),
  }),
});

export const getAdvancedAnalyticsSchema = z.object({
  query: z.object({
    electionId: z.string().optional(),
    constituencyId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    includePredictions: z.string().optional().transform((val) => val === 'true'),
    includeTrends: z.string().optional().transform((val) => val === 'true'),
  }),
});

export type GetAnalyticsDto = z.infer<typeof getAnalyticsSchema>['query'];
export type GetAdvancedAnalyticsDto = z.infer<typeof getAdvancedAnalyticsSchema>['query'];
