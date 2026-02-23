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
        className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          className="w-full max-w-4xl glass-panel h-full shadow-2xl flex flex-col relative border-l border-white/40"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/40 bg-white/20">
            <div className="flex justify-between items-center">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Order #{order.id.slice(0, 8)}</h2>
                  <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                    order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                    order.status === 'Preparing' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 purple-glow' :
                    order.status === 'Picked Up' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                    order.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                    'bg-white/40 text-slate-600 border-white/60'
                  }`}>
                    {order.status}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  <span className="text-slate-900 font-black">{order.customerName}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <button
                    onClick={handleTogglePayment}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all duration-300 ${
                      order.paymentStatus === 'Paid'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 neon-green-glow'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {order.paymentStatus}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing && !isEditBlocked && order.status !== 'Cancelled' && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-10 h-10 flex items-center justify-center bg-white/60 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all duration-300 border border-white/60 shadow-sm"
                    title="Edit Order"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-800 bg-white/60 rounded-xl transition-all border border-white/60 shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Summary & Status */}
            <div className="w-80 border-r border-white/40 bg-white/10 overflow-y-auto">
              <div className="p-10 space-y-12">
                {/* Progress Section */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3 text-purple-600">
                      <ChefHat className="w-6 h-6" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Kitchen Status</h3>
                    </div>
                    <span className="text-sm font-black text-slate-900">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-white/40 rounded-full overflow-hidden shadow-inner border border-white/60">
                    <motion.div 
                      className={`h-full rounded-full ${isAllPrepared ? 'bg-emerald-500 neon-green-glow' : 'purple-gradient purple-glow'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Totals Section */}
                <div className="space-y-8 pt-10 border-t border-white/40">
                  <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Order Summary</h3>
                  <div className="space-y-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-black uppercase tracking-widest text-[10px]">Subtotal</span>
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

                    <div className="flex justify-between items-center pt-6 border-t border-white/60">
                      <span className="text-slate-900 font-black uppercase tracking-widest text-xs">Total</span>
                      <span className="text-4xl font-black text-purple-600 tracking-tighter purple-glow">{formatCurrency(isEditing ? editedTotal : order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Note (View Mode) */}
                {!isEditing && order.note && (
                  <div className="space-y-4 pt-10 border-t border-white/40">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Order Note</h3>
                    <div className="flex items-start gap-3 text-xs text-purple-700 bg-purple-500/10 p-5 rounded-[2rem] border border-purple-500/20">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="leading-relaxed font-black">{order.note}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Menu Checklist */}
            <div className={`flex-1 overflow-y-auto p-10 space-y-8 relative ${!isEditing && (isPickedUp || order.status === 'Cancelled') ? 'opacity-75 pointer-events-none grayscale-[0.5]' : ''}`}>
              {isEditing ? (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Edit Items</h3>
                    <button
                      onClick={() => setShowAddMenu(true)}
                      className="flex items-center gap-3 text-[10px] font-black text-purple-600 bg-white/60 px-6 py-3 rounded-2xl border border-white/60 hover:bg-purple-600 hover:text-white transition-all uppercase tracking-widest shadow-sm"
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
                        className="p-8 rounded-[3rem] border border-white/60 bg-white/40 mb-6 shadow-sm group"
                      >
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-purple-600 transition-colors">{item.name}</h4>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1.5">{formatCurrency(item.basePrice)} / unit</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="w-12 h-12 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all border border-rose-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl p-1.5 shadow-inner">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-purple-600 hover:bg-white rounded-xl transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-14 text-center text-xl font-black text-slate-900">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-purple-600 hover:bg-white rounded-xl transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-2xl font-black text-slate-900 tracking-tighter">
                            {formatCurrency(calculateItemTotal(item, item.quantity))}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {order.items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      className={`group relative p-8 rounded-[3rem] border transition-all duration-500 ${
                        item.isPrepared 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-white/40 border-white/60 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-200/20'
                      }`}
                    >
                      <label className="flex items-start gap-8 cursor-pointer">
                        <div className="relative flex items-center justify-center mt-1">
                          <input
                            type="checkbox"
                            checked={!!item.isPrepared}
                            onChange={() => !isPickedUp && order.status !== 'Cancelled' && toggleOrderItemPrepared(order.id, item.id)}
                            disabled={isPickedUp || order.status === 'Cancelled'}
                            className="peer appearance-none w-10 h-10 border-2 border-white/80 bg-white/40 rounded-2xl checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
                          />
                          <CheckCircle2 className="w-6 h-6 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className={`text-xl font-black tracking-tight transition-all duration-500 ${
                                item.isPrepared ? 'text-slate-300 line-through' : 'text-slate-900'
                              }`}>
                                {item.name}
                              </h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                                {formatCurrency(item.basePrice)} × {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`text-2xl font-black tracking-tighter transition-all duration-500 ${
                                item.isPrepared ? 'text-slate-300' : 'text-slate-900'
                              }`}>
                                {formatCurrency(calculateItemTotal(item, item.quantity))}
                              </span>
                            </div>
                          </div>
                          
                          {item.bundle?.enabled && item.quantity >= item.bundle.buyQuantity && (
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-500/10 w-fit px-4 py-1.5 rounded-xl border border-emerald-500/20">
                              <Tag className="w-3.5 h-3.5" />
                              Bundle Applied
                            </div>
                          )}
                        </div>
                      </label>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-10 border-t border-white/40 bg-white/20">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="grid grid-cols-2 gap-6"
                >
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center justify-center gap-3 p-5 rounded-2xl font-black text-slate-500 bg-white/60 hover:bg-white transition-all uppercase tracking-widest text-xs border border-white/60"
                  >
                    <Undo className="w-5 h-5" />
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={editedItems.length === 0 || isSaving}
                    className="flex items-center justify-center gap-3 p-5 rounded-2xl font-black text-white purple-gradient hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-purple-200 uppercase tracking-widest text-xs purple-glow"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {order.status === 'Completed' && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={() => updateOrderStatus(order.id, 'Picked Up')}
                      className="w-full purple-gradient text-white p-6 rounded-[2rem] flex items-center justify-center gap-4 font-black uppercase tracking-widest shadow-2xl shadow-purple-200 transition-all text-sm purple-glow hover:-translate-y-1"
                    >
                      <ShoppingBag className="w-6 h-6" />
                      Mark as Picked Up
                    </motion.button>
                  )}
                  
                  {order.status === 'Picked Up' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center justify-center gap-4 font-black uppercase tracking-widest text-sm neon-green-glow"
                    >
                      <CheckCircle2 className="w-7 h-7" />
                      Order Collected
                    </motion.div>
                  )}

                  {/* Admin Actions */}
                  <div className="grid grid-cols-2 gap-6">
                    {order.status !== 'Cancelled' && order.status !== 'Picked Up' && (
                      <button
                        onClick={() => setIsConfirmCancelOpen(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 text-[10px] font-black text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all uppercase tracking-widest"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Order
                      </button>
                    )}
                    <button
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      className={`flex items-center justify-center gap-3 px-8 py-4 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest ${
                        order.status === 'Cancelled' || order.status === 'Picked Up'
                          ? 'col-span-2 bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-white/60 text-slate-400 hover:text-slate-600 border border-white/60'
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
