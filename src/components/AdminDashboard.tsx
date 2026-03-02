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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 glass-panel p-10 lg:p-12 rounded-[3rem] relative overflow-hidden group">
          {/* Decorative Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent-primary)]/10 dark:bg-[var(--accent-primary)]/20 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-[var(--accent-primary)]/20 transition-colors duration-700" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] rounded-full -ml-20 -mb-20" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 purple-gradient rounded-2xl flex items-center justify-center text-white accent-shadow">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Today's Performance</p>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-end gap-8 md:gap-16">
                <div>
                  <h2 className="text-6xl lg:text-7xl font-black text-[var(--text-primary)] tracking-tighter mb-3">
                    {formatCurrency(todayStats.revenue)}
                  </h2>
                  <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-[0.2em]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
                    <span>+12.5% vs yesterday</span>
                  </div>
                </div>
                
                <div className="flex gap-12 pb-2">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Total Orders</p>
                    <p className="text-4xl font-black text-[var(--text-primary)]">{todayStats.ordersCount}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Success Rate</p>
                    <p className="text-4xl font-black text-[var(--text-primary)]">98.2%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Sales Trend (Last 7 Hours)</p>
                <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.2em] bg-[var(--accent-primary)]/10 px-4 py-1.5 rounded-full border border-[var(--accent-primary)]/20">Live Update</span>
              </div>
              <div className="h-32 w-full flex items-end gap-4">
                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1, duration: 1, ease: [0.25, 1, 0.5, 1] }}
                    className="flex-1 purple-gradient rounded-t-2xl opacity-30 hover:opacity-100 transition-all cursor-pointer relative group/bar"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-xl text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all duration-300 translate-y-2 group-hover/bar:translate-y-0">
                      {h}k
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-10 lg:p-12 rounded-[3rem] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-indigo-500/5 group-hover:from-[var(--accent-primary)]/10 group-hover:to-indigo-500/10 transition-colors duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Inventory Health</h3>
              <div className="p-3.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            
            <div className="space-y-6">
              {lowStockItems.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-color)] shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[var(--text-primary)] truncate tracking-tight">{item.name}</p>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-0.5">{item.stock} left</p>
                  </div>
                  <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 font-black text-xs border border-rose-500/20">
                    !
                  </div>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-20" />
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Inventory is healthy</p>
                </div>
              )}
            </div>
          </div>
          
          <button className="relative z-10 w-full py-4 bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-card)] transition-colors mt-8 shadow-sm">
            Manage Inventory
          </button>
        </div>
      </div>
      )}

      {/* Filter Controls & View Toggle */}
      {activeTab === 'orders' && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Order History</h3>
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Review and manage past transactions</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            {historyFilter === 'Custom' && (
              <div className="flex items-center gap-4 bg-[var(--bg-panel)] p-1.5 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="flex items-center gap-2 px-3">
                  <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">From</span>
                  <input
                    type="date"
                    value={customHistoryStart}
                    onChange={(e) => setCustomHistoryStart(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div className="w-px h-4 bg-[var(--border-color)]" />
                <div className="flex items-center gap-2 px-3">
                  <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">To</span>
                  <input
                    type="date"
                    value={customHistoryEnd}
                    onChange={(e) => setCustomHistoryEnd(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex bg-[var(--bg-panel)] backdrop-blur-md p-1.5 rounded-[2rem] border border-[var(--border-color)] shadow-inner w-fit">
              {['Today', 'Yesterday', 'Custom'].map((f) => (
                <button
                  key={f}
                  onClick={() => f === 'Today' ? setHistoryFilter('Today') : f === 'Yesterday' ? setHistoryFilter('Yesterday') : setHistoryFilter('Custom')}
                  className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    historyFilter === f
                      ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-md border border-[var(--border-color)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column: Order List */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Live Orders</h3>
                <div className="flex bg-[var(--bg-panel)] backdrop-blur-md p-1.5 rounded-2xl border border-[var(--border-color)] shadow-inner">
                  {['All', 'Preparing', 'Completed'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setOrderFilter(s as any)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        orderFilter === s
                          ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-color)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredOrders.slice(0, 6).map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="glass-card p-8 rounded-[3rem] hover:shadow-2xl hover:shadow-[var(--accent-glow)] transition-all duration-500 cursor-pointer group relative overflow-hidden"
                    >
                      {/* Hover Glow */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent-primary)]/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-[var(--accent-primary)]/15 transition-colors duration-500" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className="min-w-0">
                            <h4 className="font-black text-[var(--text-primary)] text-xl tracking-tight truncate group-hover:text-[var(--accent-primary)] transition-colors">{order.customerName}</h4>
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1.5">Order ID: {order.id.slice(0, 8)}</p>
                          </div>
                          <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                            order.paymentStatus === 'Paid' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {order.paymentStatus}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[var(--bg-panel)] rounded-2xl flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border-color)]">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-[var(--text-primary)] tracking-tight">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Time</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[var(--bg-panel)] rounded-2xl flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border-color)]">
                              <Package className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-[var(--text-primary)] tracking-tight">{order.items.length} Items</span>
                              <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Count</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-8 border-t border-[var(--border-color)]">
                          <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{formatCurrency(order.total)}</span>
                          <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                            order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            order.status === 'Preparing' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 animate-pulse-glow' :
                            order.status === 'Picked Up' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                            'bg-[var(--bg-panel)] text-[var(--text-secondary)] border-[var(--border-color)]'
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
            <div className="space-y-8 lg:space-y-12">
              <div className="glass-panel p-10 lg:p-12 rounded-[3rem]">
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-10">Top Selling</h3>
                <div className="space-y-8">
                  {topSellingItems.slice(0, 4).map((item, index) => (
                    <div key={item.name} className="flex items-center gap-5 group">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 transition-transform group-hover:scale-110 ${
                        index === 0 ? 'purple-gradient text-white accent-shadow' : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[var(--text-primary)] truncate tracking-tight">{item.name}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1 h-2 bg-[var(--bg-panel)] rounded-full overflow-hidden border border-[var(--border-color)]">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.quantity / topSellingItems[0].quantity) * 100}%` }}
                              className="h-full purple-gradient rounded-full"
                            />
                          </div>
                          <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-10 lg:p-12 rounded-[3rem] bg-[var(--bg-panel)] relative overflow-hidden border-[var(--border-color)]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent-primary)]/20 blur-[50px] rounded-full -mr-10 -mt-10" />
                <h3 className="text-xl font-black uppercase tracking-tighter mb-6 relative z-10 text-[var(--text-primary)]">System Status</h3>
                <div className="space-y-5 relative z-10">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    <span>Database</span>
                    <span className="text-emerald-500">Online</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    <span>Realtime Sync</span>
                    <span className="text-emerald-500">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    <span>Last Backup</span>
                    <span>2m ago</span>
                  </div>
                </div>
                <button className="w-full py-4 bg-[var(--bg-card)] hover:bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mt-10 text-[var(--text-primary)]">
                  View System Logs
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'orders' ? (
          <div className="space-y-12">
            {groupedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 glass-panel rounded-[3rem] opacity-40">
                <Calendar className="w-16 h-16 mb-6 text-[var(--text-secondary)]" />
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">No orders found</h3>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-2">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <div className="space-y-12">
                {groupedOrders.map(group => (
                  <div key={group.date} className="space-y-8">
                    <div className="flex items-center justify-between px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 purple-gradient rounded-full" />
                        <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter">{group.label}</h3>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Revenue</span>
                          <span className="text-sm font-black text-emerald-500">{formatCurrency(group.stats.revenue)}</span>
                        </div>
                        <div className="w-px h-8 bg-[var(--border-color)]" />
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Volume</span>
                          <span className="text-sm font-black text-[var(--text-primary)]">{group.orders.length} Orders</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                      {group.orders.map(order => (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => setSelectedOrderId(order.id)}
                          className="glass-card p-8 rounded-[3rem] hover:shadow-2xl hover:shadow-[var(--accent-glow)] transition-all duration-500 cursor-pointer group relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className="min-w-0">
                              <h4 className="font-black text-[var(--text-primary)] text-lg tracking-tight truncate group-hover:text-[var(--accent-primary)] transition-colors">{order.customerName}</h4>
                              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1">Order #{order.id.slice(0, 8)}</p>
                            </div>
                            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                              order.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {order.paymentStatus}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-6 border-t border-[var(--border-color)]">
                            <div className="flex flex-col">
                              <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">{formatCurrency(order.total)}</span>
                              <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1">{order.items.length} items</span>
                            </div>
                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-2xl uppercase tracking-widest border ${
                              order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              order.status === 'Preparing' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20' :
                              order.status === 'Picked Up' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                              order.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                              'bg-[var(--bg-panel)] text-[var(--text-secondary)] border-[var(--border-color)]'
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
            )}
          </div>
        ) : activeTab === 'menu' ? (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Menu Items</h3>
                <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest mt-1">Manage your products and inventory</p>
              </div>
              <button
                onClick={() => {
                  setEditingItem(undefined);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-3 px-8 py-4 purple-gradient text-white rounded-2xl accent-shadow font-black text-[10px] uppercase tracking-widest hover:-translate-y-1 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Add New Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {menu.map(item => (
                <motion.div 
                  key={item.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-[2.5rem] group hover:shadow-2xl hover:shadow-[var(--accent-glow)] transition-all duration-500 overflow-hidden flex flex-col relative"
                >
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[9px] font-black text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] border border-[var(--accent-primary)]/20">
                        {item.category}
                      </span>
                      <div className="flex gap-2 transition-all duration-300">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-9 h-9 flex items-center justify-center bg-[var(--bg-card)] text-[var(--accent-primary)] rounded-xl hover:bg-[var(--accent-primary)] hover:text-white transition-all duration-300 border border-[var(--border-color)] shadow-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id, item.name)}
                          className="w-9 h-9 flex items-center justify-center bg-[var(--bg-card)] text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-300 border border-[var(--border-color)] shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-black text-[var(--text-primary)] mb-2 text-xl line-clamp-1 tracking-tight group-hover:text-[var(--accent-primary)] transition-colors">{item.name}</h4>
                    <p className="text-3xl font-black text-[var(--text-primary)] mb-8 tracking-tighter">{formatCurrency(item.basePrice)}</p>
                    
                    <div className="space-y-4 mt-auto">
                      {item.stock !== undefined && (
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-color)]">
                          <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Stock Status</span>
                          <span className={`text-xs font-black px-3 py-1 rounded-lg ${
                            item.stock <= (item.minStock || 0) ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {item.stock} Units
                          </span>
                        </div>
                      )}

                      {item.bundle?.enabled && (
                        <div className="pt-4 border-t border-[var(--border-color)]">
                          <div className="flex items-center gap-2 text-[9px] font-black text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-2 rounded-xl border border-[var(--accent-primary)]/20 w-fit uppercase tracking-wider animate-pulse-glow">
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
