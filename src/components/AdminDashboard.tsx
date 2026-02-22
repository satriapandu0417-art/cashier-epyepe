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

  // Stats
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  
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

  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'All') return true;
    return order.status === orderFilter;
  });

  const filterTabs: (OrderStatus | 'All')[] = ['All', 'Pending', 'Preparing', 'Completed', 'Picked Up', 'Cancelled'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl text-green-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Orders</p>
            <h3 className="text-2xl font-bold text-gray-900">{pendingOrders}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Completed Orders</p>
            <h3 className="text-2xl font-bold text-gray-900">{completedOrders}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === 'overview' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === 'orders' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Orders History
          {activeTab === 'orders' && (
            <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === 'menu' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Menu Management
          {activeTab === 'menu' && (
            <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === 'analytics' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Analytics
          {activeTab === 'analytics' && (
            <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Low Stock & Top Selling */}
            <div className="space-y-8">
              {/* Low Stock Alerts */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Low Stock Alerts
                  </h3>
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">
                    {lowStockItems.length} Items
                  </span>
                </div>
                <div className="space-y-3">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-red-600 font-medium">Min: {item.minStock} units</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-red-600">{item.stock}</p>
                        <p className="text-[10px] text-gray-400 uppercase">Current</p>
                      </div>
                    </div>
                  ))}
                  {lowStockItems.length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">All items well stocked</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Top Selling Products
                </h3>
                <div className="space-y-4">
                  {topSellingItems.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                          <div 
                            className="h-full bg-orange-500 rounded-full" 
                            style={{ width: `${(item.quantity / topSellingItems[0].quantity) * 100}%` }} 
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Recent Activity */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Recent Activity
                </h3>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => setSelectedOrderId(order.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:border-orange-100 hover:bg-orange-50/30 transition-all cursor-pointer group"
                  >
                    <div className={`p-3 rounded-xl ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-600' :
                      order.status === 'Preparing' ? 'bg-orange-100 text-orange-600' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.status === 'Preparing' ? <ChefHat className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 truncate">{order.customerName}</h4>
                        <span className="text-[10px] text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {order.items.length} items • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'Completed' ? 'text-green-600' :
                        order.status === 'Preparing' ? 'text-orange-600' :
                        order.status === 'Cancelled' ? 'text-red-600' :
                        'text-gray-400'
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
          <div className="space-y-4">
            {/* Order Status Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {filterTabs.map(status => (
                <button
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    orderFilter === status
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Column Headers */}
            <div className="hidden lg:grid grid-cols-[1fr_100px_120px_140px_100px] gap-4 px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <div>Order / Customer</div>
              <div className="text-right">Total</div>
              <div className="text-center">Payment</div>
              <div className="text-center">Status</div>
              <div className="text-right">Actions</div>
            </div>

            {filteredOrders.map(order => (
              <motion.div 
                key={order.id} 
                layoutId={`order-${order.id}`}
                onClick={() => setSelectedOrderId(order.id)}
                className={`bg-white p-4 lg:px-6 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:grid lg:grid-cols-[1fr_100px_120px_140px_100px] lg:items-center gap-4 cursor-pointer hover:shadow-md transition-all hover:border-orange-200 ${
                  order.status === 'Picked Up' ? 'opacity-75' : 
                  order.status === 'Cancelled' ? 'opacity-60 grayscale bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-600' :
                    order.status === 'Picked Up' ? 'bg-blue-100 text-blue-600' :
                    order.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                    order.status === 'Preparing' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {order.status === 'Preparing' ? <ChefHat className="w-5 h-5" /> : 
                     order.status === 'Picked Up' ? <ShoppingBag className="w-5 h-5" /> :
                     order.status === 'Cancelled' ? <XCircle className="w-5 h-5" /> :
                     <Package className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold text-gray-900 truncate ${order.status === 'Cancelled' ? 'line-through text-gray-500' : ''}`}>{order.customerName}</h4>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">#{order.id.slice(0, 8)}</span>
                      {order.status === 'Picked Up' && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {order.items.length} items • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="lg:text-right">
                  <p className={`font-bold text-gray-900 ${order.status === 'Cancelled' ? 'line-through text-gray-400' : ''}`}>
                    {formatCurrency(order.total)}
                  </p>
                </div>

                <div className="flex lg:justify-center">
                  <button
                    onClick={(e) => handleTogglePayment(e, order.id, order.paymentStatus)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                      order.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' 
                        : 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                    }`}
                    title={`Mark as ${order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'}`}
                  >
                    {order.paymentStatus}
                  </button>
                </div>

                <div className="flex lg:justify-center">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    order.status === 'Completed' ? 'bg-green-50 text-green-600 border border-green-100' : 
                    order.status === 'Picked Up' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    order.status === 'Preparing' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                    order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-100' :
                    'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex justify-end gap-1">
                  {order.status !== 'Cancelled' && order.status !== 'Picked Up' && (
                    <button
                      onClick={(e) => handleCancelOrder(e, order.id)}
                      className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Cancel Order"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteOrder(e, order.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No orders found</p>
              </div>
            )}
          </div>
        ) : activeTab === 'menu' ? (
          <div>
            <div className="flex justify-end mb-6">
              <button
                onClick={() => {
                  setEditingItem(undefined);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
              >
                <Plus className="w-4 h-4" />
                Add New Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menu.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm group hover:shadow-md transition-all overflow-hidden flex flex-col relative">
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {item.category}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id, item.name)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 mb-1 text-lg line-clamp-1">{item.name}</h4>
                    <p className="text-2xl font-black text-orange-600 mb-4">{formatCurrency(item.basePrice)}</p>
                    
                    <div className="space-y-3 mt-auto">
                      {item.stock !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Stock Status</span>
                          <span className={`font-bold ${
                            item.stock <= (item.minStock || 0) ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {item.stock} units
                          </span>
                        </div>
                      )}

                      {item.bundle?.enabled && (
                        <div className="pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 w-fit">
                            <Tag className="w-3 h-3" />
                            <span>Bundle: {item.bundle.buyQuantity} for {formatCurrency(item.bundle.bundlePrice)}</span>
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
