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
  AlertCircle
} from 'lucide-react';

export function AdminDashboard() {
  const { menu, orders, addMenuItem, updateMenuItem, deleteMenuItem, updateOrderStatus, updateOrderPaymentStatus, deleteOrder, isRealtime } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'analytics'>('overview');
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest mb-1">Today's Revenue</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(todayStats.revenue)}</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform duration-300">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest mb-1">Today's Orders</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{todayStats.ordersCount}</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform duration-300">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest mb-1">Items Sold</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{todayStats.itemsSold}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-100">
        {(['overview', 'orders', 'menu', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-5 text-sm font-extrabold uppercase tracking-widest transition-all relative ${
              activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Low Stock & Top Selling */}
            <div className="space-y-10">
              {/* Low Stock Alerts */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter text-xl">
                    <AlertCircle className="w-6 h-6 text-rose-500" />
                    Low Stock
                  </h3>
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                    {lowStockItems.length} Alert
                  </span>
                </div>
                <div className="space-y-4">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider">Min: {item.minStock}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-rose-600">{item.stock}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Left</p>
                      </div>
                    </div>
                  ))}
                  {lowStockItems.length === 0 && (
                    <div className="text-center py-10 text-slate-300">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest opacity-40">Stock is healthy</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tighter text-xl">
                  <TrendingUp className="w-6 h-6 text-indigo-500" />
                  Top Selling
                </h3>
                <div className="space-y-6">
                  {topSellingItems.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                        index === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <div className="w-full h-2 bg-slate-50 rounded-full mt-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.quantity / topSellingItems[0].quantity) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-indigo-500 rounded-full" 
                          />
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-900">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Recent Activity */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter text-xl">
                  <Clock className="w-6 h-6 text-indigo-500" />
                  Recent Activity
                </h3>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
                >
                  View All
                </button>
              </div>
              <div className="space-y-5">
                {recentOrders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => setSelectedOrderId(order.id)}
                    className="flex items-center gap-5 p-5 rounded-3xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all duration-300 cursor-pointer group"
                  >
                    <div className={`p-4 rounded-2xl shrink-0 ${
                      order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                      order.status === 'Preparing' ? 'bg-indigo-50 text-indigo-600' :
                      order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {order.status === 'Preparing' ? <ChefHat className="w-6 h-6" /> : 
                       order.status === 'Completed' ? <CheckCircle2 className="w-6 h-6" /> :
                       order.status === 'Cancelled' ? <XCircle className="w-6 h-6" /> :
                       <Package className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-slate-900 truncate text-base">{order.customerName}</h4>
                        <span className="text-[10px] text-slate-300 font-mono font-bold">#{order.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        {order.items.length} items • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-lg tracking-tight">{formatCurrency(order.total)}</p>
                      <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${
                        order.status === 'Completed' ? 'text-emerald-500' :
                        order.status === 'Preparing' ? 'text-indigo-500' :
                        order.status === 'Cancelled' ? 'text-rose-500' :
                        'text-slate-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'orders' ? (
          <div className="space-y-8">
            {/* Date Filters */}
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/40">
                {(['Today', 'Yesterday', 'Custom'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                      historyFilter === f
                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {historyFilter === 'Custom' && (
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">From</span>
                    <input
                      type="date"
                      value={customHistoryStart}
                      onChange={(e) => setCustomHistoryStart(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-700"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">To</span>
                    <input
                      type="date"
                      value={customHistoryEnd}
                      onChange={(e) => setCustomHistoryEnd(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-700"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Order Status Filters */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {filterTabs.map(status => (
                <button
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
                    orderFilter === status
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                      : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Grouped Orders List */}
            <div className="space-y-12">
              {groupedOrders.map(group => (
                <div key={group.date} className="space-y-6">
                  {/* Date Header & Summary */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-indigo-50 rounded-2xl shadow-inner">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-lg tracking-tight">{group.label}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{group.orders.length} Orders</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Revenue</p>
                        <p className="text-lg font-black text-slate-900 tracking-tight">{formatCurrency(group.stats.revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Items</p>
                        <p className="text-lg font-black text-slate-900 tracking-tight">{group.stats.items}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Success</p>
                        <p className="text-lg font-black text-emerald-600 tracking-tight">{group.stats.count}</p>
                      </div>
                    </div>
                  </div>

                  {/* Column Headers */}
                  <div className="hidden lg:grid grid-cols-[1fr_120px_140px_160px_120px] gap-6 px-8 py-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    <div>Order / Customer</div>
                    <div className="text-right">Total</div>
                    <div className="text-center">Payment</div>
                    <div className="text-center">Status</div>
                    <div className="text-right">Actions</div>
                  </div>

                  <div className="space-y-4">
                    {group.orders.map(order => (
                      <motion.div 
                        key={order.id} 
                        layoutId={`order-${order.id}`}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col lg:grid lg:grid-cols-[1fr_120px_140px_160px_120px] lg:items-center gap-6 cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:border-indigo-100 ${
                          order.status === 'Picked Up' ? 'opacity-75' : 
                          order.status === 'Cancelled' ? 'opacity-60 grayscale bg-slate-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`p-4 rounded-2xl shrink-0 ${
                            order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                            order.status === 'Picked Up' ? 'bg-sky-50 text-sky-600' :
                            order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                            order.status === 'Preparing' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                            {order.status === 'Preparing' ? <ChefHat className="w-6 h-6" /> : 
                             order.status === 'Picked Up' ? <ShoppingBag className="w-6 h-6" /> :
                             order.status === 'Cancelled' ? <XCircle className="w-6 h-6" /> :
                             order.status === 'Completed' ? <CheckCircle2 className="w-6 h-6" /> :
                             <Package className="w-6 h-6" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className={`font-black text-slate-900 truncate text-lg tracking-tight ${order.status === 'Cancelled' ? 'line-through text-slate-400' : ''}`}>{order.customerName}</h4>
                              <span className="text-[10px] text-slate-300 font-mono font-bold shrink-0">#{order.id.slice(0, 8)}</span>
                              {order.status === 'Picked Up' && <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">
                              {order.items.length} items • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="lg:text-right">
                          <p className={`font-black text-slate-900 text-lg tracking-tight ${order.status === 'Cancelled' ? 'line-through text-slate-300' : ''}`}>
                            {formatCurrency(order.total)}
                          </p>
                        </div>

                        <div className="flex lg:justify-center">
                          <button
                            onClick={(e) => handleTogglePayment(e, order.id, order.paymentStatus)}
                            className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest transition-all duration-200 hover:scale-105 active:scale-95 border-2 ${
                              order.paymentStatus === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                                : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                            }`}
                          >
                            {order.paymentStatus}
                          </button>
                        </div>

                        <div className="flex lg:justify-center">
                          <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2 ${
                            order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            order.status === 'Picked Up' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                            order.status === 'Preparing' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="flex justify-end gap-2">
                          {order.status !== 'Cancelled' && order.status !== 'Picked Up' && (
                            <button
                              onClick={(e) => handleCancelOrder(e, order.id)}
                              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                              title="Cancel Order"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteOrder(e, order.id)}
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
                            title="Delete Order"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
              {groupedOrders.length === 0 && (
                <div className="text-center py-32 text-slate-300">
                  <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-6">
                    <Package className="w-12 h-12 opacity-20" />
                  </div>
                  <p className="font-black text-sm uppercase tracking-[0.2em] opacity-40">No orders found</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'menu' ? (
          <div className="space-y-10">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingItem(undefined);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all duration-300 shadow-xl shadow-indigo-200 font-black text-sm uppercase tracking-widest"
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {menu.map(item => (
                <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 overflow-hidden flex flex-col relative">
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                        {item.category}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id, item.name)}
                          className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-black text-slate-900 mb-2 text-xl line-clamp-1 tracking-tight">{item.name}</h4>
                    <p className="text-3xl font-black text-indigo-600 mb-6 tracking-tighter">{formatCurrency(item.basePrice)}</p>
                    
                    <div className="space-y-4 mt-auto">
                      {item.stock !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Status</span>
                          <span className={`text-xs font-black px-3 py-1 rounded-lg ${
                            item.stock <= (item.minStock || 0) ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-900'
                          }`}>
                            {item.stock} Units
                          </span>
                        </div>
                      )}

                      {item.bundle?.enabled && (
                        <div className="pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 w-fit uppercase tracking-wider">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{item.bundle.buyQuantity} for {formatCurrency(item.bundle.bundlePrice)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
