import React from 'react';
import { Card } from './ui/card';
import { Users, Settings, Activity, ShieldBan, TrendingUp, Clock, MapPin, Eye } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from './ui/badge';

// Mock data cho users
const mockUsers = [
  { user_id: 'usr_1', user_name: 'Nguyễn Văn A', phone: '0901234567', status: 'active', created_at: '2025-01-15' },
  { user_id: 'usr_2', user_name: 'Trần Thị B', phone: '0912345678', status: 'active', created_at: '2025-01-20' },
  { user_id: 'usr_3', user_name: 'Lê Văn C', phone: '0923456789', status: 'banned', created_at: '2025-02-01' },
  { user_id: 'usr_4', user_name: 'Phạm Thị D', phone: '0934567890', status: 'active', created_at: '2025-02-10' },
  { user_id: 'usr_5', user_name: 'Hoàng Văn E', phone: '0945678901', status: 'active', created_at: '2025-02-15' },
];

// Mock data cho services
const mockServices = [
  {
    id: 'srv_1',
    user_id: 'usr_1',
    title: 'Dịch vụ sửa chữa điện tử',
    region_code: 'HN',
    place: 'Hà Nội',
    status: 'open',
    tags: ['Sửa chữa', 'Công nghệ'],
    created_at: '2025-01-15',
    visibility: 'public',
  },
  {
    id: 'srv_2',
    user_id: 'usr_2',
    title: 'Dạy kèm tiếng Anh',
    region_code: 'HCM',
    place: 'TP. Hồ Chí Minh',
    status: 'matched',
    tags: ['Giáo dục'],
    created_at: '2025-01-20',
    visibility: 'public',
  },
  {
    id: 'srv_3',
    user_id: 'usr_3',
    title: 'Thiết kế đồ họa',
    region_code: 'DN',
    place: 'Đà Nẵng',
    status: 'pending',
    tags: ['Thiết kế', 'Công nghệ'],
    created_at: '2025-02-01',
    visibility: 'private',
  },
  {
    id: 'srv_4',
    user_id: 'usr_1',
    title: 'Giúp việc nhà theo giờ',
    region_code: 'HN',
    place: 'Hà Nội',
    status: 'banned',
    tags: ['Việc nhà', 'Nội trợ', 'Chăm sóc'],
    created_at: '2025-02-05',
    visibility: 'public',
  },
  {
    id: 'srv_5',
    user_id: 'usr_4',
    title: 'Tư vấn marketing online',
    region_code: 'HCM',
    place: 'TP. Hồ Chí Minh',
    status: 'completed',
    tags: ['Tư vấn', 'Công nghệ'],
    created_at: '2025-01-10',
    visibility: 'public',
  },
  {
    id: 'srv_6',
    user_id: 'usr_2',
    title: 'Chăm sóc người cao tuổi',
    region_code: 'HN',
    place: 'Hà Nội',
    status: 'expired',
    tags: ['Chăm sóc', 'Y tế'],
    created_at: '2025-01-05',
    visibility: 'public',
  },
  {
    id: 'srv_7',
    user_id: 'usr_5',
    title: 'Vận chuyển hàng hóa nội thành',
    region_code: 'DN',
    place: 'Đà Nẵng',
    status: 'cancelled',
    tags: ['Vận chuyển'],
    created_at: '2025-02-01',
    visibility: 'public',
  },
];

export function Dashboard() {
  // Tính toán thống kê
  const totalUsers = mockUsers.length;
  const activeUsers = mockUsers.filter(u => u.status === 'active').length;
  const bannedUsers = mockUsers.filter(u => u.status === 'banned').length;
  
  const totalServices = mockServices.length;
  const openServices = mockServices.filter(s => s.status === 'open').length;
  const matchedServices = mockServices.filter(s => s.status === 'matched').length;
  const completedServices = mockServices.filter(s => s.status === 'completed').length;
  const pendingServices = mockServices.filter(s => s.status === 'pending').length;
  const cancelledServices = mockServices.filter(s => s.status === 'cancelled').length;
  const expiredServices = mockServices.filter(s => s.status === 'expired').length;
  const bannedServices = mockServices.filter(s => s.status === 'banned').length;

  // Thống kê theo trạng thái dịch vụ
  const serviceStatusData = [
    { name: 'Đang mở', value: openServices, color: '#10b981' },
    { name: 'Đã ghép', value: matchedServices, color: '#3b82f6' },
    { name: 'Hoàn thành', value: completedServices, color: '#8b5cf6' },
    { name: 'Chờ duyệt', value: pendingServices, color: '#f59e0b' },
    { name: 'Đã hủy', value: cancelledServices, color: '#ef4444' },
    { name: 'Hết hạn', value: expiredServices, color: '#6b7280' },
    { name: 'Đã cấm', value: bannedServices, color: '#dc2626' },
  ].filter(item => item.value > 0);

  // Thống kê theo tags
  const tagStats: Record<string, number> = {};
  mockServices.forEach(service => {
    service.tags.forEach(tag => {
      tagStats[tag] = (tagStats[tag] || 0) + 1;
    });
  });
  const tagData = Object.entries(tagStats).map(([name, value]) => ({ name, value })).slice(0, 6);

  // Thống kê theo khu vực
  const regionStats: Record<string, number> = {};
  mockServices.forEach(service => {
    regionStats[service.region_code] = (regionStats[service.region_code] || 0) + 1;
  });
  const regionData = Object.entries(regionStats).map(([name, value]) => ({ name, value }));

  // Thống kê theo tháng (giả lập)
  const monthlyData = [
    { month: 'T1', users: 2, services: 3 },
    { month: 'T2', users: 3, services: 4 },
  ];

  const stats = [
    { 
      label: 'Tổng người dùng', 
      value: totalUsers.toString(), 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      detail: `${activeUsers} hoạt động, ${bannedUsers} bị cấm`
    },
    { 
      label: 'Tổng dịch vụ', 
      value: totalServices.toString(), 
      icon: Settings, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      detail: `${openServices} đang mở, ${matchedServices} đã ghép`
    },
    { 
      label: 'Hoàn thành', 
      value: completedServices.toString(), 
      icon: Activity, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      detail: `${((completedServices / totalServices) * 100).toFixed(0)}% tổng dịch vụ`
    },
    { 
      label: 'Cần xử lý', 
      value: (bannedServices + cancelledServices + expiredServices).toString(), 
      icon: ShieldBan, 
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      detail: `${bannedServices} bị cấm, ${cancelledServices} đã hủy, ${expiredServices} hết hạn`
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl mb-2">Bảng điều khiển</h2>
        <p className="text-muted-foreground">Tổng quan thống kê hệ thống quản lý dịch vụ</p>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <p className="text-3xl mb-2">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.detail}</p>
            </Card>
          );
        })}
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ trạng thái dịch vụ */}
        <Card className="p-6">
          <h3 className="mb-4">Phân bổ trạng thái dịch vụ</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Biểu đồ theo tags */}
        <Card className="p-6">
          <h3 className="mb-4">Thống kê dịch vụ theo danh mục</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tagData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Biểu đồ xu hướng và khu vực */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ xu hướng */}
        <Card className="p-6">
          <h3 className="mb-4">Xu hướng tăng trưởng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" name="Người dùng" strokeWidth={2} />
              <Line type="monotone" dataKey="services" stroke="#10b981" name="Dịch vụ" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Thống kê theo khu vực */}
        <Card className="p-6">
          <h3 className="mb-4">Phân bổ theo khu vực</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Thông tin chi tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top tags */}
        <Card className="p-6">
          <h3 className="mb-4">Danh mục phổ biến</h3>
          <div className="space-y-3">
            {tagData.map((tag, index) => (
              <div key={tag.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm">{index + 1}</span>
                  </div>
                  <Badge variant="secondary">{tag.name}</Badge>
                </div>
                <span className="text-sm">{tag.value} dịch vụ</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Thông tin hệ thống */}
        <Card className="p-6">
          <h3 className="mb-4">Thông tin hệ thống</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Dịch vụ công khai</span>
              </div>
              <span>{mockServices.filter(s => s.visibility === 'public').length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Khu vực hoạt động</span>
              </div>
              <span>{Object.keys(regionStats).length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Tỷ lệ phản hồi</span>
              </div>
              <Badge variant="default">95%</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Tăng trưởng tuần này</span>
              </div>
              <Badge variant="default" className="bg-green-600">+12.5%</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}