import React, { useMemo } from 'react';
import { Order } from '../types';
import { formatCurrency } from '../utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, ShoppingBag, CheckCircle2, Clock } from 'lucide-react';

interface DailyAnalyticsProps {
  orders: Order[];
}

export function DailyAnalytics({ orders }: DailyAnalyticsProps) {
  // Filter for today's orders
  const todayOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.createdAt).toDateString() === today);
  }, [orders]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = todayOrders.filter(o => o.status === 'Completed' || o.status === 'Picked Up');
    const pending = todayOrders.filter(o => o.status === 'Pending' || o.status === 'Preparing');
    
    const revenue = completed.reduce((sum, o) => sum + o.total, 0);
    
    return {
      totalOrders: todayOrders.length,
      completedOrders: completed.length,
      pendingOrders: pending.length,
      revenue
    };
  }, [todayOrders]);

  // Prepare chart data (Hourly)
  const chartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i}:00`,
      revenue: 0,
      orders: 0
    }));

    todayOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const hour = date.getHours();
      
      // Count all orders for volume chart
      hours[hour].orders += 1;

      // Only count revenue for completed/picked up
      if (order.status === 'Completed' || order.status === 'Picked Up') {
        hours[hour].revenue += order.total;
      }
    });

    // Filter out future hours or empty start hours to make chart cleaner? 
    // Let's just show active hours (e.g., from first order to last order, or 8am to 10pm)
    // For now, showing all 24h or maybe just 6am-11pm is safer.
    // Let's just return all for simplicity.
    return hours;
  }, [todayOrders]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        Today's Analytics
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Today's Revenue</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Orders</p>
          <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Completed</p>
          <p className="text-xl font-bold text-green-600">{stats.completedOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Pending</p>
          <p className="text-xl font-bold text-orange-600">{stats.pendingOrders}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-[300px]">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue per Hour</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }} 
                interval={3}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#f97316" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-[300px]">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Orders per Hour</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                interval={3}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar 
                dataKey="orders" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
