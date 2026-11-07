const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''; // empty → Vite proxy
const KEY = 'synchub.token';

export const tokenStore = {
  get: () => localStorage.getItem(KEY),
  set: (t: string) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, init: Omit<RequestInit, 'body'> & { body?: unknown } = {}): Promise<T> {
  const { body, headers, ...rest } = init;
  const token = tokenStore.get();
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    const e = data?.error;
    throw new ApiError(res.status, (typeof e === 'string' ? e : e?.message) ?? data?.message ?? res.statusText, e?.code ?? data?.code);
  }
  return data as T;
}

export const getSocketUrl = () => BASE || undefined;
