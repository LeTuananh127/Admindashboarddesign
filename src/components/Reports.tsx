import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getReports, getReportById, updateReportStatus, type Report } from '../lib/reports.api';
import { getJobDetail, getServiceImages } from '../lib/jobs.api';
import { apiGet } from '../lib/api';
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
  const [serviceImageUrls, setServiceImageUrls] = useState<string[]>([]);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningText, setWarningText] = useState('');
  const [warningReport, setWarningReport] = useState<any | null>(null);
  const [warningSending, setWarningSending] = useState(false);
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
        // images will be loaded by effect below
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

  // Whenever viewingTarget of type service changes, collect image URLs.
  useEffect(() => {
    let mounted = true;
    const loadServiceImages = async () => {
      setServiceImageUrls([]);
      if (!viewingTarget || viewingTarget.type !== 'service') return;
      const t = viewingTarget.details || {};
      console.debug('[Reports] viewingTarget.details', t);

      // First try the dedicated helper which may call multiple endpoints
      try {
        const svcId = t.id || t.job_id || t.jobId || viewingTarget.id || viewingTarget.details?.id;
        if (svcId) {
          console.debug('[Reports] calling getServiceImages for', svcId);
          const fetched = await getServiceImages(String(svcId));
          console.debug('[Reports] getServiceImages returned', fetched);
          if (Array.isArray(fetched) && fetched.length > 0) {
            if (mounted) {
              setServiceImageUrls(fetched);
              return;
            }
          }
        }
      } catch (err) {
        console.debug('[Reports] getServiceImages failed', err);
      }
      const urls: string[] = [];

      // helper to push if valid
      const pushUrl = (u: any) => {
        if (!u) return;
        if (typeof u === 'string' && u.startsWith('http')) urls.push(u);
      };

      // Common possible fields
      if (Array.isArray(t.image_urls)) {
        t.image_urls.forEach(pushUrl);
      }

      if (Array.isArray(t.images)) {
        t.images.forEach((it: any) => {
          if (typeof it === 'string') pushUrl(it);
          else if (it && it.url) pushUrl(it.url);
          else if (it && it.image_url) pushUrl(it.image_url);
          else if (it && it.id) urls.push(String(it.id));
        });
      }

      if (Array.isArray(t.service_images)) {
        t.service_images.forEach((it: any) => {
          if (typeof it === 'string') pushUrl(it);
          else if (it && it.url) pushUrl(it.url);
          else if (it && it.image_url) pushUrl(it.image_url);
          else if (it && it.image_id) urls.push(String(it.image_id));
        });
      }

      if (Array.isArray(t.image_ids)) {
        t.image_ids.forEach((id: any) => urls.push(String(id)));
      }

      // If we collected some raw ids (not full URLs), try to fetch their URLs from image endpoint
      const ids = urls.filter(u => !u.startsWith('http'));
      const finalUrls: string[] = urls.filter(u => u.startsWith('http'));
      console.debug('[Reports] candidate urls/ids before resolving:', urls, 'ids:', ids);
      for (const id of ids) {
        try {
          // try common image endpoint
          const resp: any = await apiGet(`/api/v1/images/${id}`);
          // resp might be { url } or { data: { url } } or string
          if (!mounted) return;
          if (!resp) continue;
          if (typeof resp === 'string' && resp.startsWith('http')) finalUrls.push(resp);
          else if (resp.url) finalUrls.push(resp.url);
          else if (resp.data && resp.data.url) finalUrls.push(resp.data.url);
          else if (resp.image_url) finalUrls.push(resp.image_url);
        } catch (e) {
          // ignore per-image errors
          console.debug('[Reports] failed to fetch image id', id, e);
        }
      }

      if (mounted) setServiceImageUrls(finalUrls);
    };

    loadServiceImages();
    return () => { mounted = false; };
  }, [viewingTarget]);

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

  const maskLast = (val: any, last = 3) => {
    if (!val) return '—';
    const s = String(val);
    const visible = s.slice(-last);
    const masked = s.length > last ? '*'.repeat(s.length - last) : '*'.repeat(s.length);
    return masked + visible;
  };

  const lowerOrDash = (v: any) => {
    if (v === undefined || v === null || v === '') return '—';
    return String(v).toLowerCase();
  };

  const renderStatusBadge = (s: string | undefined | null) => {
    const key = (s || '').toLowerCase();
    // Map known statuses to label + Badge variant (match ServicesManagement getStatusBadge)
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      // report statuses
      pending: { label: 'Chờ xử lý', variant: 'secondary' },
      reviewing: { label: 'Đang xem xét', variant: 'secondary' },
      resolved: { label: 'Đã xử lý', variant: 'outline' },
      rejected: { label: 'Bị từ chối', variant: 'destructive' },
      // user statuses
      active: { label: 'Hoạt động', variant: 'default' },
      banned: { label: 'Đã cấm', variant: 'destructive' },
      // service-like statuses (for consistency)
      open: { label: 'Đang mở', variant: 'default' },
      matched: { label: 'Đã ghép', variant: 'default' },
      completed: { label: 'Hoàn thành', variant: 'outline' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' },
      expired: { label: 'Hết hạn', variant: 'destructive' },
    };
    const entry = map[key];
    if (entry) return <Badge variant={entry.variant} className="w-28 justify-center">{entry.label}</Badge>;
    // fallback: show raw status capitalized inside a neutral badge
    return <Badge variant="outline" className="w-24 justify-center">{s ? String(s).toString() : '—'}</Badge>;
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
                <TableHead className="w-36 text-center">Trạng thái</TableHead>
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
                    <TableCell className="px-2">{lowerOrDash(r.id)}</TableCell>
                    <TableCell className="px-2">{lowerOrDash(r.target_id)}</TableCell>
                    <TableCell>{((r as any).targetDetails?.title ?? (r as any).targetDetails?.full_name) ?? r.target_type}</TableCell>
                    <TableCell>{r.reporter?.full_name || (r.reporter?.id || '').toUpperCase()}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{r.reason}</TableCell>
                    <TableCell className="text-center">{renderStatusBadge(r.status)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openReport(r.id)}>Xem</Button>
                        <Button variant="destructive" size="sm" onClick={() => {
                          // open warning dialog with prefilled text
                          const pre = `Người dùng bị cảnh báo vì lý do: ${r.reason || '...'}\nĐề nghị người dùng không lặp lại hành động đó!`;
                          setWarningText(pre);
                          setWarningReport(r);
                          setWarningOpen(true);
                        }}>Cảnh báo</Button>
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
              <div><strong>ID:</strong> {lowerOrDash(viewing.id)}</div>
              <div className="grid grid-cols-2 gap-3 items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-semibold">Loại</p>
                  <p className="capitalize">{viewing.target_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-semibold">ID Đối tượng</p>
                  <p className="font-mono">{lowerOrDash(viewing.target_id)}</p>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={() => fetchTargetDetails(viewing.target_type, viewing.target_id)}>Xem chi tiết đối tượng</Button>
              </div>

              {/* Hiển thị thông tin chi tiết của đối tượng (chỉ hiển thị tóm tắt tại đây).
                  Chi tiết đầy đủ sẽ mở trong dialog "Chi tiết đối tượng" khi người dùng nhấn "Xem chi tiết đối tượng". */}
              {viewing.targetDetails && (() => {
                const td = viewing.targetDetails as any;
                const name = td.title ?? td.full_name ?? td.name ?? '—';
                const status = td.status ?? '';
                return (
                  <div>
                    <strong className="text-base">Chi tiết đối tượng:</strong> <span className="text-lg">{name}</span>
                    {status && (
                      <span className="ml-2 text-sm text-muted-foreground">— Trạng thái: <span className="capitalize">{status}</span></span>
                    )}
                  </div>
                );
              })()}
              <div><strong>Người báo:</strong> {viewing.reporter?.full_name}</div>
              <div><strong>Lý do:</strong> {viewing.reason}</div>
              <div><strong>Mô tả:</strong> {viewing.description || 'Không có'}</div>
              <div><strong>Thời gian tạo:</strong> {viewing.created_at ? new Date(viewing.created_at).toLocaleString() : 'Không có'}</div>
              <div>
                <strong>Trạng thái:</strong>
                <span className="ml-2">{renderStatusBadge(viewing.status)}</span>
              </div>

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
                      <p>{lowerOrDash(t.id)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">User ID</p>
                      <p>{lowerOrDash(t.user_id ?? t.userId)}</p>
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
                  {serviceImageUrls.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mt-4 mb-2"><strong>Ảnh dịch vụ</strong></p>
                      <div className="grid grid-cols-3 gap-2">
                        {serviceImageUrls.map((u: string) => (
                          <img
                            key={u}
                            src={u}
                            alt="service"
                            className="w-full h-28 object-cover rounded-md cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setLightboxUrl(u)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            if (tType === 'user') {
              const avatar = t.avatar_url || t.user?.avatar_url || t.avatar || '';
              const fullName = t.full_name || t.name || t.title || '—';
              return (
                <div className="flex flex-col gap-6 items-start max-h-[70vh] overflow-auto text-lg py-2">
                  <div className="w-full md:w-36 flex flex-col items-center md:items-start">
                    <img src={avatar} alt={fullName} className="w-24 h-24 object-cover rounded-full border" />
                    <div className="mt-3 text-center md:text-left">
                      <div className="text-2xl font-semibold">{fullName}</div>
                      <div className="mt-1 text-xs font-mono text-muted-foreground"><span className="font-medium">ID đối tượng: </span>{lowerOrDash(t.id || t.user_id)}</div>
                    </div>
                  </div>

                  <div className="flex-1">
                    {t.status ? (
                      <div className="text-sm text-muted-foreground mb-3">
                        <div className="font-medium">Trạng thái:</div>
                        <div className="mt-1">{renderStatusBadge(t.status)}</div>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <div className="text-sm text-muted-foreground">Số điện thoại</div>
                        <div className="text-base">{maskLast(t.phone, 3)}</div>
                      </div>

                      <div className="flex flex-col">
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="text-base">{t.email || '—'}</div>
                      </div>

                      <div className="flex flex-col">
                        <div className="text-sm text-muted-foreground">CMND / CCCD</div>
                        <div className="text-base">{maskLast(t.citizen_id, 3)}</div>
                      </div>

                      <div className="flex flex-col">
                        <div className="text-sm text-muted-foreground">Ngày sinh</div>
                        <div className="text-base">{t.userDetail?.birth_date ? new Date(t.userDetail.birth_date).toLocaleDateString() : '—'}</div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Khu vực</div>
                        <div className="text-base">{t.region?.name || t.region || '—'}</div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Created at</div>
                        <div className="text-base">{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Updated at</div>
                        <div className="text-base">{t.updated_at ? new Date(t.updated_at).toLocaleString() : '—'}</div>
                      </div>
                    </div>

                    {t.qr_code && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">QR code</p>
                        <button onClick={() => setLightboxUrl(t.qr_code)} className="p-0 bg-transparent border-0 cursor-pointer">
                          <img src={t.qr_code} alt="qr" className="block border rounded-md w-28 h-28 object-contain" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // default: render as simple key/value list for other types
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

      {/* Warning dialog - send a text warning to the reported user's contact (UI only) */}
      <Dialog open={warningOpen} onOpenChange={() => { if (!warningSending) setWarningOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gửi cảnh báo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Nội dung cảnh báo sẽ gửi tới người dùng được báo cáo. Bạn có thể chỉnh sửa trước khi gửi.</p>
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="warningText">Nội dung cảnh báo</label>
              <textarea
                id="warningText"
                placeholder="Người dùng bị cảnh báo vì lý do: ... (chỉnh sửa nếu cần)"
                aria-label="Nội dung cảnh báo"
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                className="w-full h-32 p-2 border rounded-md resize-y"
              />
            </div>
            <div className="text-sm text-muted-foreground">Người nhận: <span className="font-mono">{warningReport?.target_id || warningReport?.reporter?.id || '—'}</span></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { if (!warningSending) { setWarningOpen(false); setWarningReport(null); } }}>Hủy</Button>
            <Button disabled={warningSending} onClick={async () => {
              try {
                setWarningSending(true);
                // TODO: call backend API to send warning if available. For now just log and show toast.
                console.debug('[Reports] send warning', { report: warningReport, text: warningText });
                await new Promise(res => setTimeout(res, 500));
                toast.success('Đã gửi cảnh báo');
                setWarningOpen(false);
                setWarningReport(null);
              } catch (e) {
                console.error('Failed to send warning', e);
                toast.error('Không gửi được cảnh báo');
              } finally {
                setWarningSending(false);
              }
            }}>Gửi cảnh báo</Button>
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