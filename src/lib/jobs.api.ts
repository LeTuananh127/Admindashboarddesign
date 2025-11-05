// Jobs (Services) API endpoints
import { apiGet, apiDelete, apiPatch } from './api';

// Types
export type JobStatus = 'pending' | 'open' | 'matched' | 'completed' | 'cancelled' | 'expired';
export type JobVisibility = 'public' | 'private' | 'friends' | 'hidden';

export interface Job {
  id: string;
  user_id: string;
  title: string;
  description: string;
  region_code: string;
  place: string;
  preferred_start: string;
  time: number;
  slot: number;
  visibility: JobVisibility;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  skills?: Array<{
    id: string;
    name: string;
  }>;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  type?: JobStatus[];
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
  if (params.type && params.type.length > 0) {
    params.type.forEach(t => searchParams.append('type', t));
  }
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Lấy tất cả jobs (Admin only)
export async function getAllJobs(
  params: PaginationParams = {}
): Promise<PaginatedResponse<Job>> {
  try {
    const queryString = buildQueryString(params);
    return await apiGet<PaginatedResponse<Job>>(`/api/v1/jobs/admin/all-job${queryString}`);
  } catch (error) {
    console.error('Failed to fetch all jobs:', error);
    throw error;
  }
}

// Lấy chi tiết một job
export async function getJobDetail(jobId: string): Promise<Job> {
  try {
    return await apiGet<Job>(`/api/v1/jobs/${jobId}`);
  } catch (error) {
    console.error(`Failed to fetch job ${jobId}:`, error);
    throw error;
  }
}

// Block job (Admin only)
export async function blockJob(jobId: string): Promise<{ success: boolean }> {
  try {
    return await apiDelete<{ success: boolean }>(`/api/v1/jobs/${jobId}/block-job`);
  } catch (error) {
    console.error(`Failed to block job ${jobId}:`, error);
    throw error;
  }
}

// Unblock job (Admin only)
export async function unblockJob(jobId: string): Promise<{ success: boolean }> {
  try {
    return await apiPatch<{ success: boolean }>(`/api/v1/jobs/${jobId}/unblock-job`);
  } catch (error) {
    console.error(`Failed to unblock job ${jobId}:`, error);
    throw error;
  }
}

// Lấy jobs của community (feed)
export async function getCommunityJobs(
  params: PaginationParams = {}
): Promise<PaginatedResponse<Job>> {
  try {
    const queryString = buildQueryString(params);
    return await apiGet<PaginatedResponse<Job>>(`/api/v1/jobs${queryString}`);
  } catch (error) {
    console.error('Failed to fetch community jobs:', error);
    throw error;
  }
}
