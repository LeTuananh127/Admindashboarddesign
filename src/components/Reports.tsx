import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
// Import API logic mới
import { getReports, getReportById, type Report, updateReportStatus } from '../lib/reports.api';
import { getJobDetail, getServiceImages } from '../lib/jobs.api';
import { apiGet, apiPatch } from '../lib/api'; 
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
  
  // Warning states
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
      const params: any = { page: page + 1, pageSize };
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
      if (filterTarget && filterTarget !== 'all') params.target_type = filterTarget;

      const res = await getReports(params);
      let items = res.data;
      
      // Client-side search logic
      if (searchTerm && searchTerm.trim().length > 0) {
        const q = searchTerm.trim().toLowerCase();
        items = items.filter((r: any) => {
          const reporterName = r.reporter?.full_name ?? '';
          const reporterId = r.reporter?.id ?? '';
          const reportId = r.id ?? '';
          const td = (r as any).targetDetails;
          const targetTitle = td?.title ?? td?.full_name ?? '';
          return (
            (r.reason?.toLowerCase() || '').includes(q) ||
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

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
      if (viewing?.targetDetails) {
        setViewingTarget({ type: targetType, details: viewing.targetDetails });
        return;
      }
      toast.error('Không tìm thấy thông tin chi tiết cho đối tượng');
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải chi tiết đối tượng');
    }
  };

  // Service Image Logic
  useEffect(() => {
    let mounted = true;
    const loadServiceImages = async () => {
      setServiceImageUrls([]);
      if (!viewingTarget || viewingTarget.type !== 'service') return;
      const t = viewingTarget.details || {};

      try {
        const svcId = t.id || t.job_id || t.jobId || viewingTarget.id || viewingTarget.details?.id;
        if (svcId) {
          const fetched = await getServiceImages(String(svcId));
          if (Array.isArray(fetched) && fetched.length > 0 && mounted) {
            setServiceImageUrls(fetched);
            return;
          }
        }
      } catch (err) { /* ignore */ }
      
      // Fallback extraction logic
      const urls: string[] = [];
      const pushUrl = (u: any) => {
        if (!u) return;
        if (typeof u === 'string' && u.startsWith('http')) urls.push(u);
      };

      if (Array.isArray(t.image_urls)) t.image_urls.forEach(pushUrl);
      if (Array.isArray(t.images)) {
        t.images.forEach((it: any) => {
          if (typeof it === 'string') pushUrl(it);
          else if (it && it.url) pushUrl(it.url);
          else if (it && it.image_url) pushUrl(it.image_url);
          else if (it && it.id) urls.push(String(it.id));
        });
      }
      // ... (các logic extract khác giữ nguyên)

      // Simplified fetching for raw IDs if needed
      const finalUrls: string[] = urls.filter(u => u.startsWith('http'));
      if (mounted) setServiceImageUrls(finalUrls);
    };
    loadServiceImages();
    return () => { mounted = false; };
  }, [viewingTarget]);

  // --- HÀM GỬI CẢNH BÁO (LOGIC MỚI) ---
  const handleSendWarning = async () => {
    if (!warningReport) return;
    try {
      setWarningSending(true);
      
      // Gọi API Patch status + admin_note
      await updateReportStatus(warningReport.id, {
        status: 'resolved', 
        admin_note: warningText
      });

      toast.success('Đã gửi cảnh báo và cập nhật trạng thái thành công');
      setWarningOpen(false);
      setWarningReport(null);
      load(currentPage);
    } catch (e) {
      console.error('Failed to send warning', e);
      toast.error('Lỗi khi gửi cảnh báo');
    } finally {
      setWarningSending(false);
    }
  };

  const maskLast = (val: any, last = 3) => {
    if (!val) return '—';
    const s = String(val);
    const visible = s.slice(-last);
    return (s.length > last ? '*'.repeat(s.length - last) : '*'.repeat(s.length)) + visible;
  };

  const lowerOrDash = (v: any) => (v === undefined || v === null || v === '') ? '—' : String(v).toLowerCase();

  const renderStatusBadge = (s: string | undefined | null) => {
    const key = (s || '').toLowerCase();
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Chờ xử lý', variant: 'secondary' },
      reviewing: { label: 'Đang xem xét', variant: 'secondary' },
      resolved: { label: 'Đã xử lý', variant: 'outline' },
      rejected: { label: 'Bị từ chối', variant: 'destructive' },
      active: { label: 'Hoạt động', variant: 'default' },
      banned: { label: 'Đã cấm', variant: 'destructive' },
      open: { label: 'Đang mở', variant: 'default' },
      matched: { label: 'Đã ghép', variant: 'default' },
      completed: { label: 'Hoàn thành', variant: 'outline' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' },
      expired: { label: 'Hết hạn', variant: 'destructive' },
    };
    const entry = map[key];
    return entry 
      ? <Badge variant={entry.variant} className="w-28 justify-center">{entry.label}</Badge> 
      : <Badge variant="outline" className="w-24 justify-center">{s || '—'}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl mb-2">Báo cáo</h2>
        <p className="text-muted-foreground">Danh sách báo cáo từ người dùng</p>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm: tiêu đề, địa điểm, tags, ID, người báo, tên đối tượng"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">pending</SelectItem>
            <SelectItem value="reviewing">reviewing</SelectItem>
            <SelectItem value="resolved">resolved</SelectItem>
            <SelectItem value="rejected">rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTarget} onValueChange={setFilterTarget}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="user">user</SelectItem>
            <SelectItem value="service">service</SelectItem>
            <SelectItem value="other">other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Không có báo cáo</TableCell></TableRow>
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

      {/* Pagination (Đã khôi phục UI) */}
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

      {/* Report Detail Dialog (Đã khôi phục UI) */}
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

      {/* Target Detail Dialog (Đã khôi phục UI) */}
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

      {/* Warning Dialog (Fix lỗi TypeScript: open: boolean) */}
      <Dialog open={warningOpen} onOpenChange={(open: boolean) => { if (!warningSending && !open) setWarningOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gửi cảnh báo & Xử lý</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Hành động này sẽ gửi thông báo tới người dùng và chuyển trạng thái báo cáo thành <b>Đã xử lý (Resolved)</b>.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="warningText">Nội dung cảnh báo (Admin Note)</label>
              <textarea
                id="warningText"
                aria-label="Nội dung cảnh báo"
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                className="w-full h-32 p-2 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Người nhận (Target ID): <span className="font-mono">{warningReport?.target_id || '—'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { if (!warningSending) { setWarningOpen(false); setWarningReport(null); } }}>Hủy</Button>
            <Button disabled={warningSending} onClick={handleSendWarning}>
              {warningSending ? 'Đang gửi...' : 'Gửi cảnh báo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
          <div className="w-full flex items-center justify-center">
            {lightboxUrl && (
              <img src={lightboxUrl} alt="enlarged" className="max-w-full max-h-[85vh] object-contain rounded-md" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Reports;