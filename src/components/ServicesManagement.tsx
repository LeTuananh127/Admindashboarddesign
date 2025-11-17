import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Search, Eye, ShieldBan, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type Visibility = 'public' | 'private';
type ServiceStatus = 'open' | 'pending' | 'matched' | 'completed' | 'cancelled' | 'expired' | 'banned';

interface Service {
  id: string;
  user_id: string;
  title: string;
  description: string;
  region_code: string;
  place: string;
  preferred_start: string;
  time: number;
  slot: number;
  visibility: Visibility;
  status: ServiceStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
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

const mockServices: Service[] = [
  {
    id: 'srv_1',
    user_id: 'usr_1',
    title: 'Dịch vụ sửa chữa điện tử',
    description: 'Sửa chữa các thiết bị điện tử, điện thoại, máy tính',
    region_code: 'HN',
    place: 'Hà Nội',
    preferred_start: '2025-10-25T09:00',
    time: 120,
    slot: 60,
    visibility: 'public',
    status: 'open',
    tags: ['Sửa chữa', 'Công nghệ'],
    created_at: '2025-01-15',
    updated_at: '2025-01-15',
  },
  {
    id: 'srv_2',
    user_id: 'usr_2',
    title: 'Dạy kèm tiếng Anh',
    description: 'Dạy kèm tiếng Anh cho học sinh cấp 2, cấp 3',
    region_code: 'HCM',
    place: 'TP. Hồ Chí Minh',
    preferred_start: '2025-10-26T14:00',
    time: 90,
    slot: 45,
    visibility: 'public',
    status: 'matched',
    tags: ['Giáo dục'],
    created_at: '2025-01-20',
    updated_at: '2025-02-01',
  },
  {
    id: 'srv_3',
    user_id: 'usr_3',
    title: 'Thiết kế đồ họa',
    description: 'Thiết kế logo, banner, poster chuyên nghiệp',
    region_code: 'DN',
    place: 'Đà Nẵng',
    preferred_start: '2025-10-27T10:00',
    time: 180,
    slot: 90,
    visibility: 'private',
    status: 'pending',
    tags: ['Thiết kế', 'Công nghệ'],
    created_at: '2025-02-01',
    updated_at: '2025-02-10',
  },
  {
    id: 'srv_4',
    user_id: 'usr_1',
    title: 'Giúp việc nhà theo giờ',
    description: 'Dọn dẹp nhà cửa, nấu ăn, giặt là',
    region_code: 'HN',
    place: 'Hà Nội',
    preferred_start: '2025-10-28T08:00',
    time: 240,
    slot: 120,
    visibility: 'public',
    status: 'banned',
    tags: ['Việc nhà', 'Nội trợ', 'Chăm sóc'],
    created_at: '2025-02-05',
    updated_at: '2025-02-15',
  },
  {
    id: 'srv_5',
    user_id: 'usr_4',
    title: 'Tư vấn marketing online',
    description: 'Tư vấn chiến lược marketing, quảng cáo Facebook, Google',
    region_code: 'HCM',
    place: 'TP. Hồ Chí Minh',
    preferred_start: '2025-11-01T10:00',
    time: 120,
    slot: 60,
    visibility: 'public',
    status: 'completed',
    tags: ['Tư vấn', 'Công nghệ'],
    created_at: '2025-01-10',
    updated_at: '2025-01-25',
  },
  {
    id: 'srv_6',
    user_id: 'usr_2',
    title: 'Chăm sóc người cao tuổi',
    description: 'Chăm sóc, đi lại, ăn uống cho người cao tuổi',
    region_code: 'HN',
    place: 'Hà Nội',
    preferred_start: '2025-09-15T08:00',
    time: 480,
    slot: 240,
    visibility: 'public',
    status: 'expired',
    tags: ['Chăm sóc', 'Y tế'],
    created_at: '2025-01-05',
    updated_at: '2025-01-20',
  },
  {
    id: 'srv_7',
    user_id: 'usr_5',
    title: 'Vận chuyển hàng hóa nội thành',
    description: 'Dịch vụ vận chuyển hàng hóa, đồ đạc trong nội thành',
    region_code: 'DN',
    place: 'Đà Nẵng',
    preferred_start: '2025-11-05T07:00',
    time: 180,
    slot: 60,
    visibility: 'public',
    status: 'cancelled',
    tags: ['Vận chuyển'],
    created_at: '2025-02-01',
    updated_at: '2025-02-08',
  },
];

export function ServicesManagement() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ serviceId: string; action: 'ban' | 'unban' } | null>(null);

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || service.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
                      {service.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {service.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{service.tags.length - 2}
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

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
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