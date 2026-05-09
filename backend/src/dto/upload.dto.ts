import { z } from 'zod';

export const uploadSchema = z.object({
  body: z.object({
    electionId: z.string().optional(),
    constituencyId: z.string().optional(),
  }),
});

export const getUploadsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
    status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    electionId: z.string().optional(),
  }),
});

export const validateUploadSchema = z.object({
  body: z.object({
    fileId: z.string(),
  }),
});

export const confirmImportSchema = z.object({
  body: z.object({
    fileId: z.string(),
    electionId: z.string().optional(),
    constituencyId: z.string().optional(),
  }),
});

export type UploadDto = z.infer<typeof uploadSchema>['body'];
export type GetUploadsDto = z.infer<typeof getUploadsSchema>['query'];
export type ValidateUploadDto = z.infer<typeof validateUploadSchema>['body'];
export type ConfirmImportDto = z.infer<typeof confirmImportSchema>['body'];
