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
import { TrendingUp, ShoppingBag, CheckCircle2, Clock, Calendar, Package, ChevronLeft, ChevronRight, Filter, Search, DollarSign } from 'lucide-react';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4 tracking-tight uppercase">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            Sales Analytics
          </h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Track your business performance and growth</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/40">
          {(['Today', 'Yesterday', 'Custom'] as DateFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                filter === f
                  ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50'
                  : 'text-slate-400 hover:text-slate-600'
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
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">From</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-700"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">To</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-700"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <DollarSign className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Total Revenue</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.revenue)}</p>
          <div className="mt-4 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit uppercase tracking-widest">
            +12% vs last period
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <ShoppingBag className="w-16 h-16 text-indigo-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Total Orders</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalOrders}</p>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-3">{stats.completedOrders} completed</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Package className="w-16 h-16 text-amber-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Items Sold</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalItemsSold}</p>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-3">Avg. {stats.totalOrders > 0 ? (stats.totalItemsSold / stats.totalOrders).toFixed(1) : 0} items/order</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Success Rate</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-3">Based on picked up orders</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl">Revenue Over Time</h3>
            <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Revenue
              </div>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 900 }} 
                  interval={filter === 'Custom' ? 'preserveStartEnd' : 3}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 900 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '16px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Items List */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 mb-8 uppercase tracking-tighter text-xl">Top Selling Items</h3>
          <div className="space-y-6">
            {stats.topItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                  index === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' :
                  index === 1 ? 'bg-indigo-100 text-indigo-600' :
                  index === 2 ? 'bg-indigo-50 text-indigo-400' :
                  'bg-slate-50 text-slate-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{item.quantity} units sold</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 tracking-tight">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
            {stats.topItems.length === 0 && (
              <div className="text-center py-20 text-slate-300">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest opacity-40">No sales data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders List for the period */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl">Orders in this Period</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Order ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Customer</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Date & Time</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.slice(0, 10).map(order => (
                <tr key={order.id} className="hover:bg-indigo-50/20 transition-colors group cursor-default">
                  <td className="px-8 py-6">
                    <span className="text-xs font-mono font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-base font-bold text-slate-900">{order.customerName}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-900 font-black tracking-tight">
                        {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-lg font-black text-slate-900 tracking-tight">{formatCurrency(order.total)}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2 ${
                      order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      order.status === 'Picked Up' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                      order.status === 'Preparing' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-300">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-black uppercase tracking-widest opacity-40">No orders found for this period</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredOrders.length > 10 && (
            <div className="p-6 text-center border-t border-slate-50">
              <button className="text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest">
                View all {filteredOrders.length} orders
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
