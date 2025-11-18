import { apiGet, apiPost, apiPatch } from './api';

export type ReportTarget = 'user' | 'service' | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

export interface Report {
  id: string;
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reporter?: {
    id: string;
    full_name: string;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  status?: string;
  target_type?: string;
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

function buildQueryString(params: PaginationParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.pageSize !== undefined) searchParams.append('pageSize', params.pageSize.toString());
  if (params.status) searchParams.append('status', params.status);
  if (params.target_type) searchParams.append('target_type', params.target_type);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// Get reports (admin)
export async function getReports(params: PaginationParams = {}): Promise<PaginatedResponse<Report>> {
  // backend expects 1-based page for admin endpoints — callers should pass page accordingly
  const queryString = buildQueryString(params);
  const res = await apiGet<any>(`/api/v1/reports${queryString}`);

  // backend returns { data, meta: { total, page, pageSize, total_pages } }
  const meta = res.meta || {};
  return {
    data: res.data || [],
    metadata: {
      total: meta.total || 0,
      page: meta.page !== undefined ? meta.page : 0,
      pageSize: meta.pageSize || meta.page_size || 10,
      totalPages: meta.total_pages || 0,
    },
  };
}

export async function getReportById(id: string): Promise<Report & { targetDetails?: any }> {
  return apiGet(`/api/v1/reports/${id}`);
}

export async function updateReportStatus(id: string, status: string, admin_note?: string) {
  return apiPatch(`/api/v1/reports/admin/reports/${id}`, { status, admin_note });
}
