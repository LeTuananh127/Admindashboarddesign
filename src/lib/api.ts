// API Configuration và base functions

const PRIMARY_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
// Tự tạo fallback nếu cổng chính không kết nối được (hữu ích khi backend đổi giữa 3000/3001)
const FALLBACK_API_BASE_URL = PRIMARY_API_BASE_URL.includes(':3001')
  ? PRIMARY_API_BASE_URL.replace(':3001', ':3000')
  : PRIMARY_API_BASE_URL.replace(':3000', ':3001');
const API_BASE_URLS = Array.from(new Set([PRIMARY_API_BASE_URL, FALLBACK_API_BASE_URL]));

interface ApiError {
  message: string;
  statusCode?: number;
}

// Get token từ localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Lưu token vào localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

// Xóa token
export const removeAuthToken = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('adminLoggedIn');
};

// Single refresh promise to deduplicate concurrent refresh attempts
let refreshingPromise: Promise<boolean> | null = null;

async function performRefresh(base: string): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${base}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json().catch(() => null);
    if (data && data.access_token) {
      setAuthToken(data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      try {
        // Notify app that tokens were refreshed so UI can update (or reload if a listener prefers)
        window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: { refreshedAt: Date.now() } }));
      } catch (_) {}
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Base fetch function với xử lý authentication
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  // Thử gọi lần lượt qua các base URL (primary -> fallback)
  let lastError: ApiError | null = null;
  for (const base of API_BASE_URLS) {
    try {
      // TEMP DEBUG: log which base URL and Authorization header are being used
      try {
        // eslint-disable-next-line no-console
        console.log(`[apiFetch] request -> ${base}${endpoint}`, { Authorization: headers['Authorization'] });
      } catch (_) {}
      const response = await fetch(`${base}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Đã xảy ra lỗi không xác định',
        }));

        // Nếu 401 (Unauthorized) xảy ra, thử refresh token (trừ khi đây là endpoint auth)
        const isAuthEndpoint = endpoint.startsWith('/api/v1/auth');
        if (response.status === 401 && !isAuthEndpoint) {
          // Try refresh once using the same base URL
          try {
            // Deduplicate concurrent refreshes
            if (!refreshingPromise) {
              refreshingPromise = (async () => {
                const ok = await performRefresh(base);
                return ok;
              })();
            }

            const refreshed = await refreshingPromise;
            // Clear the promise so future 401s can initiate another refresh if needed
            refreshingPromise = null;

            if (refreshed) {
              // Retry the original request once with new token
              const retryHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
              };
              const newToken = getAuthToken();
              if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;

              // Merge user-provided headers
              if (options.headers) {
                Object.entries(options.headers).forEach(([key, value]) => {
                  if (typeof value === 'string') retryHeaders[key] = value;
                });
              }

              const retryResp = await fetch(`${base}${endpoint}`, { ...config, headers: retryHeaders });
              if (retryResp.ok) {
                const data = await retryResp.json();
                return data as T;
              }
              // If retry failed, fall through to error handling below
            } else {
              // Refresh failed -> clear tokens to avoid repeated failing requests
              removeAuthToken();
            }
          } catch (e) {
            // Refresh attempt failed unexpectedly
            refreshingPromise = null;
            removeAuthToken();
          }

          lastError = {
            message: errorData.message || 'Unauthorized',
            statusCode: 401,
          } as ApiError;
          break;
        }

        // 404, 403, ... không phải lỗi kết nối -> trả lỗi luôn, không thử fallback tiếp
        lastError = {
          message: errorData.message || `HTTP error! status: ${response.status}`,
          statusCode: response.status,
        } as ApiError;
        break;
      }

      const data = await response.json();
      return data as T;
    } catch (e) {
      // Lỗi mạng (ERR_CONNECTION_REFUSED, CORS, ...) -> thử base URL tiếp theo
      lastError = {
        message: 'Không thể kết nối đến server',
        statusCode: 0,
      } as ApiError;
      continue;
    }
  }

  // Hết fallback vẫn lỗi
  throw lastError || ({ message: 'Không thể kết nối đến server', statusCode: 0 } as ApiError);
}

// GET request
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'GET' });
}

// POST request
export async function apiPost<T, D = unknown>(
  endpoint: string,
  data?: D
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// PUT request
export async function apiPut<T, D = unknown>(
  endpoint: string,
  data?: D
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// PATCH request
export async function apiPatch<T, D = unknown>(
  endpoint: string,
  data?: D
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// DELETE request
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'DELETE' });
}
