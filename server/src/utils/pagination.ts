import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Parses and sanitizes page and limit from query parameters.
 * Defaults: page = 1, limit = 20, max limit = 100.
 */
export function parsePagination(reqOrQuery: Request | any, defaultLimit = 20, maxLimit = 100): PaginationParams {
  const query = reqOrQuery?.query || reqOrQuery || {};
  const rawPage = parseInt(query.page as string, 10);
  const rawLimit = parseInt(query.limit as string, 10);

  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? defaultLimit : Math.min(rawLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Builds standard pagination metadata object
 */
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Formats a paginated collection response
 */
export function formatPaginated<T>(items: T[], total: number, page: number, limit: number): PaginatedResponse<T> {
  return {
    items,
    meta: buildPaginationMeta(total, page, limit),
  };
}

