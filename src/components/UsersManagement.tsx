import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Search, ShieldBan, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface User {
  user_id: string;
  user_name: string;
  phone: string;
  status: 'active' | 'banned';
  created_at: string;
}

const mockUsers: User[] = [
  { user_id: 'usr_1', user_name: 'Nguyễn Văn A', phone: '0901234567', status: 'active', created_at: '2025-01-15' },
  { user_id: 'usr_2', user_name: 'Trần Thị B', phone: '0912345678', status: 'active', created_at: '2025-01-20' },
  { user_id: 'usr_3', user_name: 'Lê Văn C', phone: '0923456789', status: 'banned', created_at: '2025-02-01' },
  { user_id: 'usr_4', user_name: 'Phạm Thị D', phone: '0934567890', status: 'active', created_at: '2025-02-10' },
  { user_id: 'usr_5', user_name: 'Hoàng Văn E', phone: '0945678901', status: 'active', created_at: '2025-02-15' },
];

// Hàm ẩn số điện thoại, chỉ hiển thị 3 số cuối
const maskPhone = (phone: string) => {
  if (!phone || phone.length < 3) return phone;
  const lastThree = phone.slice(-3);
  return `***${lastThree}`;
};

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'ban' | 'unban' } | null>(null);

  const filteredUsers = users.filter(
    (user) =>
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBan = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.user_id === userId ? { ...user, status: 'banned' as const } : user
      )
    );
    setConfirmAction(null);
    toast.success('Đã cấm người dùng');
  };

  const handleUnban = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.user_id === userId ? { ...user, status: 'active' as const } : user
      )
    );
    setConfirmAction(null);
    toast.success('Đã bỏ cấm người dùng');
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

  const getStatusBadge = (status: 'active' | 'banned') => {
    if (status === 'banned') {
      return <Badge variant="destructive" className="w-24 justify-center">Đã cấm</Badge>;
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên người dùng</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Không tìm thấy người dùng nào
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>{user.user_id}</TableCell>
                  <TableCell>{user.user_name}</TableCell>
                  <TableCell>{maskPhone(user.phone)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{user.created_at}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      {user.status === 'active' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmAction({ userId: user.user_id, action: 'ban' })}
                          className="w-28"
                        >
                          <ShieldBan className="w-4 h-4 mr-2" />
                          Cấm
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmAction({ userId: user.user_id, action: 'unban' })}
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

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
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
