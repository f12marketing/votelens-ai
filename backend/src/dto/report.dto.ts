import { z } from 'zod';

export const createReportSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.enum(['summary', 'detailed', 'custom']),
    format: z.enum(['pdf', 'csv', 'json']),
    electionId: z.string().optional(),
    constituencyId: z.string().optional(),
    parameters: z.record(z.any()).optional(),
  }),
});

export const getReportsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
    status: z.enum(['generating', 'ready', 'failed']).optional(),
    type: z.enum(['summary', 'detailed', 'custom']).optional(),
  }),
});

export type CreateReportDto = z.infer<typeof createReportSchema>['body'];
export type GetReportsDto = z.infer<typeof getReportsSchema>['query'];
