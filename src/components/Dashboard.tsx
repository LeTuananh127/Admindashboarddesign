import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Users, Settings, Activity, ShieldBan, TrendingUp, Clock, MapPin, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getAllUsers, type User } from '../lib/users.api';
import { getAllJobs, type Job } from '../lib/jobs.api';
import { toast } from 'sonner';

export function Dashboard({ dataRefreshTrigger = 0 }: { dataRefreshTrigger?: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadData = async () => {
      // Check if we have a token before making API calls
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('[Dashboard] No token found, skipping API calls');
        setLoading(false);
        return;
      }
      
      try {
        const [usersData, servicesData] = await Promise.all([
          getAllUsers({ pageSize: 1000 }), // Fetch up to 1000 users for dashboard stats
          getAllJobs({ pageSize: 1000 }) // Fetch up to 1000 services for dashboard stats
        ]);
        setUsers(usersData.data || []);
        setServices(servicesData.data || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle data refresh trigger
  useEffect(() => {
    if (dataRefreshTrigger > 0) {
      console.log('[Dashboard] Data refresh triggered');
      const loadData = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        try {
          const [usersData, servicesData] = await Promise.all([
            getAllUsers({ pageSize: 1000 }), // Fetch up to 1000 users for dashboard stats
            getAllJobs({ pageSize: 1000 }) // Fetch up to 1000 services for dashboard stats
          ]);
          setUsers(usersData.data || []);
          setServices(servicesData.data || []);
        } catch (error) {
          console.error('Failed to refresh dashboard data:', error);
        }
      };
      loadData();
    }
  }, [dataRefreshTrigger]);

  // Tính toán thống kê từ data thật
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const bannedUsers = users.filter(u => u.status === 'banned').length;

  const totalServices = services.length;
  const openServices = services.filter(s => s.status === 'open').length;
  const matchedServices = services.filter(s => s.status === 'matched').length;
  const completedServices = services.filter(s => s.status === 'completed').length;
  const pendingServices = services.filter(s => s.status === 'pending').length;
  const cancelledServices = services.filter(s => s.status === 'cancelled').length;
  const expiredServices = services.filter(s => s.status === 'expired').length;

  // Thống kê theo trạng thái dịch vụ
  const serviceStatusData = [
    { name: 'Đang mở', value: openServices, color: '#10b981' },
    { name: 'Đã ghép', value: matchedServices, color: '#3b82f6' },
    { name: 'Hoàn thành', value: completedServices, color: '#8b5cf6' },
    { name: 'Chờ duyệt', value: pendingServices, color: '#f59e0b' },
    { name: 'Đã hủy', value: cancelledServices, color: '#ef4444' },
    { name: 'Hết hạn', value: expiredServices, color: '#6b7280' },
  ].filter(item => item.value > 0);

  // Thống kê theo tags
  const tagStats: Record<string, number> = {};
  services.forEach(service => {
    if (service.skills) {
      service.skills.forEach(skill => {
        tagStats[skill.name] = (tagStats[skill.name] || 0) + 1;
      });
    }
  });
  const tagData = Object.entries(tagStats).map(([name, value]) => ({ name, value })).slice(0, 6);

  // Thống kê theo khu vực
  const regionStats: Record<string, number> = {};
  services.forEach(service => {
    regionStats[service.region_code] = (regionStats[service.region_code] || 0) + 1;
  });
  const regionData = Object.entries(regionStats).map(([name, value]) => ({ name, value }));

  // Thống kê theo tháng (từ dữ liệu thực tế)
  const getMonthlyStats = () => {
    const monthlyStats: Record<string, { users: number; services: number }> = {};
    
    // Khởi tạo 12 tháng
    for (let i = 1; i <= 12; i++) {
      const monthKey = `T${i}`;
      monthlyStats[monthKey] = { users: 0, services: 0 };
    }
    
    // Đếm users theo tháng tạo
    users.forEach(user => {
      const createdDate = new Date(user.created_at);
      const month = createdDate.getMonth() + 1; // getMonth() trả về 0-11
      const monthKey = `T${month}`;
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].users++;
      }
    });
    
    // Đếm services theo tháng tạo
    services.forEach(service => {
      const createdDate = new Date(service.created_at);
      const month = createdDate.getMonth() + 1;
      const monthKey = `T${month}`;
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].services++;
      }
    });
    
    return Object.entries(monthlyStats).map(([month, data]) => ({
      month,
      users: data.users,
      services: data.services
    }));
  };

  const monthlyData = getMonthlyStats();

  // Thống kê theo ngày trong tháng hiện tại
  const getCurrentMonthStats = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() trả về 0-11
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    const dailyStats: Record<string, { users: number; services: number; day: number }> = {};
    
    // Khởi tạo tất cả ngày trong tháng
    for (let i = 1; i <= daysInMonth; i++) {
      const dayKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      dailyStats[dayKey] = { users: 0, services: 0, day: i };
    }
    
    // Đếm users theo ngày trong tháng hiện tại
    users.forEach(user => {
      const createdDate = new Date(user.created_at);
      if (createdDate.getFullYear() === currentYear && createdDate.getMonth() + 1 === currentMonth) {
        const day = createdDate.getDate();
        const dayKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        if (dailyStats[dayKey]) {
          dailyStats[dayKey].users++;
        }
      }
    });
    
    // Đếm services theo ngày trong tháng hiện tại
    services.forEach(service => {
      const createdDate = new Date(service.created_at);
      if (createdDate.getFullYear() === currentYear && createdDate.getMonth() + 1 === currentMonth) {
        const day = createdDate.getDate();
        const dayKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        if (dailyStats[dayKey]) {
          dailyStats[dayKey].services++;
        }
      }
    });
    
    // Chỉ trả về ngày có data hoặc đến ngày hiện tại
    const currentDay = currentDate.getDate();
    
    return Object.entries(dailyStats)
      .filter(([dayKey, data]) => data.day <= currentDay && (data.users > 0 || data.services > 0 || data.day <= currentDay))
      .map(([dayKey, data]) => ({
        day: dayKey,
        dayName: `${data.day}`,
        users: data.users,
        services: data.services,
        total: data.users + data.services
      }));
  };

  const currentMonthData = getCurrentMonthStats();

  // Thống kê theo năm với xu hướng tăng trưởng
  const getYearlyStats = (year: number) => {
    const yearlyStats: Record<string, { users: number; services: number; month: number }> = {};
    
    // Khởi tạo 12 tháng cho năm được chọn
    for (let i = 1; i <= 12; i++) {
      const monthKey = `${year}-${i.toString().padStart(2, '0')}`;
      yearlyStats[monthKey] = { users: 0, services: 0, month: i };
    }
    
    // Đếm users theo tháng trong năm được chọn
    users.forEach(user => {
      const createdDate = new Date(user.created_at);
      if (createdDate.getFullYear() === year) {
        const month = createdDate.getMonth() + 1;
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        if (yearlyStats[monthKey]) {
          yearlyStats[monthKey].users++;
        }
      }
    });
    
    // Đếm services theo tháng trong năm được chọn
    services.forEach(service => {
      const createdDate = new Date(service.created_at);
      if (createdDate.getFullYear() === year) {
        const month = createdDate.getMonth() + 1;
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        if (yearlyStats[monthKey]) {
          yearlyStats[monthKey].services++;
        }
      }
    });
    
    // Chỉ trả về tháng có data hoặc đến tháng hiện tại nếu là năm hiện tại
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const maxMonth = (year === currentYear) ? currentMonth : 12;
    
    return Object.entries(yearlyStats)
      .filter(([monthKey, data]) => data.month <= maxMonth && (data.users > 0 || data.services > 0 || data.month <= maxMonth))
      .map(([monthKey, data]) => ({
        month: monthKey,
        monthName: `T${data.month}`,
        users: data.users,
        services: data.services,
        total: data.users + data.services
      }));
  };

  const yearlyData = getYearlyStats(currentYear);

  // Tính toán tỷ lệ tăng trưởng cho năm được chọn
  const calculateYearlyGrowth = (year: number) => {
    const currentYearData = getYearlyStats(year);
    const previousYearData = getYearlyStats(year - 1);
    
    const currentTotal = currentYearData.reduce((sum, month) => sum + month.total, 0);
    const previousTotal = previousYearData.reduce((sum, month) => sum + month.total, 0);
    
    if (previousTotal === 0) return 0;
    
    const growth = ((currentTotal - previousTotal) / previousTotal) * 100;
    return Math.round(growth * 10) / 10;
  };

  const yearlyGrowth = calculateYearlyGrowth(currentYear);

  // Tính toán tăng trưởng tháng hiện tại so với tháng trước
  const calculateCurrentMonthGrowth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // Tháng trước
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    // Tính tổng users và services trong tháng hiện tại
    const currentMonthUsers = users.filter(user => {
      const date = new Date(user.created_at);
      return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth;
    }).length;
    
    const currentMonthServices = services.filter(service => {
      const date = new Date(service.created_at);
      return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth;
    }).length;
    
    const currentTotal = currentMonthUsers + currentMonthServices;
    
    // Tính tổng users và services trong tháng trước
    const prevMonthUsers = users.filter(user => {
      const date = new Date(user.created_at);
      return date.getFullYear() === prevYear && date.getMonth() + 1 === prevMonth;
    }).length;
    
    const prevMonthServices = services.filter(service => {
      const date = new Date(service.created_at);
      return date.getFullYear() === prevYear && date.getMonth() + 1 === prevMonth;
    }).length;
    
    const prevTotal = prevMonthUsers + prevMonthServices;
    
    if (prevTotal === 0) return 0;
    
    const growth = ((currentTotal - prevTotal) / prevTotal) * 100;
    return Math.round(growth * 10) / 10;
  };

  const currentMonthGrowth = calculateCurrentMonthGrowth();

  // Tính toán tỷ lệ tăng trưởng thực tế dựa trên số users tháng này vs tháng trước
  const calculateGrowthRate = () => {
    const currentMonth = new Date().getMonth() + 1; // Tháng hiện tại (1-12)
    const currentMonthKey = `T${currentMonth}`;
    const previousMonthKey = `T${currentMonth - 1 || 12}`; // Tháng trước, nếu tháng 1 thì lấy tháng 12
    
    const currentMonthData = monthlyData.find(d => d.month === currentMonthKey);
    const previousMonthData = monthlyData.find(d => d.month === previousMonthKey);
    
    if (!currentMonthData || !previousMonthData || previousMonthData.users === 0) {
      return 0; // Không thể tính nếu không có data
    }
    
    // Tính tăng trưởng dựa trên users (có thể thay đổi thành services nếu muốn)
    const growth = ((currentMonthData.users - previousMonthData.users) / previousMonthData.users) * 100;
    return Math.round(growth * 10) / 10; // Làm tròn đến 1 chữ số thập phân
  };

  const growthRate = calculateGrowthRate();

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
      value: (cancelledServices + expiredServices).toString(),
      icon: ShieldBan,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      detail: `${cancelledServices} đã hủy, ${expiredServices} hết hạn`
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Xu hướng tăng trưởng tháng {new Date().getMonth() + 1}</h3>
            <Badge variant="outline" className={currentMonthGrowth >= 0 ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}>
              {currentMonthGrowth >= 0 ? '+' : ''}{currentMonthGrowth}% so với tháng {new Date().getMonth() === 0 ? 12 : new Date().getMonth()}
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentMonthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayName" tick={{ fontSize: 12 }} interval={0} angle={0} />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => `Ngày ${label}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`}
                formatter={(value, name) => [value, name === 'users' ? 'Người dùng' : 'Dịch vụ']}
              />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" name="Người dùng" strokeWidth={2} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }} />
              <Line type="monotone" dataKey="services" stroke="#10b981" name="Dịch vụ" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }} />
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
              <span>{services.filter(s => s.visibility === 'public').length}</span>
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
                <span className="text-sm">Tăng trưởng tháng này</span>
              </div>
              <Badge variant="default" className={growthRate >= 0 ? "bg-green-600" : "bg-red-600"}>{growthRate >= 0 ? '+' : ''}{growthRate}%</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Xu hướng tăng trưởng theo năm */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Xu hướng tăng trưởng theo năm</h3>
            <p className="text-sm text-muted-foreground">Theo dõi sự phát triển hàng tháng trong năm {currentYear}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={yearlyGrowth >= 0 ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}>
              {yearlyGrowth >= 0 ? '+' : ''}{yearlyGrowth}% so với {currentYear - 1}
            </Badge>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentYear(prev => prev - 1)}
                disabled={currentYear <= 2020}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">{currentYear}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentYear(prev => prev + 1)}
                disabled={currentYear >= new Date().getFullYear() + 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="monthName" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={0}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => `Tháng ${label.replace('T', '')}/${currentYear}`}
              formatter={(value, name) => [value, name === 'users' ? 'Người dùng' : name === 'services' ? 'Dịch vụ' : 'Tổng']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="users" 
              stroke="#3b82f6" 
              name="Người dùng" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="services" 
              stroke="#10b981" 
              name="Dịch vụ" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}