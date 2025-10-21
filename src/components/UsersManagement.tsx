import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface User {
  user_id: string;
  user_name: string;
  phone: string;
  created_at: string;
}

const mockUsers: User[] = [
  { user_id: 'usr_1', user_name: 'Nguyễn Văn A', phone: '0901234567', created_at: '2025-01-15' },
  { user_id: 'usr_2', user_name: 'Trần Thị B', phone: '0912345678', created_at: '2025-01-20' },
  { user_id: 'usr_3', user_name: 'Lê Văn C', phone: '0923456789', created_at: '2025-02-01' },
  { user_id: 'usr_4', user_name: 'Phạm Thị D', phone: '0934567890', created_at: '2025-02-10' },
  { user_id: 'usr_5', user_name: 'Hoàng Văn E', phone: '0945678901', created_at: '2025-02-15' },
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ user_name: '', phone: '' });

  const filteredUsers = users.filter(
    (user) =>
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!formData.user_name || !formData.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const newUser: User = {
      user_id: `usr_${Date.now()}`,
      user_name: formData.user_name,
      phone: formData.phone,
      created_at: new Date().toISOString().split('T')[0],
    };

    setUsers([...users, newUser]);
    setFormData({ user_name: '', phone: '' });
    setIsAddDialogOpen(false);
    toast.success('Thêm người dùng thành công');
  };

  const handleEdit = () => {
    if (!editingUser || !formData.user_name || !formData.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setUsers(
      users.map((user) =>
        user.user_id === editingUser.user_id
          ? { ...user, user_name: formData.user_name, phone: formData.phone }
          : user
      )
    );
    setEditingUser(null);
    setFormData({ user_name: '', phone: '' });
    toast.success('Cập nhật người dùng thành công');
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter((user) => user.user_id !== userId));
    toast.success('Xóa người dùng thành công');
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({ user_name: user.user_name, phone: user.phone });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl mb-2">Quản lý tài khoản</h2>
          <p className="text-muted-foreground">Quản lý thông tin người dùng trong hệ thống</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData({ user_name: '', phone: '' })}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm người dùng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm người dùng mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user_name">Tên người dùng</Label>
                <Input
                  id="user_name"
                  value={formData.user_name}
                  onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  placeholder="Nhập tên người dùng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleAdd}>Thêm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Không tìm thấy người dùng nào
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>{user.user_id}</TableCell>
                  <TableCell>{user.user_name}</TableCell>
                  <TableCell>{maskPhone(user.phone)}</TableCell>
                  <TableCell>{user.created_at}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={editingUser?.user_id === user.user_id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingUser(null);
                            setFormData({ user_name: '', phone: '' });
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit_user_name">Tên người dùng</Label>
                              <Input
                                id="edit_user_name"
                                value={formData.user_name}
                                onChange={(e) =>
                                  setFormData({ ...formData, user_name: e.target.value })
                                }
                                placeholder="Nhập tên người dùng"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit_phone">Số điện thoại</Label>
                              <Input
                                id="edit_phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) =>
                                  setFormData({ ...formData, phone: e.target.value })
                                }
                                placeholder="Nhập số điện thoại"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingUser(null);
                                setFormData({ user_name: '', phone: '' });
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
                        onClick={() => handleDelete(user.user_id)}
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
    </div>
  );
}
