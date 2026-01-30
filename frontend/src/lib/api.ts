const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type RequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

const buildUrl = (path: string) => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async <T>(path: string, options: RequestOptions): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    method: options.method,
    headers: {
      ...(options.method === 'POST' || options.method === 'PATCH'
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...getAuthHeader()
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (isJson && (payload?.message || payload?.error)) ||
      (typeof payload === 'string' && payload.trim()) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
};

export const get = async <T>(path: string): Promise<T> =>
  request<T>(path, { method: 'GET' });

export const post = async <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body });

export const patch = async <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, { method: 'PATCH', body });

export const del = async <T>(path: string): Promise<T> =>
  request<T>(path, { method: 'DELETE' });
