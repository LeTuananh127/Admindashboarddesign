import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Search, Eye, ShieldBan, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getAllJobs, blockJob, unblockJob, Job, JobStatus } from '../lib/jobs.api';

export function ServicesManagement() {
  const [services, setServices] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewingService, setViewingService] = useState<Job | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ serviceId: string; action: 'ban' | 'unban' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Load jobs khi component mount hoặc khi thay đổi page/filter
  useEffect(() => {
    console.log('🔍 ServicesManagement mounted');
    console.log('  Access Token:', localStorage.getItem('access_token'));
    loadJobs();
  }, [currentPage, filterStatus]);

  const loadJobs = async () => {
    try {
      console.log('📡 Loading jobs...');
      setIsLoading(true);
      const statusFilter = filterStatus !== 'all' ? [filterStatus as JobStatus] : undefined;
      const response = await getAllJobs({
        page: currentPage,
        pageSize: pageSize,
        sortBy: 'created_at',
        sortOrder: 'desc',
        type: statusFilter,
      });
      console.log('✅ Jobs loaded:', response.data.length);
      
      setServices(response.data);
      setTotalPages(response.metadata.totalPages);
    } catch (error: any) {
      console.error('❌ Load jobs failed:', error);
      toast.error(error.message || 'Không thể tải danh sách dịch vụ');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    if (!searchTerm) return true;
    
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.place?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleBan = async (serviceId: string) => {
    try {
      await blockJob(serviceId);
      // Reload lại data sau khi ban
      await loadJobs();
      setConfirmAction(null);
      toast.success('Đã cấm dịch vụ');
    } catch (error: any) {
      toast.error(error.message || 'Không thể cấm dịch vụ');
    }
  };

  const handleUnban = async (serviceId: string) => {
    try {
      await unblockJob(serviceId);
      // Reload lại data sau khi unban
      await loadJobs();
      setConfirmAction(null);
      toast.success('Đã bỏ cấm dịch vụ');
    } catch (error: any) {
      toast.error(error.message || 'Không thể bỏ cấm dịch vụ');
    }
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

  const getStatusBadge = (status: JobStatus) => {
    const variants: Record<JobStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      pending: { label: 'Chờ duyệt', variant: 'secondary' },
      open: { label: 'Đang mở', variant: 'default' },
      matched: { label: 'Đã khớp', variant: 'secondary' },
      completed: { label: 'Hoàn thành', variant: 'default' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' },
      expired: { label: 'Hết hạn', variant: 'destructive' },
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
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="open">Đang mở</SelectItem>
            <SelectItem value="matched">Đã khớp</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
            <SelectItem value="expired">Hết hạn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Địa điểm</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Không tìm thấy dịch vụ nào
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.id}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{service.title}</TableCell>
                  <TableCell>{service.place}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {service.skills?.slice(0, 2).map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="text-xs">
                          {skill.name}
                        </Badge>
                      ))}
                      {(service.skills?.length || 0) > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{(service.skills?.length || 0) - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(service.status)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingService(service)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {service.status !== 'cancelled' && service.status !== 'expired' ? (
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

      {/* View Service Dialog */}
      <Dialog open={!!viewingService} onOpenChange={() => setViewingService(null)}>
        <DialogContent className="max-w-2xl">
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
                <p className="text-sm text-muted-foreground mb-1">Tiêu đề</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Thời gian ước tính</p>
                  <p>{viewingService.time} phút</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Time Slots</p>
                  <p>{viewingService.slot}</p>
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
                <p className="text-sm text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {viewingService.skills && viewingService.skills.length > 0 ? (
                    viewingService.skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary">
                        {skill.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Không có skills</p>
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
