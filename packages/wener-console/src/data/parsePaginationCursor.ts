import { z, ZodError } from 'zod';

export function parsePaginationCursor(
  cursor: string | undefined | null,
  options?: {
    onError?: (err: any) => undefined | PaginationCursor;
  },
): PaginationCursor | undefined {
  if (!cursor) {
    return undefined;
  }

  // base64+json
  try {
    const o = JSON.parse(atob(cursor));
    return PaginationCursorSchema.parse(o);
  } catch (err) {
    if (options?.onError) {
      return options.onError(err);
    }
    if (err instanceof ZodError) {
      console.error(
        `parsePaginationCursor: (invalid cursor ${cursor})`,
        err.issues
          .map((v) => {
            return `${v.path.join('.')}: ${v.message}`;
          })
          .join('; '),
      );
    } else {
      console.error(`parsePaginationCursor: error while parsing cursor ${cursor}`, err);
    }
  }
}

type PaginationCursor = z.infer<typeof PaginationCursorSchema>;

const PaginationCursorSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(['asc', 'desc']).optional().default('asc'),
});
