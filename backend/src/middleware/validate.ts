import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';

interface ValidateOpts {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(opts: ValidateOpts): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (opts.body) {
        req.body = opts.body.parse(req.body);
      }
      if (opts.query) {
        const parsedQuery = opts.query.parse(req.query);
        // Express's typing for `req.query` is intentionally restrictive; we
        // re-assign here because consumers expect typed/coerced output.
        (req as unknown as { query: unknown }).query = parsedQuery;
      }
      if (opts.params) {
        const parsedParams = opts.params.parse(req.params);
        (req as unknown as { params: unknown }).params = parsedParams;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
