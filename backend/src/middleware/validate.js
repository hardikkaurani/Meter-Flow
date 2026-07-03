// Zod request validation. Pass a schema for body/params/query; on success the
// parsed (typed, defaulted) values replace the originals.
import { HttpError } from './errorHandler.js';

export function validate({ body, params, query } = {}) {
  return (req, _res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (params) req.params = params.parse(req.params);
      if (query) req.query = query.parse(req.query);
      next();
    } catch (err) {
      const details = err.errors?.map((e) => ({ path: e.path.join('.'), message: e.message }));
      next(new HttpError(400, 'Validation failed', details));
    }
  };
}

// Wrap async controllers so thrown errors reach the error handler without
// every handler needing its own try/catch.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
