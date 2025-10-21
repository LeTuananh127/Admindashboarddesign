import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Search, Plus, Pencil, Trash2, Eye, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type Visibility = 'public' | 'private';
type ServiceStatus = 'open' | 'closed' | 'pending';

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
    status: 'open',
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
    status: 'closed',
    tags: ['Việc nhà', 'Nội trợ', 'Chăm sóc'],
    created_at: '2025-02-05',
    updated_at: '2025-02-15',
  },
];

export function ServicesManagement() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    description: '',
    region_code: '',
    place: '',
    preferred_start: '',
    time: '',
    slot: '60',
    visibility: 'public' as Visibility,
    status: 'open' as ServiceStatus,
    tags: [] as string[],
  });

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || service.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      user_id: '',
      title: '',
      description: '',
      region_code: '',
      place: '',
      preferred_start: '',
      time: '',
      slot: '60',
      visibility: 'public',
      status: 'open',
      tags: [],
    });
  };

  const handleAdd = () => {
    if (!formData.title || !formData.user_id || !formData.place || !formData.time) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const newService: Service = {
      id: `srv_${Date.now()}`,
      user_id: formData.user_id,
      title: formData.title,
      description: formData.description,
      region_code: formData.region_code,
      place: formData.place,
      preferred_start: formData.preferred_start,
      time: parseInt(formData.time),
      slot: parseInt(formData.slot),
      visibility: formData.visibility,
      status: formData.status,
      tags: formData.tags,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };

    setServices([...services, newService]);
    resetForm();
    setIsAddDialogOpen(false);
    toast.success('Thêm dịch vụ thành công');
  };

  const handleEdit = () => {
    if (!editingService || !formData.title || !formData.user_id || !formData.place || !formData.time) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setServices(
      services.map((service) =>
        service.id === editingService.id
          ? {
              ...service,
              user_id: formData.user_id,
              title: formData.title,
              description: formData.description,
              region_code: formData.region_code,
              place: formData.place,
              preferred_start: formData.preferred_start,
              time: parseInt(formData.time),
              slot: parseInt(formData.slot),
              visibility: formData.visibility,
              status: formData.status,
              tags: formData.tags,
              updated_at: new Date().toISOString().split('T')[0],
            }
          : service
      )
    );
    setEditingService(null);
    resetForm();
    toast.success('Cập nhật dịch vụ thành công');
  };

  const handleDelete = (serviceId: string) => {
    setServices(services.filter((service) => service.id !== serviceId));
    toast.success('Xóa dịch vụ thành công');
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      user_id: service.user_id,
      title: service.title,
      description: service.description || '',
      region_code: service.region_code || '',
      place: service.place,
      preferred_start: service.preferred_start || '',
      time: service.time.toString(),
      slot: service.slot.toString(),
      visibility: service.visibility,
      status: service.status,
      tags: service.tags || [],
    });
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const getStatusBadge = (status: ServiceStatus) => {
    const variants: Record<ServiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      open: { label: 'Đang mở', variant: 'default' },
      pending: { label: 'Chờ duyệt', variant: 'secondary' },
      closed: { label: 'Đã đóng', variant: 'destructive' },
    };
    return <Badge variant={variants[status].variant}>{variants[status].label}</Badge>;
  };

  const ServiceForm = () => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="user_id">User ID *</Label>
          <Input
            id="user_id"
            value={formData.user_id}
            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
            placeholder="usr_123"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region_code">Mã vùng</Label>
          <Input
            id="region_code"
            value={formData.region_code}
            onChange={(e) => setFormData({ ...formData, region_code: e.target.value })}
            placeholder="HN, HCM, DN..."
            maxLength={32}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Nhập tiêu đề dịch vụ"
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Nhập mô tả chi tiết"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="place">Địa điểm *</Label>
        <Input
          id="place"
          value={formData.place}
          onChange={(e) => setFormData({ ...formData, place: e.target.value })}
          placeholder="Nhập địa điểm"
          maxLength={255}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_start">Thời gian bắt đầu ưu tiên</Label>
        <Input
          id="preferred_start"
          type="datetime-local"
          value={formData.preferred_start}
          onChange={(e) => setFormData({ ...formData, preferred_start: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="time">Thời gian (phút) *</Label>
          <Input
            id="time"
            type="number"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            placeholder="60"
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slot">Slot (phút)</Label>
          <Input
            id="slot"
            type="number"
            value={formData.slot}
            onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
            placeholder="60"
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="visibility">Hiển thị</Label>
          <Select
            value={formData.visibility}
            onValueChange={(value) => setFormData({ ...formData, visibility: value as Visibility })}
          >
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Công khai</SelectItem>
              <SelectItem value="private">Riêng tư</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as ServiceStatus })}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Đang mở</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="closed">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <Badge
              key={tag}
              variant={formData.tags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              {formData.tags.includes(tag) && <X className="w-3 h-3 ml-1" />}
            </Badge>
          ))}
        </div>
        {formData.tags.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Đã chọn: {formData.tags.join(', ')}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl mb-2">Quản lý dịch vụ</h2>
          <p className="text-muted-foreground">Quản lý các dịch vụ trong hệ thống</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm dịch vụ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm dịch vụ mới</DialogTitle>
            </DialogHeader>
            <ServiceForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleAdd}>Thêm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <SelectItem value="closed">Đã đóng</SelectItem>
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
              <TableHead className="text-right">Thao tác</TableHead>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingService(service)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Dialog
                        open={editingService?.id === service.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingService(null);
                            resetForm();
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(service)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Chỉnh sửa dịch vụ</DialogTitle>
                          </DialogHeader>
                          <ServiceForm />
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingService(null);
                                resetForm();
                              }}
                            >
                              Hủy
                            </Button>
                            <Button onClick={handleEdit}>Cập nhật</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
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
    </div>
  );
}
