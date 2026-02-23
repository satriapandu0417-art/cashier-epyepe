import { useState, useMemo } from 'react';
import React from 'react';
import { useStore } from '../hooks/useStore';
import { formatCurrency } from '../utils';
import { ItemModal } from './ItemModal';
import { OrderDetailPanel } from './OrderDetailPanel';
import { DailyAnalytics } from './DailyAnalytics';
import { ConfirmationModal } from './ConfirmationModal';
import { MenuItem, Order, OrderStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutGrid, 
  List, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Calendar,
  MoreVertical,
  DollarSign,
  Package,
  ChefHat,
  ShoppingBag,
  Lock,
  Wifi,
  WifiOff,
  Tag,
  AlertCircle,
  Store
} from 'lucide-react';

export function AdminDashboard({ activeTab }: { activeTab: 'dashboard' | 'orders' | 'menu' | 'analytics' }) {
  const { menu, orders, addMenuItem, updateMenuItem, deleteMenuItem, updateOrderStatus, updateOrderPaymentStatus, deleteOrder, isRealtime } = useStore();
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'All'>('All');
  const [historyFilter, setHistoryFilter] = useState<'Today' | 'Yesterday' | 'Custom'>('Today');
  const [customHistoryStart, setCustomHistoryStart] = useState(new Date().toISOString().split('T')[0]);
  const [customHistoryEnd, setCustomHistoryEnd] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  });

  // Derive selectedOrder from the live orders array to ensure updates (like checklist toggles) reflect immediately
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

  // Today's Stats
  const todayStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).getTime();
      return orderDay === today && o.status !== 'Cancelled';
    });

    const revenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const itemsSold = todayOrders.reduce((sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0), 0);

    return {
      revenue,
      ordersCount: todayOrders.length,
      itemsSold
    };
  }, [orders]);

  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing').length;
  const completedOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Picked Up').length;

  // Low Stock Items
  const lowStockItems = menu.filter(item => item.stock !== undefined && item.minStock !== undefined && item.stock <= item.minStock);

  // Recent Activity (Latest 5 orders)
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // Top Selling (Overall)
  const topSellingItems = useMemo(() => {
    const itemMap = new Map<string, { name: string, quantity: number }>();
    orders.filter(o => o.status !== 'Cancelled').forEach(order => {
      order.items.forEach(item => {
        const existing = itemMap.get(item.id) || { name: item.name, quantity: 0 };
        existing.quantity += item.quantity;
        itemMap.set(item.id, existing);
      });
    });
    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [orders]);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveItem = (itemData: Omit<MenuItem, 'id'>) => {
    if (editingItem) {
      updateMenuItem(editingItem.id, itemData);
    } else {
      addMenuItem(itemData);
    }
    setEditingItem(undefined);
  };

  const handleDeleteOrder = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Order',
      message: 'Are you sure you want to permanently delete this order? This action cannot be undone.',
      onConfirm: () => deleteOrder(orderId),
    });
  };

  const handleDeleteMenuItem = (itemId: string, itemName: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Menu Item',
      message: `Are you sure you want to delete "${itemName}"? This will remove it from the menu permanently.`,
      onConfirm: () => deleteMenuItem(itemId),
    });
  };

  const handleCancelOrder = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This will stop all preparation and mark it as cancelled.',
      onConfirm: () => updateOrderStatus(orderId, 'Cancelled'),
      variant: 'warning',
    });
  };

  const handleTogglePayment = (e: React.MouseEvent, orderId: string, currentStatus: Order['paymentStatus']) => {
    e.stopPropagation();
    const nextStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    updateOrderPaymentStatus(orderId, nextStatus);
  };

  // Grouped Orders for History
  const groupedOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - (24 * 60 * 60 * 1000);

    const filtered = orders.filter(order => {
      // Status filter
      if (orderFilter !== 'All' && order.status !== orderFilter) return false;

      // Date filter
      const orderDate = new Date(order.createdAt);
      const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).getTime();

      if (historyFilter === 'Today') return orderDay === today;
      if (historyFilter === 'Yesterday') return orderDay === yesterday;
      if (historyFilter === 'Custom') {
        const start = new Date(customHistoryStart);
        const end = new Date(customHistoryEnd);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });

    // Group by date
    const groups: Record<string, { 
      date: string, 
      label: string, 
      orders: Order[],
      stats: { revenue: number, count: number, items: number }
    }> = {};

    filtered.forEach(order => {
      const d = new Date(order.createdAt);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      if (!groups[key]) {
        let label = d.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const dayTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        if (dayTime === today) label = 'Today';
        else if (dayTime === yesterday) label = 'Yesterday';

        groups[key] = {
          date: key,
          label,
          orders: [],
          stats: { revenue: 0, count: 0, items: 0 }
        };
      }
      groups[key].orders.push(order);
      if (order.status !== 'Cancelled') {
        groups[key].stats.revenue += order.total;
        groups[key].stats.count += 1;
        groups[key].stats.items += order.items.reduce((sum, i) => sum + i.quantity, 0);
      }
    });

    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, orderFilter, historyFilter, customHistoryStart, customHistoryEnd]);

  const filterTabs: (OrderStatus | 'All')[] = ['All', 'Pending', 'Preparing', 'Completed', 'Picked Up', 'Cancelled'];

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (orderFilter !== 'All' && o.status !== orderFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, orderFilter]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-12">
      {/* Hero Summary Card */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 glass-panel p-12 rounded-[3.5rem] relative overflow-hidden group purple-glow">
          {/* Decorative Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-purple-500/20 transition-colors duration-700" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -ml-20 -mb-20" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 purple-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Today's Performance</p>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12">
                <div>
                  <h2 className="text-7xl font-black text-slate-900 tracking-tighter mb-2">
                    {formatCurrency(todayStats.revenue)}
                  </h2>
                  <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>+12.5% vs yesterday</span>
                  </div>
                </div>
                
                <div className="flex gap-10 pb-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Orders</p>
                    <p className="text-3xl font-black text-slate-900">{todayStats.ordersCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Success Rate</p>
                    <p className="text-3xl font-black text-slate-900">98.2%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sales Trend (Last 7 Hours)</p>
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">Live Update</span>
              </div>
              <div className="h-24 w-full flex items-end gap-3">
                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1, duration: 1 }}
                    className="flex-1 purple-gradient rounded-t-xl opacity-20 hover:opacity-100 transition-all cursor-pointer relative group/bar"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      {h}k
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-10 rounded-[3.5rem] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-colors duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Inventory Health</h3>
              <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            
            <div className="space-y-6">
              {lowStockItems.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate tracking-tight">{item.name}</p>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-0.5">{item.stock} left</p>
                  </div>
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 font-black text-xs">
                    !
                  </div>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-20" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Inventory is healthy</p>
                </div>
              )}
            </div>
          </div>
          
          <button className="relative z-10 w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors mt-8">
            Manage Inventory
          </button>
        </div>
      </div>
      )}

      {/* Filter Controls & View Toggle */}
      {activeTab === 'orders' && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-8">
          <div className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-[2rem] border border-white/60 shadow-inner w-fit">
            {['Today', 'Yesterday', 'Custom'].map((f) => (
              <button
                key={f}
                onClick={() => f === 'Today' ? setHistoryFilter('Today') : f === 'Yesterday' ? setHistoryFilter('Yesterday') : setHistoryFilter('Custom')}
                className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  historyFilter === f
                    ? 'bg-white text-purple-600 shadow-xl shadow-purple-100 ring-1 ring-white/50 purple-glow'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Order List */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Live Orders</h3>
                <div className="flex bg-white/40 backdrop-blur-md p-1 rounded-2xl border border-white/60 shadow-inner">
                  {['All', 'Preparing', 'Completed'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setOrderFilter(s as any)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        orderFilter === s
                          ? 'bg-white text-purple-600 shadow-md ring-1 ring-white/50'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredOrders.slice(0, 6).map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="glass-card p-8 rounded-[3rem] hover:shadow-2xl hover:shadow-purple-200/30 transition-all duration-500 cursor-pointer group relative overflow-hidden border-white/60"
                    >
                      {/* Hover Glow */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/15 transition-colors duration-500" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className="min-w-0">
                            <h4 className="font-black text-slate-900 text-xl tracking-tight truncate group-hover:text-purple-600 transition-colors">{order.customerName}</h4>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">Order ID: {order.id.slice(0, 8)}</p>
                          </div>
                          <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                            order.paymentStatus === 'Paid' 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 neon-green-glow' 
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {order.paymentStatus}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900 tracking-tight">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Time</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                              <Package className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900 tracking-tight">{order.items.length} Items</span>
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Count</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-8 border-t border-white/40">
                          <span className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(order.total)}</span>
                          <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                            order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            order.status === 'Preparing' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 purple-glow' :
                            order.status === 'Picked Up' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Top Sellers & Activity */}
            <div className="space-y-12">
              <div className="glass-panel p-10 rounded-[3.5rem]">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8">Top Selling</h3>
                <div className="space-y-8">
                  {topSellingItems.slice(0, 4).map((item, index) => (
                    <div key={item.name} className="flex items-center gap-5 group">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 transition-transform group-hover:scale-110 ${
                        index === 0 ? 'purple-gradient text-white shadow-lg shadow-purple-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate tracking-tight">{item.name}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.quantity / topSellingItems[0].quantity) * 100}%` }}
                              className="h-full purple-gradient rounded-full"
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-10 rounded-[3.5rem] bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[40px] rounded-full -mr-10 -mt-10" />
                <h3 className="text-lg font-black uppercase tracking-tighter mb-4 relative z-10">System Status</h3>
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <span>Database</span>
                    <span className="text-emerald-500">Online</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <span>Realtime Sync</span>
                    <span className="text-emerald-500">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <span>Last Backup</span>
                    <span>2m ago</span>
                  </div>
                </div>
                <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mt-8">
                  View System Logs
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'orders' ? (
          <div className="space-y-12">
            {/* Grouped Orders List (Glass Style) */}
            {groupedOrders.map(group => (
              <div key={group.date} className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{group.label}</h3>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{group.orders.length} Orders</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {group.orders.map(order => (
                    <motion.div
                      key={order.id}
                      layout
                      onClick={() => setSelectedOrderId(order.id)}
                      className="glass-card p-8 rounded-[3rem] hover:shadow-2xl hover:shadow-purple-200/20 transition-all duration-500 cursor-pointer group relative overflow-hidden border-white/60"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-900 text-lg tracking-tight truncate group-hover:text-purple-600 transition-colors">{order.customerName}</h4>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Order #{order.id.slice(0, 8)}</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                          order.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {order.paymentStatus}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-white/40">
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(order.total)}</span>
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-2xl uppercase tracking-widest border ${
                          order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          order.status === 'Preparing' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'menu' ? (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Menu Items</h3>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-1">Manage your products and inventory</p>
              </div>
              <button
                onClick={() => {
                  setEditingItem(undefined);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-3 px-8 py-4 purple-gradient text-white rounded-2xl shadow-xl shadow-purple-200 font-black text-[10px] uppercase tracking-widest hover:-translate-y-1 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Add New Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {menu.map(item => (
                <motion.div 
                  key={item.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-[2.5rem] group hover:shadow-2xl hover:shadow-purple-200/20 transition-all duration-500 overflow-hidden flex flex-col relative"
                >
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-lg uppercase tracking-[0.2em] border border-purple-100">
                        {item.category}
                      </span>
                      <div className="flex gap-2 transition-all duration-300">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-9 h-9 flex items-center justify-center bg-white/60 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all duration-300 border border-white/60 shadow-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id, item.name)}
                          className="w-9 h-9 flex items-center justify-center bg-white/60 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all duration-300 border border-white/60 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-black text-slate-900 mb-2 text-xl line-clamp-1 tracking-tight group-hover:text-purple-600 transition-colors">{item.name}</h4>
                    <p className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">{formatCurrency(item.basePrice)}</p>
                    
                    <div className="space-y-4 mt-auto">
                      {item.stock !== undefined && (
                        <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Stock Status</span>
                          <span className={`text-xs font-black px-3 py-1 rounded-lg ${
                            item.stock <= (item.minStock || 0) ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          }`}>
                            {item.stock} Units
                          </span>
                        </div>
                      )}

                      {item.bundle?.enabled && (
                        <div className="pt-4 border-t border-white/40">
                          <div className="flex items-center gap-2 text-[9px] font-black text-purple-600 bg-purple-500/10 px-3 py-2 rounded-xl border border-purple-500/20 w-fit uppercase tracking-wider purple-glow">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{item.bundle.buyQuantity} for {formatCurrency(item.bundle.bundlePrice)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <DailyAnalytics orders={orders} />
        )}
      </div>

      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
      />

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
      />

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailPanel 
            order={selectedOrder} 
            onClose={() => setSelectedOrderId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
