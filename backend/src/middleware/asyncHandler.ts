import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncHandler<Req extends Request = Request, Res extends Response = Response> = (
  req: Req,
  res: Res,
  next: NextFunction,
) => Promise<unknown> | unknown;

export function asyncHandler(handler: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
