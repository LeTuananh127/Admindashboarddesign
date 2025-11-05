import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Search, ShieldBan, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getAllUsers, blockUser, unblockUser, User } from '../lib/users.api';

// Hàm ẩn số điện thoại, chỉ hiển thị 3 số cuối
const maskPhone = (phone: string | null) => {
  if (!phone || phone.length < 3) return '***';
  const lastThree = phone.slice(-3);
  return `***${lastThree}`;
};

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'ban' | 'unban' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load users khi component mount
  useEffect(() => {
    console.log('🔍 UsersManagement mounted');
    console.log('  Access Token:', localStorage.getItem('access_token'));
    console.log('  Admin Logged In:', localStorage.getItem('adminLoggedIn'));
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('📡 Loading users...');
      setIsLoading(true);
      const data = await getAllUsers();
      console.log('✅ Users loaded:', data.length);
      setUsers(data);
    } catch (error: any) {
      console.error('❌ Load users failed:', error);
      toast.error(error.message || 'Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBan = async (userId: string) => {
    try {
      await blockUser(userId);
      // Cập nhật UI
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: 'banned' as const } : user
        )
      );
      setConfirmAction(null);
      toast.success('Đã cấm người dùng');
    } catch (error: any) {
      toast.error(error.message || 'Không thể cấm người dùng');
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await unblockUser(userId);
      // Reload lại data sau khi unban
      await loadUsers();
      setConfirmAction(null);
      toast.success('Đã bỏ cấm người dùng');
    } catch (error: any) {
      toast.error(error.message || 'Không thể bỏ cấm người dùng');
    }
  };

  const confirmBanUnban = () => {
    if (confirmAction) {
      if (confirmAction.action === 'ban') {
        handleBan(confirmAction.userId);
      } else {
        handleUnban(confirmAction.userId);
      }
    }
  };

  const getStatusBadge = (status: 'active' | 'suspended' | 'banned') => {
    if (status === 'banned') {
      return <Badge variant="destructive" className="w-24 justify-center">Đã cấm</Badge>;
    }
    if (status === 'suspended') {
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
      </div>

      <div className="border rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tên người dùng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Không tìm thấy người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email || 'Chưa có'}</TableCell>
                    <TableCell>{maskPhone(user.phone)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString('vi-VN')}</TableCell>
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
                        ) : user.status === 'banned' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmAction({ userId: user.id, action: 'unban' })}
                            className="w-28"
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Bỏ cấm
                          </Button>
                        ) : (
                          <Badge variant="secondary">Tạm dừng</Badge>
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
