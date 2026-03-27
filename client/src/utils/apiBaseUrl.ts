const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';

export const normalizeApiBaseUrl = (baseUrl?: string | null): string => {
  const trimmed = String(baseUrl ?? '').trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_API_BASE_URL;
  if (/\/api\/v\d+$/i.test(trimmed)) return trimmed;
  if (/\/api$/i.test(trimmed)) return `${trimmed}/v1`;
  return `${trimmed}/api/v1`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
