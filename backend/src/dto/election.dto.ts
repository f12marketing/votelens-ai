import { z } from 'zod';

export const createElectionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    date: z.string().transform((val) => new Date(val)),
    status: z.enum(['upcoming', 'ongoing', 'completed']).optional(),
    region: z.string().min(1, 'Region is required'),
  }),
});

export const updateElectionSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    date: z.string().transform((val) => new Date(val)).optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed']).optional(),
    region: z.string().min(1).optional(),
  }),
});

export const getElectionsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
    status: z.enum(['upcoming', 'ongoing', 'completed']).optional(),
    region: z.string().optional(),
  }),
});

export type CreateElectionDto = z.infer<typeof createElectionSchema>['body'];
export type UpdateElectionDto = z.infer<typeof updateElectionSchema>['body'];
export type GetElectionsDto = z.infer<typeof getElectionsSchema>['query'];
