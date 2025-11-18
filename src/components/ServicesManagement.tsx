import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Search, Eye, ShieldBan, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getAllJobs, type Job } from '../lib/jobs.api';

type Visibility = 'public' | 'private';
type ServiceStatus = 'open' | 'pending' | 'matched' | 'completed' | 'cancelled' | 'expired' | 'banned';

interface Service extends Omit<Job, 'status'> {
  status: ServiceStatus;
  tags: string[];
}

const availableTags = [
  'Việc nhà',
  'Nội trợ',
  'Sửa chữa',
  'Giáo dục',
  'Thiết kế',
  'Công nghệ',
  'Y tế',
  'Tư vấn',
  'Vận chuyển',
  'Chăm sóc',
];

// Removed local mockServices — the app will use real data from the backend

export function ServicesManagement({ dataRefreshTrigger = 0 }: { dataRefreshTrigger?: number }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ serviceId: string; action: 'ban' | 'unban' } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20); // 20 services per page
  const [totalServices, setTotalServices] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadServices = async (page = 0) => {
    // Check if we have a token before making API call
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('[ServicesManagement] No token found — not fetching services');
      toast.info('Vui lòng đăng nhập để xem danh sách dịch vụ');
      setServices([]);
      setTotalServices(0);
      setTotalPages(0);
      setCurrentPage(0);
      setLoading(false);
      return;
    }
    
    try {
      // Backend expects 1-based `page` for admin endpoints; convert UI 0-based `page` to 1-based
      const response = await getAllJobs({
        page: page + 1,
        pageSize,
        search: searchTerm || undefined,
        type: filterStatus !== 'all' ? [filterStatus as any] : undefined,
      });
      const transformedServices = (response.data || []).map((job: Job) => ({
        ...job,
        tags: job.skills?.map(skill => skill.name) || []
      }));

      // Client-side ID-aware filtering: if user typed an id, include matches by id/user_id as well
      let displayed = transformedServices;
      if (searchTerm && searchTerm.trim().length > 0) {
        const q = searchTerm.trim().toLowerCase();
        displayed = transformedServices.filter((s) => {
          return (
            (s.id || '').toLowerCase().includes(q) ||
            (s.user_id || '').toLowerCase().includes(q) ||
            (s.title || '').toLowerCase().includes(q) ||
            (s.place || '').toLowerCase().includes(q) ||
            (s.tags || []).join(' ').toLowerCase().includes(q)
          );
        });
      }

      setServices(displayed);
      setTotalServices(response.metadata.total);
      setTotalPages(response.metadata.totalPages);
      // Convert backend 1-based page back to 0-based for UI state
      setCurrentPage(Math.max(0, response.metadata.page - 1));
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error('Không thể tải danh sách dịch vụ');
      // On error, show empty list — real data should come from backend
      setServices([]);
      setTotalServices(0);
      setTotalPages(0);
      setCurrentPage(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[ServicesManagement] Component mounted or refreshed, calling loadServices');
    loadServices();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadServices(0); // Reset to first page when searching/filtering
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus]);

  // Handle data refresh trigger
  useEffect(() => {
    if (dataRefreshTrigger > 0) {
      console.log('[ServicesManagement] Data refresh triggered');
      loadServices(currentPage);
    }
  }, [dataRefreshTrigger]);

  const handleBan = (serviceId: string) => {
    setServices(
      services.map((service) =>
        service.id === serviceId
          ? { ...service, status: 'banned' as const, updated_at: new Date().toISOString().split('T')[0] }
          : service
      )
    );
    setConfirmAction(null);
    toast.success('Đã cấm dịch vụ');
  };

  const handleUnban = (serviceId: string) => {
    setServices(
      services.map((service) =>
        service.id === serviceId
          ? { ...service, status: 'open' as const, updated_at: new Date().toISOString().split('T')[0] }
          : service
      )
    );
    setConfirmAction(null);
    toast.success('Đã bỏ cấm dịch vụ');
  };

  const confirmBanUnban = () => {
    if (confirmAction) {
      if (confirmAction.action === 'ban') {
        handleBan(confirmAction.serviceId);
      } else {
        handleUnban(confirmAction.serviceId);
      }
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    const variants: Record<ServiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      open: { label: 'Đang mở', variant: 'default' },
      pending: { label: 'Chờ duyệt', variant: 'secondary' },
      matched: { label: 'Đã ghép', variant: 'default' },
      completed: { label: 'Hoàn thành', variant: 'outline' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' },
      expired: { label: 'Hết hạn', variant: 'destructive' },
      banned: { label: 'Đã cấm', variant: 'destructive' },
    };
    return <Badge variant={variants[status].variant} className="w-24 justify-center">{variants[status].label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl mb-2">Quản lý dịch vụ</h2>
          <p className="text-muted-foreground">Quản lý các dịch vụ trong hệ thống</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề, địa điểm, tags, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="open">Đang mở</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="matched">Đã ghép</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
            <SelectItem value="expired">Hết hạn</SelectItem>
            <SelectItem value="banned">Đã cấm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Đang tải danh sách dịch vụ...</div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 px-2">ID</TableHead>
              <TableHead className="w-30">Tiêu đề</TableHead>
              <TableHead className="w-32">Địa điểm</TableHead>
              <TableHead className="w-32">Tags</TableHead>
              <TableHead className="w-24 text-center">Trạng thái</TableHead>
              <TableHead className="text-center w-32">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Không tìm thấy dịch vụ nào
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="px-2">{service.id}</TableCell>
                  <TableCell className="max-w-40 truncate">{service.title}</TableCell>
                  <TableCell>{service.place}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {service.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {service.tags?.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{service.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(service.status)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingService(service)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {service.status !== 'banned' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmAction({ serviceId: service.id, action: 'ban' })}
                          className="w-28"
                        >
                          <ShieldBan className="w-4 h-4 mr-2" />
                          Cấm
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmAction({ serviceId: service.id, action: 'unban' })}
                          className="w-28"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Bỏ cấm
                        </Button>
                      )}
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
          <div className="text-sm text-muted-foreground">
            Hiển thị {services.length} trong tổng số {totalServices} dịch vụ
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadServices(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Trước
            </Button>
            <span className="text-sm">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadServices(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Sau
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* View Service Dialog */}
      <Dialog open={!!viewingService} onOpenChange={() => setViewingService(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chi tiết dịch vụ</DialogTitle>
          </DialogHeader>
          {viewingService && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID</p>
                  <p>{viewingService.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">User ID</p>
                  <p>{viewingService.user_id}</p>
                </div>
              </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 font-semibold">Tiêu đề</p>
                      <p>{viewingService.title}</p>
                  </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
                <p>{viewingService.description || 'Không có mô tả'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mã vùng</p>
                  <p>{viewingService.region_code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Địa điểm</p>
                  <p>{viewingService.place}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Thời gian bắt đầu ưu tiên</p>
                  <p>{viewingService.preferred_start ? new Date(viewingService.preferred_start).toLocaleString('vi-VN') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Thời gian</p>
                  <p>{viewingService.time} phút</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Slot</p>
                  <p>{viewingService.slot} phút</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hiển thị</p>
                  <Badge variant="outline">{viewingService.visibility === 'public' ? 'Công khai' : 'Riêng tư'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                  {getStatusBadge(viewingService.status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {viewingService.tags.length > 0 ? (
                    viewingService.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Không có tags</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ngày tạo</p>
                  <p>{viewingService.created_at}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cập nhật lần cuối</p>
                  <p>{viewingService.updated_at}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewingService(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(open: boolean) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hành động</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'ban'
                ? 'Bạn có chắc chắn muốn cấm dịch vụ này? Dịch vụ sẽ không hiển thị trong hệ thống.'
                : 'Bạn có chắc chắn muốn bỏ cấm dịch vụ này? Dịch vụ sẽ được hiển thị và mở trở lại.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBanUnban}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}