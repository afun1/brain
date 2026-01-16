import { z } from 'zod';
import { insertProgramSchema, programs, sleepStages } from './schema';

export const api = {
  programs: {
    list: {
      method: 'GET' as const,
      path: '/api/programs',
      responses: {
        200: z.array(z.custom<typeof programs.$inferSelect & { stages: typeof sleepStages.$inferSelect[] }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/programs/:id',
      responses: {
        200: z.custom<typeof programs.$inferSelect & { stages: typeof sleepStages.$inferSelect[] }>(),
        404: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
