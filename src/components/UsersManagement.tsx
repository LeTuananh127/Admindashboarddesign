import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, ShieldBan, ShieldCheck, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { getAllUsers, blockUser, unblockUser, type User, type PaginatedResponse } from '../lib/users.api';

// Hàm ẩn số điện thoại, chỉ hiển thị 3 số cuối
const maskPhone = (phone: string | null) => {
  if (!phone || phone.length < 3) return phone || '';
  const lastThree = phone.slice(-3);
  return `***${lastThree}`;
};

export function UsersManagement({ dataRefreshTrigger = 0 }: { dataRefreshTrigger?: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'suspended' | 'banned' | 'all'>('all');
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'ban' | 'unban' } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const isFetchingRef = useRef(false);
  const [pageSize] = useState(20); // 20 users per page
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadUsers = async (page = 0) => {
    // Check if we have a token before making API call
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('[UsersManagement] No token found, skipping API call');
      setLoading(false);
      return;
    }
    
    // Avoid concurrent duplicate calls
    if (isFetchingRef.current) {
      console.debug('[UsersManagement] loadUsers already running — skipping duplicate call');
      return;
    }

    try {
      // Backend expects 1-based `page`; convert UI 0-based to 1-based
      const response: PaginatedResponse<User> = await getAllUsers({
        page: page + 1,
        pageSize,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      // Client-side ID-aware filtering: if searchTerm matches an id, ensure id matches are included
      let usersList = response.data || [];
      if (searchTerm && searchTerm.trim().length > 0) {
        const q = searchTerm.trim().toLowerCase();
        usersList = usersList.filter(u => {
          return (
            (u.id || '').toLowerCase().includes(q) ||
            (u.full_name || '').toLowerCase().includes(q) ||
            (u.phone || '').toLowerCase().includes(q)
          );
        });
      }
      setUsers(usersList);
      setTotalUsers(response.metadata.total);
      setTotalPages(response.metadata.totalPages);
      // Convert backend 1-based page back to 0-based for UI
      setCurrentPage(Math.max(0, response.metadata.page - 1));
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Không thể tải danh sách người dùng');
      setUsers([]);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[UsersManagement] Component mounted or refreshed, calling loadUsers');
    loadUsers();
  }, []);

  // Handle data refresh trigger
  useEffect(() => {
    if (dataRefreshTrigger > 0) {
      console.log('[UsersManagement] Data refresh triggered');
      loadUsers(currentPage);
    }
  }, [dataRefreshTrigger]);

  // Handle search term changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(0); // Reset to first page when searching
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle status filter changes
  useEffect(() => {
    loadUsers(0); // Reset to first page when filtering
  }, [statusFilter]);

  const handleBan = async (userId: string) => {
    try {
      await blockUser(userId);
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: 'banned' as const } : user
        )
      );
      setConfirmAction(null);
      toast.success('Đã cấm người dùng thành công');
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast.error('Không thể cấm người dùng');
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await unblockUser(userId);
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: 'active' as const } : user
        )
      );
      setConfirmAction(null);
      toast.success('Đã bỏ cấm người dùng thành công');
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast.error('Không thể bỏ cấm người dùng');
    }
  };

  const confirmBanUnban = async () => {
    if (confirmAction) {
      if (confirmAction.action === 'ban') {
        await handleBan(confirmAction.userId);
      } else {
        await handleUnban(confirmAction.userId);
      }
    }
  };

  const getStatusBadge = (status: 'active' | 'suspended' | 'banned') => {
    if (status === 'banned') {
      return <Badge variant="destructive" className="w-24 justify-center">Đã cấm</Badge>;
    } else if (status === 'suspended') {
      return <Badge variant="secondary" className="w-24 justify-center">Tạm dừng</Badge>;
    }
    return <Badge variant="default" className="w-24 justify-center">Hoạt động</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl mb-2">Quản lý tài khoản</h2>
          <p className="text-muted-foreground">Quản lý thông tin người dùng trong hệ thống</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, số điện thoại, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value as 'active' | 'suspended' | 'banned' | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="suspended">Tạm dừng</SelectItem>
              <SelectItem value="banned">Đã cấm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Đang tải danh sách người dùng...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 px-2">ID</TableHead>
                <TableHead className="w-40">Tên người dùng</TableHead>
                <TableHead className="w-28">Số điện thoại</TableHead>
                <TableHead className="w-30 text-center">Trạng thái</TableHead>
                <TableHead className="w-24">Ngày tạo</TableHead>
                <TableHead className="text-center w-32">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Không tìm thấy người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm px-2">{user.id}</TableCell>
                    <TableCell className="max-w-20">
                      <div className="truncate" title={user.full_name}>
                        {user.full_name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{maskPhone(user.phone)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {user.status === 'active' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmAction({ userId: user.id, action: 'ban' })}
                            className="w-28"
                          >
                            <ShieldBan className="w-4 h-4 mr-2" />
                            Cấm
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmAction({ userId: user.id, action: 'unban' })}
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
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Hiển thị {users.length} trong tổng số {totalUsers} người dùng
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadUsers(currentPage - 1)}
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
              onClick={() => loadUsers(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Sau
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={(open: boolean) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hành động</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'ban'
                ? 'Bạn có chắc chắn muốn cấm người dùng này? Người dùng sẽ không thể truy cập hệ thống.'
                : 'Bạn có chắc chắn muốn bỏ cấm người dùng này? Người dùng sẽ có thể truy cập hệ thống trở lại.'}
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
