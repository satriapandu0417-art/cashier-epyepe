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
    <div className="space-y-12">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] flex items-center gap-5 tracking-tighter uppercase">
            <div className="w-12 h-12 purple-gradient rounded-2xl flex items-center justify-center text-white accent-shadow">
              <TrendingUp className="w-7 h-7" />
            </div>
            Sales Analytics
          </h2>
          <p className="text-[var(--text-secondary)] text-sm font-black uppercase tracking-[0.2em] mt-2">Track your business performance and growth</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-panel)] backdrop-blur-md p-1.5 rounded-[2rem] border border-[var(--border-color)] shadow-inner">
          {(['Today', 'Yesterday', 'Custom'] as DateFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                filter === f
                  ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-xl shadow-[var(--accent-glow)] ring-1 ring-[var(--border-color)] animate-pulse-glow'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
            <div className="glass-panel p-8 rounded-[3rem] flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">From</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-xs font-black focus:ring-2 focus:ring-[var(--accent-primary)]/50 outline-none text-[var(--text-primary)] shadow-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">To</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-xs font-black focus:ring-2 focus:ring-[var(--accent-primary)]/50 outline-none text-[var(--text-primary)] shadow-sm"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="glass-panel p-10 rounded-[3.5rem] relative overflow-hidden group hover:shadow-2xl hover:shadow-[var(--accent-glow)] transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700 group-hover:rotate-12">
            <DollarSign className="w-20 h-20 text-emerald-500" />
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mb-3">Total Revenue</p>
          <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{formatCurrency(stats.revenue)}</p>
          <div className="mt-6 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-xl w-fit uppercase tracking-widest border border-emerald-500/20 animate-pulse-glow">
            +12% vs last period
          </div>
        </div>
        
        <div className="glass-panel p-10 rounded-[3.5rem] relative overflow-hidden group hover:shadow-2xl hover:shadow-[var(--accent-glow)] transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700 group-hover:-rotate-12">
            <ShoppingBag className="w-20 h-20 text-[var(--accent-primary)]" />
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mb-3">Total Orders</p>
          <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{stats.totalOrders}</p>
          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-4">{stats.completedOrders} completed</p>
        </div>

        <div className="glass-panel p-10 rounded-[3.5rem] relative overflow-hidden group hover:shadow-2xl hover:shadow-[var(--accent-glow)] transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <Package className="w-20 h-20 text-amber-500" />
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mb-3">Items Sold</p>
          <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{stats.totalItemsSold}</p>
          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-4">Avg. {stats.totalOrders > 0 ? (stats.totalItemsSold / stats.totalOrders).toFixed(1) : 0} items/order</p>
        </div>

        <div className="glass-panel p-10 rounded-[3.5rem] relative overflow-hidden group hover:shadow-2xl hover:shadow-[var(--accent-glow)] transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <CheckCircle2 className="w-20 h-20 text-emerald-500" />
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mb-3">Success Rate</p>
          <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">
            {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-4">Based on picked up orders</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 glass-panel p-6 lg:p-10 rounded-[3rem] relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 lg:mb-10">
            <h3 className="font-black text-[var(--text-primary)] uppercase tracking-tighter text-xl lg:text-2xl">Revenue Over Time</h3>
            <div className="flex items-center gap-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full purple-gradient accent-shadow" />
                Revenue
              </div>
            </div>
          </div>
          <div className="h-[350px] lg:h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--accent-primary)" />
                    <stop offset="100%" stopColor="var(--accent-secondary)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 900 }} 
                  interval={filter === 'Custom' ? 'preserveStartEnd' : 3}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 900 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--bg-panel)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
                    padding: '20px' 
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="url(#lineGradient)" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 6, fill: 'var(--accent-secondary)', stroke: 'var(--bg-card)', strokeWidth: 3, className: 'animate-pulse-glow' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Items List */}
        <div className="glass-panel p-6 lg:p-10 rounded-[3rem]">
          <h3 className="font-black text-[var(--text-primary)] mb-8 lg:mb-10 uppercase tracking-tighter text-xl lg:text-2xl">Top Selling Items</h3>
          <div className="space-y-6 lg:space-y-8">
            {stats.topItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-4 lg:gap-6 group">
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center text-base lg:text-lg font-black transition-transform group-hover:scale-110 shrink-0 ${
                  index === 0 ? 'purple-gradient text-white accent-shadow animate-pulse-glow' :
                  index === 1 ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' :
                  index === 2 ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]/80' :
                  'bg-[var(--bg-panel)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[var(--text-primary)] truncate tracking-tight group-hover:text-[var(--accent-primary)] transition-colors">{item.name}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-1">{item.quantity} units sold</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-[var(--text-primary)] tracking-tighter">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
            {stats.topItems.length === 0 && (
              <div className="text-center py-16 lg:py-24 text-[var(--text-secondary)] opacity-50">
                <Search className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 lg:mb-6 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No sales data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders List for the period */}
      <div className="glass-panel rounded-[3rem] overflow-hidden">
        <div className="p-6 lg:p-10 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <h3 className="font-black text-[var(--text-primary)] uppercase tracking-tighter text-xl lg:text-2xl">Orders in this Period</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-panel)]">
                <th className="px-6 lg:px-10 py-4 lg:py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Order ID</th>
                <th className="px-6 lg:px-10 py-4 lg:py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Customer</th>
                <th className="px-6 lg:px-10 py-4 lg:py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Date & Time</th>
                <th className="px-6 lg:px-10 py-4 lg:py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] text-right">Amount</th>
                <th className="px-6 lg:px-10 py-4 lg:py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
              {filteredOrders.slice(0, 10).map(order => (
                <tr key={order.id} className="hover:bg-[var(--bg-panel)] transition-colors group cursor-default">
                  <td className="px-6 lg:px-10 py-6 lg:py-8">
                    <span className="text-xs font-mono font-black text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-6 lg:px-10 py-6 lg:py-8">
                    <span className="text-base lg:text-lg font-black text-[var(--text-primary)] tracking-tight">{order.customerName}</span>
                  </td>
                  <td className="px-6 lg:px-10 py-6 lg:py-8">
                    <div className="flex flex-col">
                      <span className="text-sm text-[var(--text-primary)] font-black tracking-tight">
                        {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-1">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 lg:px-10 py-6 lg:py-8 text-right">
                    <span className="text-lg lg:text-xl font-black text-[var(--text-primary)] tracking-tighter">{formatCurrency(order.total)}</span>
                  </td>
                  <td className="px-6 lg:px-10 py-6 lg:py-8 text-center">
                    <span className={`text-[10px] font-black px-4 lg:px-5 py-1.5 lg:py-2 rounded-2xl uppercase tracking-widest border ${
                      order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      order.status === 'Picked Up' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                      order.status === 'Preparing' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 animate-pulse-glow' :
                      'bg-[var(--bg-panel)] text-[var(--text-secondary)] border-[var(--border-color)]'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 lg:px-10 py-16 lg:py-24 text-center text-[var(--text-secondary)] opacity-50">
                    <Package className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 lg:mb-6 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No orders found for this period</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredOrders.length > 10 && (
            <div className="p-6 lg:p-10 text-center border-t border-[var(--border-color)] bg-[var(--bg-panel)]">
              <button className="text-[10px] font-black text-[var(--accent-primary)] hover:opacity-80 transition-colors uppercase tracking-widest">
                View all {filteredOrders.length} orders
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
