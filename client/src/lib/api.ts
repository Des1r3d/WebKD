/**
 * SyncHub API & Socket configuration
 * Hỗ trợ linh hoạt cả localhost lẫn truy cập qua mạng LAN (2 thiết bị: laptop + điện thoại)
 */

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

export const getSocketUrl = (): string => {
  return getApiBaseUrl();
};

export async function fetchApi<T = any>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<{ ok: boolean; status: number; data?: T; error?: any }> {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => null);

    return {
      ok: res.ok,
      status: res.status,
      data: json,
      error: !res.ok ? json : undefined,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: { message: err?.message || 'Network request failed' },
    };
  }
}
