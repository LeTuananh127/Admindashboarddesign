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

// Try to resolve image URLs for a job/service by id.
// Strategy:
// 1. Try admin endpoint `/api/v1/jobs/:id/images` (if backend provides it)
// 2. Try listing images by query `/api/v1/images?job_id=:id`
// 3. Fallback to `getJobDetail` and extract common fields (`image_urls`, `images`, `service_images`, `image_ids`)
// 4. If only image ids are available, attempt to fetch `/api/v1/images/:id` for each id to get a URL
export async function getServiceImages(jobId: string): Promise<string[]> {
  const urls: string[] = [];
  const pushIfUrl = (u: any) => { if (u && typeof u === 'string' && u.startsWith('http')) urls.push(u); };
  // 1) try job images endpoint
  try {
    const resp: any = await apiGet(`/api/v1/jobs/${jobId}/images`);
    console.debug('[jobs.api] /jobs/:id/images response', resp);
    if (resp) {
      if (Array.isArray(resp.image_urls) && resp.image_urls.length > 0) {
        resp.image_urls.forEach(pushIfUrl);
      }
      if (Array.isArray(resp.images) && resp.images.length > 0) {
        resp.images.forEach((it: any) => {
          if (typeof it === 'string') pushIfUrl(it);
          else if (it && it.url) pushIfUrl(it.url);
          else if (it && it.image_url) pushIfUrl(it.image_url);
        });
      }
      if (urls.length > 0) return urls;
    }
  } catch (e) {
    console.debug('[jobs.api] /jobs/:id/images not available or failed', e && (e as any).message ? (e as any).message : e);
  }

  // 2) try common images listing endpoints — try multiple query params and service-image endpoints
  const tryListEndpoints = [
    `/api/v1/images?job_id=${jobId}`,
    `/api/v1/images?service_id=${jobId}`,
    `/api/v1/service_images?service_id=${jobId}`,
    `/api/v1/service-images?service_id=${jobId}`,
    `/api/v1/service_images?job_id=${jobId}`,
    `/api/v1/service-image?service_id=${jobId}`,
  ];

  for (const ep of tryListEndpoints) {
    try {
      const listResp: any = await apiGet(ep);
      console.debug('[jobs.api] list images endpoint', ep, 'response', listResp);
      if (!listResp) continue;

      const tryExtract = (it: any) => {
        if (!it) return;
        if (typeof it === 'string') pushIfUrl(it);
        else if (it && it.url) pushIfUrl(it.url);
        else if (it && it.image_url) pushIfUrl(it.image_url);
        else if (it && it.image && it.image.url) pushIfUrl(it.image.url);
        else if (it && it.image && it.image.image_url) pushIfUrl(it.image.image_url);
        else if (it && it.image_id) urls.push(String(it.image_id));
        else if (it && it.imageId) urls.push(String(it.imageId));
      };

      if (Array.isArray(listResp.data)) {
        listResp.data.forEach(tryExtract);
      } else if (Array.isArray(listResp)) {
        listResp.forEach(tryExtract);
      } else if (Array.isArray((listResp as any).serviceImages)) {
        (listResp as any).serviceImages.forEach(tryExtract);
      } else if (Array.isArray((listResp as any).service_images)) {
        (listResp as any).service_images.forEach(tryExtract);
      } else if ((listResp as any).items && Array.isArray((listResp as any).items)) {
        (listResp as any).items.forEach(tryExtract);
      }

      if (urls.length > 0) return urls;
    } catch (e) {
      // 404 or other errors are acceptable — continue trying other endpoints
      console.debug('[jobs.api] list endpoint failed', ep, e && (e as any).message ? (e as any).message : e);
      continue;
    }
  }

  // 3) fallback to job detail extraction
  let job: any = null;
  try {
    job = await getJobDetail(jobId);
    console.debug('[jobs.api] getJobDetail response for', jobId, job);
    if (job) {
      if ((job as any).image_urls && Array.isArray((job as any).image_urls)) (job as any).image_urls.forEach(pushIfUrl);
      if ((job as any).images && Array.isArray((job as any).images)) (job as any).images.forEach((it: any) => {
        if (typeof it === 'string') pushIfUrl(it);
        else if (it && it.url) pushIfUrl(it.url);
        else if (it && it.image_url) pushIfUrl(it.image_url);
      });
      if ((job as any).service_images && Array.isArray((job as any).service_images)) (job as any).service_images.forEach((it: any) => {
        if (typeof it === 'string') pushIfUrl(it);
        else if (it && it.url) pushIfUrl(it.url);
        else if (it && it.image_url) pushIfUrl(it.image_url);
        else if (it && it.image_id) urls.push(String(it.image_id));
      });
      if ((job as any).image_ids && Array.isArray((job as any).image_ids)) (job as any).image_ids.forEach((id: any) => urls.push(String(id)));
    }
  } catch (e) {
    // ignore
  }

  // If nothing found yet, do a shallow recursive search for any http URLs inside the job object
  if (urls.length === 0) {
    try {
      const found = new Set<string>();
      const maxDepth = 5;
      const walk = (obj: any, depth = 0) => {
        if (!obj || depth > maxDepth) return;
        if (typeof obj === 'string') {
          if (obj.startsWith('http')) found.add(obj);
          return;
        }
        if (Array.isArray(obj)) {
          for (const it of obj) walk(it, depth + 1);
          return;
        }
        if (typeof obj === 'object') {
          // common patterns: { image: { url } }, { image_url }, { url }
          if (obj.url && typeof obj.url === 'string' && obj.url.startsWith('http')) found.add(obj.url);
          if (obj.image_url && typeof obj.image_url === 'string' && obj.image_url.startsWith('http')) found.add(obj.image_url);
          if (obj.image && obj.image.url && typeof obj.image.url === 'string' && obj.image.url.startsWith('http')) found.add(obj.image.url);
          if (obj.image && obj.image.image_url && typeof obj.image.image_url === 'string' && obj.image.image_url.startsWith('http')) found.add(obj.image.image_url);
          for (const k of Object.keys(obj)) {
            try { walk(obj[k], depth + 1); } catch (e) { /* ignore */ }
          }
        }
      };
      walk(job, 0);
      if (found.size > 0) {
        for (const u of found) pushIfUrl(u);
        console.debug('[jobs.api] extracted http URLs from job detail', Array.from(found));
      }
    } catch (e) {
      console.debug('[jobs.api] recursive extraction failed', e && (e as any).message ? (e as any).message : e);
    }
  }

  // 4) If we have numeric/string ids only, try to resolve them via image endpoint
  const idCandidates = urls.filter(u => !u.startsWith('http'));
  const finalUrls: string[] = urls.filter(u => u.startsWith('http'));
  for (const id of idCandidates) {
    try {
      const tryEndpoints = [`/api/v1/images/${id}`, `/api/v1/image/${id}`, `/api/v1/images?id=${id}`];
      let foundUrl: string | null = null;
      for (const ep of tryEndpoints) {
        try {
          const r: any = await apiGet(ep);
          if (!r) continue;
          console.debug('[jobs.api] image endpoint', ep, 'returned', r);
          const extract = (obj: any): string | null => {
            if (!obj) return null;
            if (typeof obj === 'string' && obj.startsWith('http')) return obj;
            if (obj.url && typeof obj.url === 'string' && obj.url.startsWith('http')) return obj.url;
            if (obj.image_url && typeof obj.image_url === 'string' && obj.image_url.startsWith('http')) return obj.image_url;
            if (obj.image && obj.image.url && typeof obj.image.url === 'string' && obj.image.url.startsWith('http')) return obj.image.url;
            if (obj.data && obj.data.url && typeof obj.data.url === 'string' && obj.data.url.startsWith('http')) return obj.data.url;
            if (obj.data && obj.data.attributes && obj.data.attributes.url && typeof obj.data.attributes.url === 'string' && obj.data.attributes.url.startsWith('http')) return obj.data.attributes.url;
            if (obj.attributes && obj.attributes.url && typeof obj.attributes.url === 'string' && obj.attributes.url.startsWith('http')) return obj.attributes.url;
            if (obj.data && obj.data.image && obj.data.image.url && typeof obj.data.image.url === 'string' && obj.data.image.url.startsWith('http')) return obj.data.image.url;
            if (obj.image && obj.image.data && obj.image.data.url && typeof obj.image.data.url === 'string' && obj.image.data.url.startsWith('http')) return obj.image.data.url;
            return null;
          };

          const candidate = extract(r) || extract(r.data) || extract(r.image) || extract(r.attributes) || (Array.isArray(r) ? (r[0] ? extract(r[0]) : null) : null);
          if (candidate) { foundUrl = candidate; break; }
        } catch (innerE) {
          // try next endpoint
          console.debug('[jobs.api] image endpoint failed', ep, innerE && (innerE as any).message ? (innerE as any).message : innerE);
          continue;
        }
      }
      if (foundUrl) finalUrls.push(foundUrl);
      else console.debug('[jobs.api] no url resolved for image id', id);
    } catch (e) {
      console.debug('[jobs.api] failed to resolve image id', id, e && (e as any).message ? (e as any).message : e);
    }
  }

  console.debug('[jobs.api] final resolved image urls', finalUrls);

  return finalUrls;
}
