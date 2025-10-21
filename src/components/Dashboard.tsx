import React from 'react';
import { Card } from './ui/card';
import { Users, Settings, TrendingUp, Activity } from 'lucide-react';

export function Dashboard() {
  const stats = [
    { label: 'Tổng người dùng', value: '1,234', icon: Users, color: 'text-blue-600' },
    { label: 'Tổng dịch vụ', value: '856', icon: Settings, color: 'text-green-600' },
    { label: 'Dịch vụ đang mở', value: '342', icon: Activity, color: 'text-orange-600' },
    { label: 'Tăng trưởng', value: '+12.5%', icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl mb-2">Bảng điều khiển</h2>
        <p className="text-muted-foreground">Chào mừng đến với trang quản trị</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <p className="text-3xl">{stat.value}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
