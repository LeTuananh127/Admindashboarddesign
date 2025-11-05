// Auth API endpoints
import { apiPost } from './api';
import { setAuthToken, removeAuthToken } from './api';

// Types cho auth
export interface LoginRequest {
  fullname: string;
  password: string;
  deviceInfo?: string;
  ip?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    phone: string | null;
    full_name: string;
    status: string;
  };
  access_token: string;
  refresh_token: string;
  expires_in: string;
  firebase_token: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

// Login cho admin
export async function loginAdmin(
  credentials: LoginRequest
): Promise<LoginResponse> {
  try {
    const response = await apiPost<LoginResponse, LoginRequest>(
      '/api/v1/auth/admin/login',
      credentials
    );

    // Lưu tokens
    if (response.access_token) {
      setAuthToken(response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Refresh token
export async function refreshToken(
  refreshToken: string
): Promise<LoginResponse> {
  try {
    const response = await apiPost<LoginResponse, RefreshRequest>(
      '/api/v1/auth/refresh',
      { refresh_token: refreshToken }
    );

    if (response.access_token) {
      setAuthToken(response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      try {
        // After a manual refresh call, reload the app so UI state refreshes (components read new token)
        window.location.reload();
      } catch (_) {}
      try {
        window.location.reload();
      } catch (_) {}
    }

    return response;
  } catch (error) {
    console.error('Token refresh failed:', error);
    removeAuthToken();
    throw error;
  }
}

// Logout
export async function logout(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await apiPost<{ success: boolean }, RefreshRequest>('/api/v1/auth/logout', {
        refresh_token: refreshToken,
      });
    }
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    removeAuthToken();
  }
}

// Logout tất cả thiết bị
export async function logoutAll(): Promise<void> {
  try {
    await apiPost<{ success: boolean }>('/api/v1/auth/logout-all');
  } catch (error) {
    console.error('Logout all failed:', error);
  } finally {
    removeAuthToken();
  }
}
