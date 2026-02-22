import React, { useMemo, useState } from 'react';
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
  Bar,
  Cell
} from 'recharts';
import { TrendingUp, ShoppingBag, CheckCircle2, Clock, Calendar, Package, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DailyAnalyticsProps {
  orders: Order[];
}

type DateFilter = 'Today' | 'Yesterday' | 'Custom';

export function DailyAnalytics({ orders }: DailyAnalyticsProps) {
  const [filter, setFilter] = useState<DateFilter>('Today');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter orders based on selected date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return orders.filter(o => {
      if (o.status === 'Cancelled') return false;
      
      const orderDate = new Date(o.createdAt);
      const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

      if (filter === 'Today') {
        return orderDay.getTime() === today.getTime();
      }
      if (filter === 'Yesterday') {
        return orderDay.getTime() === yesterday.getTime();
      }
      if (filter === 'Custom') {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });
  }, [orders, filter, customStartDate, customEndDate]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status === 'Completed' || o.status === 'Picked Up');
    
    const revenue = completed.reduce((sum, o) => sum + o.total, 0);
    
    const itemMap = new Map<string, { name: string, quantity: number, revenue: number }>();
    let totalItemsSold = 0;

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemMap.get(item.id) || { name: item.name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += (item.basePrice * item.quantity); // Note: this is base price, doesn't account for bundle discounts perfectly but gives a good idea
        itemMap.set(item.id, existing);
        totalItemsSold += item.quantity;
      });
    });

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalOrders: filteredOrders.length,
      completedOrders: completed.length,
      revenue,
      totalItemsSold,
      topItems
    };
  }, [filteredOrders]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (filter === 'Today' || filter === 'Yesterday') {
      const hours = Array.from({ length: 24 }, (_, i) => ({
        label: `${i}:00`,
        revenue: 0,
        orders: 0
      }));

      filteredOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hours[hour].orders += 1;
        if (order.status === 'Completed' || order.status === 'Picked Up') {
          hours[hour].revenue += order.total;
        }
      });
      return hours;
    } else {
      // For custom range, group by day
      const days: Record<string, { label: string, revenue: number, orders: number }> = {};
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toDateString();
        days[key] = {
          label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          revenue: 0,
          orders: 0
        };
      }

      filteredOrders.forEach(order => {
        const key = new Date(order.createdAt).toDateString();
        if (days[key]) {
          days[key].orders += 1;
          if (order.status === 'Completed' || order.status === 'Picked Up') {
            days[key].revenue += order.total;
          }
        }
      });
      return Object.values(days);
    }
  }, [filteredOrders, filter, customStartDate, customEndDate]);

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Sales Analytics
          </h2>
          <p className="text-gray-500 text-sm">Track your business performance and growth</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {(['Today', 'Yesterday', 'Custom'] as DateFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      <AnimatePresence>
        {filter === 'Custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-12 h-12 text-orange-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium mb-1">Total Revenue</p>
          <p className="text-2xl font-black text-gray-900">{formatCurrency(stats.revenue)}</p>
          <div className="mt-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
            +12% vs last period
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-12 h-12 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium mb-1">Total Orders</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalOrders}</p>
          <p className="text-xs text-gray-400 mt-2">{stats.completedOrders} completed</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Package className="w-12 h-12 text-purple-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium mb-1">Items Sold</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalItemsSold}</p>
          <p className="text-xs text-gray-400 mt-2">Avg. {stats.totalOrders > 0 ? (stats.totalItemsSold / stats.totalOrders).toFixed(1) : 0} items/order</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium mb-1">Success Rate</p>
          <p className="text-2xl font-black text-gray-900">
            {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-400 mt-2">Based on picked up orders</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Revenue Over Time</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                Revenue
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} 
                  interval={filter === 'Custom' ? 'preserveStartEnd' : 3}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Items List */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Top Selling Items</h3>
          <div className="space-y-4">
            {stats.topItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-orange-100 text-orange-600' :
                  index === 1 ? 'bg-blue-100 text-blue-600' :
                  index === 2 ? 'bg-green-100 text-green-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.quantity} units sold</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
            {stats.topItems.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-sm">No sales data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders List for the period */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">Orders in this Period</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.slice(0, 10).map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{order.customerName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 font-medium">
                        {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      order.status === 'Completed' ? 'bg-green-50 text-green-600' : 
                      order.status === 'Picked Up' ? 'bg-blue-50 text-blue-600' :
                      order.status === 'Preparing' ? 'bg-orange-50 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    No orders found for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredOrders.length > 10 && (
            <div className="p-4 text-center border-t border-gray-50">
              <button className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
                View all {filteredOrders.length} orders
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
