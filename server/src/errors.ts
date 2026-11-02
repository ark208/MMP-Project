// Re-export AppError as the canonical error class for the whole server.
// HttpError is an alias kept for backwards compatibility with the Phase-2 routes
// (trips, rides, chat, notifications). The remote's errorHandler uses
// `err instanceof AppError`, which now catches both.
export { AppError, sendSuccess, sendError } from './utils/response';
export { AppError as HttpError } from './utils/response';
