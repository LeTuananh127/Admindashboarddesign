import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getReports, getReportById, updateReportStatus, type Report } from '../lib/reports.api';
import { getJobDetail } from '../lib/jobs.api';
import { getUserDetail } from '../lib/users.api';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

export function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [viewing, setViewing] = useState<any | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [viewingTarget, setViewingTarget] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTarget, setFilterTarget] = useState<string>('all');

  const load = async (page = 0) => {
    setLoading(true);
    try {
      // Backend expects 1-based page
      const params: any = { page: page + 1, pageSize };
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
      if (filterTarget && filterTarget !== 'all') params.target_type = filterTarget;

      const res = await getReports(params);
      // apply client-side search on returned page
      let items = res.data;
      if (searchTerm && searchTerm.trim().length > 0) {
        const q = searchTerm.trim().toLowerCase();
        items = items.filter((r: any) => {
          const reporterName = r.reporter?.full_name ?? '';
          const reporterId = r.reporter?.id ?? '';
          const reportId = r.id ?? '';
          const td = (r as any).targetDetails;
          const targetTitle = td?.title ?? td?.full_name ?? '';
          return (
            r.reason?.toLowerCase().includes(q) ||
            reporterName.toLowerCase().includes(q) ||
            reporterId.toLowerCase().includes(q) ||
            reportId.toLowerCase().includes(q) ||
            (r.target_id || '').toLowerCase().includes(q) ||
            targetTitle.toLowerCase().includes(q)
          );
      });
      }

      setReports(items);
      setTotalReports(res.metadata.total);
      setTotalPages(res.metadata.totalPages);
      setCurrentPage(Math.max(0, res.metadata.page - 1));
    } catch (e) {
      console.error('Failed to load reports', e);
      toast.error('Không thể tải báo cáo');
      setReports([]);
      setTotalReports(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

  // debounce search & filter changes (500ms)
  useEffect(() => {
    const t = setTimeout(() => load(0), 500);
    return () => clearTimeout(t);
  }, [searchTerm, filterStatus, filterTarget]);

  const openReport = async (id: string) => {
    try {
      const data = await getReportById(id);
      setViewing(data);
    } catch (e) {
      toast.error('Không thể tải chi tiết báo cáo');
    }
  };

  const fetchTargetDetails = async (targetType: string, targetId: string) => {
    try {
      if (!targetId) return toast.error('Không có ID đối tượng');
      if (targetType === 'service') {
        const svc = await getJobDetail(targetId);
        setViewingTarget({ type: 'service', details: svc });
        return;
      }

      if (targetType === 'user') {
        const user = await getUserDetail(targetId);
        setViewingTarget({ type: 'user', details: user });
        return;
      }

      // fallback: try to use existing viewing.targetDetails if present
      if (viewing?.targetDetails) {
        setViewingTarget({ type: targetType, details: viewing.targetDetails });
        return;
      }

      toast.error('Không tìm thấy thông tin chi tiết cho đối tượng');
    } catch (err) {
      console.error('Failed to fetch target details', err);
      toast.error('Không thể tải chi tiết đối tượng');
    }
  };

  // no explicit submit; search is debounced above

  const markResolved = async (id: string) => {
    try {
      await updateReportStatus(id, 'resolved');
      toast.success('Đã cập nhật trạng thái');
      load(currentPage);
    } catch (e) {
      console.error(e);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl mb-2">Báo cáo</h2>
        <p className="text-muted-foreground">Danh sách báo cáo từ người dùng</p>
      </div>

      {/* Search & filters: match ServicesManagement UI */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm: tiêu đề, địa điểm, tags, ID, người báo, tên đối tượng"
            aria-label="Tìm kiếm báo cáo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={(v: string) => setFilterStatus(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">pending</SelectItem>
            <SelectItem value="reviewing">reviewing</SelectItem>
            <SelectItem value="resolved">resolved</SelectItem>
            <SelectItem value="rejected">rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTarget} onValueChange={(v: string) => setFilterTarget(v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="user">user</SelectItem>
            <SelectItem value="service">service</SelectItem>
            <SelectItem value="other">other</SelectItem>
          </SelectContent>
        </Select>
        </div>

      {loading ? (
        <div className="p-8 text-center">Đang tải báo cáo...</div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-28 px-2">ID</TableHead>
                <TableHead className="w-36">ID Đối tượng</TableHead>
                <TableHead className="w-48">Đối tượng</TableHead>
                <TableHead>Người báo</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead className="w-28">Trạng thái</TableHead>
                <TableHead className="w-36 text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">Không có báo cáo</TableCell>
                </TableRow>
              ) : (
                reports.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="px-2">{(r.id || '').toUpperCase()}</TableCell>
                    <TableCell className="px-2">{(r.target_id || '').toUpperCase()}</TableCell>
                    <TableCell>{((r as any).targetDetails?.title ?? (r as any).targetDetails?.full_name) ?? r.target_type}</TableCell>
                    <TableCell>{r.reporter?.full_name || (r.reporter?.id || '').toUpperCase()}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{r.reason}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openReport(r.id)}>Xem</Button>
                        <Button variant="destructive" size="sm" onClick={() => markResolved(r.id)}>Đã xử lý</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">Hiển thị {reports.length} trong tổng {totalReports} báo cáo</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => load(currentPage - 1)} disabled={currentPage === 0}>Trước</Button>
            <span className="text-sm">Trang {currentPage + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => load(currentPage + 1)} disabled={currentPage >= totalPages - 1}>Sau</Button>
          </div>
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo</DialogTitle>
          </DialogHeader>
              {viewing && (
            <div className="space-y-4">
              <div><strong>ID:</strong> {(viewing.id || '').toUpperCase()}</div>
              <div className="grid grid-cols-2 gap-3 items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Loại</p>
                  <p className="font-semibold capitalize">{viewing.target_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-semibold">ID Đối tượng</p>
                  <p className="font-mono">{(viewing.target_id || '').toUpperCase()}</p>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={() => fetchTargetDetails(viewing.target_type, viewing.target_id)}>Xem chi tiết đối tượng</Button>
              </div>

              {/* Hiển thị thông tin chi tiết của đối tượng (user hoặc service) nếu backend trả về */}
              {viewing.targetDetails && (
                (() => {
                  const td = viewing.targetDetails as any;
                  const name = td.title ?? td.full_name ?? td.name ?? '—';
                  const status = td.status ?? '';
                  return (
                    <div>
                      <strong>Chi tiết đối tượng:</strong> {name}
                      {status && (
                        <span className="ml-2 text-sm text-muted-foreground">— Trạng thái: <span className="capitalize">{status}</span></span>
                      )}
                    </div>
                  );
                })()
              )}
              <div><strong>Người báo:</strong> {viewing.reporter?.full_name}</div>
              <div><strong>Lý do:</strong> {viewing.reason}</div>
              <div><strong>Mô tả:</strong> {viewing.description || 'Không có'}</div>
              <div><strong>Thời gian tạo:</strong> {viewing.created_at ? new Date(viewing.created_at).toLocaleString() : 'Không có'}</div>
              <div><strong>Trạng thái:</strong> {viewing.status}</div>

              {/* Hiển thị ảnh đính kèm nếu có */}
              {(() => {
                const attachments = viewing.attachments;
                let imageUrls: string[] = [];
                if (Array.isArray(attachments)) {
                  imageUrls = attachments as string[];
                } else if (attachments && attachments.image_urls && Array.isArray(attachments.image_urls)) {
                  imageUrls = attachments.image_urls;
                }

                if (imageUrls.length === 0) return null;

                return (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2"><strong>Ảnh đính kèm</strong></p>
                    <div className="grid grid-cols-3 gap-2">
                      {imageUrls.map((u: string) => (
                        <img
                          key={u}
                          src={u}
                          alt="attachment"
                          className="w-full h-24 object-cover rounded-md cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setLightboxUrl(u)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewing(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog to show full target details */}
      <Dialog open={!!viewingTarget} onOpenChange={() => setViewingTarget(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đối tượng</DialogTitle>
          </DialogHeader>
          {viewingTarget && (() => {
            const tType = viewingTarget.type;
            const t = viewingTarget.details || {};
            if (tType === 'service') {
              const title = t.title ?? t.name ?? t.job_title ?? '—';
              const place = t.place ?? t.location ?? t.address ?? '—';
              const region = t.region_code ?? t.region ?? 'N/A';
              const preferredStart = t.preferred_start ?? t.start_time ?? null;
              const timeVal = t.time ?? t.duration ?? null;
              const slotVal = t.slot ?? null;
              const visibilityVal = t.visibility ?? t.visibility_type ?? t.show ?? null;
              const statusVal = t.status ?? t.job_status ?? '—';
              const tagsArr: string[] = Array.isArray(t.tags)
                ? t.tags
                : Array.isArray(t.skills)
                ? t.skills.map((s: any) => s.name).filter(Boolean)
                : [];

              return (
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ID</p>
                      <p>{t.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">User ID</p>
                      <p>{t.user_id ?? t.userId ?? '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 font-semibold">Tiêu đề</p>
                    <p>{title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
                    <p>{t.description || 'Không có mô tả'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Mã vùng</p>
                      <p>{region}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Địa điểm</p>
                      <p>{place}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Thời gian bắt đầu ưu tiên</p>
                      <p>{preferredStart ? new Date(preferredStart).toLocaleString('vi-VN') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Thời gian</p>
                      <p>{timeVal ? `${timeVal} phút` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Slot</p>
                      <p>{slotVal ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hiển thị</p>
                      <Badge variant="outline">{visibilityVal === 'public' ? 'Công khai' : 'Riêng tư'}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                      <p className="capitalize">{statusVal}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {tagsArr.length > 0 ? (
                        tagsArr.map((tag: string) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Không có tags</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Ngày tạo</p>
                      <p>{t.created_at ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cập nhật lần cuối</p>
                      <p>{t.updated_at ?? '—'}</p>
                    </div>
                  </div>
                </div>
              );
            }

            // default: render as simple key/value list for user or other types
            return (
              <div className="space-y-2 max-h-[60vh] overflow-auto">
                {Object.entries(t).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <div className="w-40 text-muted-foreground"><strong>{k}:</strong></div>
                    <div className="flex-1 break-words">{typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}</div>
                  </div>
                ))}
              </div>
            );
          })()}
          <DialogFooter>
            <Button onClick={() => setViewingTarget(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox dialog for enlarged image */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="w-full flex items-center justify-center bg-black">
            {lightboxUrl && (
              <img src={lightboxUrl} alt="enlarged" className="w-full max-h-[80vh] object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Reports;
