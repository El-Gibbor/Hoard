import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { HttpError } from '../utils/http-error';

export interface ErrorResponse {
  error: {
    message: string;
    details?: Record<string, string[]>;
  };
}

// Drops fields without messages so the response matches ErrorResponse exactly
const toFieldMessages = (fieldErrors: Record<string, string[] | undefined>): Record<string, string[]> =>
  Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1])),
  );

export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorResponse = { error: { message: `Route ${req.method} ${req.path} not found` } };
  res.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message } } satisfies ErrorResponse);
    return;
  }

  if (err instanceof z.ZodError) {
    const { formErrors, fieldErrors } = z.flattenError(err);
    res.status(400).json({
      error: {
        message: formErrors[0] ?? 'Validation failed',
        details: toFieldMessages(fieldErrors),
      },
    } satisfies ErrorResponse);
    return;
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { message: 'Invalid JSON body' } } satisfies ErrorResponse);
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } } satisfies ErrorResponse);
};
