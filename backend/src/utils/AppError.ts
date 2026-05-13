export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message = 'Bad request', details?: unknown): AppError {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Not found'): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Conflict', details?: unknown): AppError {
    return new AppError(409, 'CONFLICT', message, details);
  }

  static pluginConfigInvalid(details?: unknown): AppError {
    return new AppError(422, 'PLUGIN_CONFIG_INVALID', 'Plugin config invalid', details);
  }

  static pluginNotFound(id: string): AppError {
    return new AppError(404, 'PLUGIN_NOT_FOUND', `Plugin not found: ${id}`);
  }
}
