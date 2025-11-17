// Users API endpoints
import { apiGet, apiDelete, apiPatch } from './api';

// Types
export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  status: 'active' | 'suspended' | 'banned';
  created_at: string;
  updated_at: string;
}

export interface UserDetail {
  user_id: string;
  birth_date: string | null;
  description: string | null;
  work_address: string | null;
  study_address: string | null;
  social_network: Record<string, unknown> | null;
}

export interface UserWithDetail extends User {
  userDetail?: UserDetail;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: 'active' | 'suspended' | 'banned';
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Build query string từ pagination params
function buildQueryString(params: PaginationParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.pageSize !== undefined) searchParams.append('pageSize', params.pageSize.toString());
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  if (params.search) searchParams.append('search', params.search);
  if (params.status) searchParams.append('status', params.status);
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Lấy danh sách tất cả users (Admin only)
export async function getAllUsers(params: PaginationParams = {}): Promise<PaginatedResponse<User>> {
  try {
    const queryString = buildQueryString(params);
    return await apiGet<PaginatedResponse<User>>(`/api/v1/users${queryString}`);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

// Lấy thông tin chi tiết user
export async function getUserDetail(userId: string): Promise<UserWithDetail> {
  try {
    return await apiGet<UserWithDetail>(`/api/v1/users/${userId}`);
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    throw error;
  }
}

// Block user (Admin only)
export async function blockUser(userId: string): Promise<{ success: boolean }> {
  try {
    return await apiDelete<{ success: boolean }>(`/api/v1/users/${userId}/block-user`);
  } catch (error) {
    console.error(`Failed to block user ${userId}:`, error);
    throw error;
  }
}

// Unblock user (Admin only)
export async function unblockUser(userId: string): Promise<{ success: boolean }> {
  try {
    return await apiPatch<{ success: boolean }>(`/api/v1/users/${userId}/unblock-user`);
  } catch (error) {
    console.error(`Failed to unblock user ${userId}:`, error);
    throw error;
  }
}
