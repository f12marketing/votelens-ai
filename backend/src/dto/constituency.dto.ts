import { z } from 'zod';

export const createConstituencySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    region: z.string().min(1, 'Region is required'),
    voterCount: z.number().positive('Voter count must be positive'),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
});

export const updateConstituencySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    region: z.string().min(1).optional(),
    voterCount: z.number().positive().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
});

export const getConstituenciesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
    region: z.string().optional(),
    search: z.string().optional(),
  }),
});

export type CreateConstituencyDto = z.infer<typeof createConstituencySchema>['body'];
export type UpdateConstituencyDto = z.infer<typeof updateConstituencySchema>['body'];
export type GetConstituenciesDto = z.infer<typeof getConstituenciesSchema>['query'];
