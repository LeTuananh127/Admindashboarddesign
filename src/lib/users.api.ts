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

// Lấy danh sách tất cả users (Admin only)
export async function getAllUsers(): Promise<User[]> {
  try {
    return await apiGet<User[]>('/api/v1/users');
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
