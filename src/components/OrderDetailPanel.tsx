import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, CartItem, MenuItem } from '../types';
import { formatCurrency, calculateItemTotal } from '../utils';
import { X, CheckCircle2, Clock, ChefHat, AlertCircle, ShoppingBag, Lock, Trash2, XCircle, Tag, Edit, Save, Undo, Plus, Minus, Search } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { ConfirmationModal } from './ConfirmationModal';

interface OrderDetailPanelProps {
  order: Order;
  onClose: () => void;
}

export function OrderDetailPanel({ order, onClose }: OrderDetailPanelProps) {
  const { menu, toggleOrderItemPrepared, updateOrderStatus, updateOrderPaymentStatus, deleteOrder, updateOrder } = useStore();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [editedItems, setEditedItems] = useState<CartItem[]>([]);
  const [editedNote, setEditedNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setEditedItems(order.items);
      setEditedNote(order.note || '');
    }
  }, [isEditing]); // Only run when isEditing toggles to true

  const totalItems = order.items.length;
  const preparedItems = order.items.filter(i => i.isPrepared).length;
  const progress = totalItems > 0 ? (preparedItems / totalItems) * 100 : 0;
  const isAllPrepared = preparedItems === totalItems && totalItems > 0;
  const isPickedUp = order.status === 'Picked Up';
  const isCompleted = order.status === 'Completed';
  const isPaid = order.paymentStatus === 'Paid';

  // Editing is blocked if completed AND fully paid
  const isEditBlocked = (isCompleted || isPickedUp) && isPaid;

  const originalTotal = order.items.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
  const totalDiscount = originalTotal - order.total;

  const editedSubtotal = useMemo(() => 
    editedItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0)
  , [editedItems]);

  const editedTotal = useMemo(() => 
    editedItems.reduce((sum, item) => sum + calculateItemTotal(item, item.quantity), 0)
  , [editedItems]);

  const editedDiscount = editedSubtotal - editedTotal;

  const handleTogglePayment = () => {
    const nextStatus = order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    updateOrderPaymentStatus(order.id, nextStatus);
  };

  const handleDelete = () => {
    deleteOrder(order.id);
    onClose();
  };

  const handleCancel = () => {
    updateOrderStatus(order.id, 'Cancelled');
    onClose();
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setEditedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        // If quantity increases, reset prepared status
        const isPrepared = delta > 0 ? false : item.isPrepared;
        return { ...item, quantity: newQty, isPrepared };
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setEditedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddItem = (menuItem: MenuItem) => {
    setEditedItems(prev => {
      const existing = prev.find(i => i.id === menuItem.id);
      if (existing) {
        // Reset prepared status if adding more of the same item
        return prev.map(i => i.id === menuItem.id ? { ...i, quantity: i.quantity + 1, isPrepared: false } : i);
      }
      return [...prev, { ...menuItem, quantity: 1, isPrepared: false }];
    });
    setShowAddMenu(false);
    setSearchQuery('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    const changes: string[] = [];
    
    // Track removed items
    order.items.forEach(oldItem => {
      if (!editedItems.find(newItem => newItem.id === oldItem.id)) {
        changes.push(`Removed ${oldItem.name}`);
      }
    });

    // Track added or changed items
    editedItems.forEach(newItem => {
      const oldItem = order.items.find(i => i.id === newItem.id);
      if (!oldItem) {
        changes.push(`Added ${newItem.name} (x${newItem.quantity})`);
      } else if (oldItem.quantity !== newItem.quantity) {
        changes.push(`Changed ${newItem.name} quantity: ${oldItem.quantity} -> ${newItem.quantity}`);
      }
    });

    if (order.note !== editedNote) {
      changes.push(`Updated note`);
    }

    if (changes.length === 0) {
      setIsEditing(false);
      return;
    }

    const newLog = {
      timestamp: new Date().toISOString(),
      changes: changes.join(', ')
    };

    // Recalculate status based on new items
    const totalItems = editedItems.length;
    const preparedCount = editedItems.filter(i => i.isPrepared).length;
    
    let newStatus = order.status;
    if (order.status !== 'Cancelled' && order.status !== 'Picked Up') {
      if (preparedCount === 0) {
        newStatus = 'Pending';
      } else if (preparedCount === totalItems) {
        newStatus = 'Completed';
      } else {
        newStatus = 'Preparing';
      }
    }

    const success = await updateOrder(order.id, {
      items: editedItems,
      total: editedTotal,
      status: newStatus,
      note: editedNote,
      editHistory: [...(order.editHistory || []), newLog]
    });

    setIsSaving(false);
    if (success) {
      setSaveStatus('success');
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus('idle');
      }, 1500);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const filteredMenu = menu.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 bg-white">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order #{order.id.slice(0, 8)}</h2>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 flex items-center gap-2 ${
                    order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    order.status === 'Preparing' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    order.status === 'Picked Up' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                    order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    {isPickedUp && <Lock className="w-3.5 h-3.5" />}
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-extrabold uppercase tracking-widest">{order.customerName}</p>
              </div>
              <div className="flex items-center gap-3">
                {!isEditing && !isEditBlocked && order.status !== 'Cancelled' && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300"
                    title="Edit Order"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
                <Clock className="w-4 h-4 text-slate-300" />
                <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePayment}
                  className={`flex items-center gap-3 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:scale-105 active:scale-95 border-2 ${
                    order.paymentStatus === 'Paid'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{order.paymentStatus}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Summary & Status */}
            <div className="w-96 border-r border-slate-100 bg-[#F8F9FA] overflow-y-auto">
              <div className="p-8 space-y-10">
                {/* Progress Section */}
                <div className="space-y-5">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3 text-indigo-600">
                      <ChefHat className="w-6 h-6" />
                      <h3 className="text-xs font-black uppercase tracking-widest">Kitchen Status</h3>
                    </div>
                    <span className="text-sm font-black text-slate-900">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className={`h-full rounded-full ${isAllPrepared ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Totals Section */}
                <div className="space-y-6 pt-8 border-t border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                      <span className="text-slate-900 font-black tracking-tight">{formatCurrency(isEditing ? editedSubtotal : originalTotal)}</span>
                    </div>
                    
                    {(isEditing ? editedDiscount : totalDiscount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5" />
                          Bundle Applied
                        </span>
                        <span className="text-emerald-600 font-black tracking-tight">-{formatCurrency(isEditing ? editedDiscount : totalDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-5 border-t border-slate-200">
                      <span className="text-slate-900 font-black uppercase tracking-widest text-xs">Total</span>
                      <span className="text-3xl font-black text-indigo-600 tracking-tighter">{formatCurrency(isEditing ? editedTotal : order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Note (View Mode) */}
                {!isEditing && order.note && (
                  <div className="space-y-3 pt-8 border-t border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Note</h3>
                    <div className="flex items-start gap-3 text-xs text-indigo-700 bg-indigo-50/50 p-4 rounded-[1.5rem] border border-indigo-100/50">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="leading-relaxed font-bold">{order.note}</p>
                    </div>
                  </div>
                )}

                {/* Edit History */}
                {!isEditing && order.editHistory && order.editHistory.length > 0 && (
                  <div className="pt-8 border-t border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Edit History</h3>
                    <div className="space-y-4">
                      {order.editHistory.map((log, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{log.changes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Menu Checklist */}
            <div className={`flex-1 overflow-y-auto p-8 space-y-6 relative ${!isEditing && (isPickedUp || order.status === 'Cancelled') ? 'opacity-75 pointer-events-none grayscale-[0.5]' : ''}`}>
              {isEditing ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Edit Items</h3>
                    <button
                      onClick={() => setShowAddMenu(true)}
                      className="flex items-center gap-3 text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>

                  <AnimatePresence>
                    {editedItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-6 rounded-[2rem] border border-indigo-100 bg-indigo-50/20 mb-4"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">{item.name}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{formatCurrency(item.basePrice)} / unit</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-white border border-indigo-100 rounded-xl p-1 shadow-sm">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center text-lg font-black text-slate-900">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-xl font-black text-slate-900 tracking-tight">
                            {formatCurrency(calculateItemTotal(item, item.quantity))}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div className="pt-6">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Note</label>
                    <textarea
                      value={editedNote}
                      onChange={(e) => setEditedNote(e.target.value)}
                      className="w-full p-5 text-sm font-bold bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[100px] text-slate-700"
                      placeholder="Add special instructions..."
                    />
                  </div>
                </>
              ) : (
                order.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    className={`group relative p-6 rounded-[2rem] border transition-all duration-300 mb-4 ${
                      item.isPrepared 
                        ? 'bg-emerald-50/50 border-emerald-100' 
                        : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/40'
                    }`}
                  >
                    <label className="flex items-start gap-6 cursor-pointer">
                      <div className="relative flex items-center justify-center mt-1">
                        <input
                          type="checkbox"
                          checked={!!item.isPrepared}
                          onChange={() => !isPickedUp && order.status !== 'Cancelled' && toggleOrderItemPrepared(order.id, item.id)}
                          disabled={isPickedUp || order.status === 'Cancelled'}
                          className="peer appearance-none w-8 h-8 border-2 border-slate-200 rounded-xl checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer disabled:cursor-not-allowed"
                        />
                        <CheckCircle2 className="w-5 h-5 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`text-lg font-black tracking-tight transition-all ${
                              item.isPrepared ? 'text-slate-300 line-through' : 'text-slate-900'
                            }`}>
                              {item.name}
                            </h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                              {formatCurrency(item.basePrice)} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xl font-black tracking-tight transition-all ${
                              item.isPrepared ? 'text-slate-300' : 'text-slate-900'
                            }`}>
                              {formatCurrency(calculateItemTotal(item, item.quantity))}
                            </span>
                          </div>
                        </div>
                        
                        {item.bundle?.enabled && item.quantity >= item.bundle.buyQuantity && (
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-lg">
                            <Tag className="w-3.5 h-3.5" />
                            Bundle Applied
                          </div>
                        )}
                        
                        {item.note && (
                          <div className="mt-3 flex items-start gap-2 text-xs text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl inline-block font-bold">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
                            {item.note}
                          </div>
                        )}
                      </div>
                    </label>
                  </motion.div>
                ))
              )}

              {/* Add Item Menu Overlay */}
              <AnimatePresence>
                {showAddMenu && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute inset-0 z-30 bg-white flex flex-col"
                  >
                    <div className="p-8 border-b border-slate-100 flex items-center gap-6 bg-[#F8F9FA]">
                      <button 
                        onClick={() => setShowAddMenu(false)} 
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                      >
                        <Undo className="w-5 h-5" />
                      </button>
                      <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search menu items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Select Item to Add</h3>
                      {filteredMenu.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          className="w-full flex items-center justify-between p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all text-left group"
                        >
                          <div>
                            <p className="font-black text-slate-900 text-lg tracking-tight">{item.name}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{item.category} • {formatCurrency(item.basePrice)}</p>
                          </div>
                          <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                            <Plus className="w-5 h-5" />
                          </div>
                        </button>
                      ))}
                      {filteredMenu.length === 0 && (
                        <div className="text-center py-20 text-slate-300">
                          <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-black uppercase tracking-widest opacity-40">No items match your search</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-100 bg-white">
            <AnimatePresence mode="wait">
              {saveStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5" />
                  Failed to save changes. Please try again.
                </motion.div>
              )}
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center justify-center gap-3 p-4 rounded-2xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all uppercase tracking-widest text-sm"
                  >
                    <Undo className="w-5 h-5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={editedItems.length === 0 || isSaving}
                    className="flex items-center justify-center gap-3 p-4 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-sm"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : saveStatus === 'success' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Changes'}
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {order.status === 'Completed' && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={() => updateOrderStatus(order.id, 'Picked Up')}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all text-sm"
                    >
                      <ShoppingBag className="w-6 h-6" />
                      Mark as Picked Up
                    </motion.button>
                  )}
                  
                  {order.status === 'Picked Up' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                      Order Collected
                    </motion.div>
                  )}

                  {order.status === 'Cancelled' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-rose-50 text-rose-700 border border-rose-100 p-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm"
                    >
                      <XCircle className="w-6 h-6" />
                      Order Cancelled
                    </motion.div>
                  )}

                  {order.status === 'Preparing' && (
                    <div className="text-center text-xs text-slate-400 font-extrabold uppercase tracking-[0.2em] py-2">
                      Finish preparing all items to complete order
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {order.status !== 'Cancelled' && order.status !== 'Picked Up' && (
                      <button
                        onClick={() => setIsConfirmCancelOpen(true)}
                        className="flex items-center justify-center gap-3 px-6 py-3.5 text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-2xl border border-rose-100 transition-all uppercase tracking-widest"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Order
                      </button>
                    )}
                    <button
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      className={`flex items-center justify-center gap-3 px-6 py-3.5 text-xs font-black rounded-2xl transition-all uppercase tracking-widest ${
                        order.status === 'Cancelled' || order.status === 'Picked Up'
                          ? 'col-span-2 bg-slate-100 text-slate-500 hover:bg-slate-200'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Order
                    </button>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Order"
        message="Are you sure you want to permanently delete this order? This action cannot be undone."
      />

      <ConfirmationModal
        isOpen={isConfirmCancelOpen}
        onClose={() => setIsConfirmCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This will stop all preparation and mark it as cancelled."
        variant="warning"
      />
    </>
  );
}
