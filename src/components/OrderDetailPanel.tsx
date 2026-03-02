import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, CartItem, MenuItem } from '../types';
import { formatCurrency, calculateItemTotal } from '../utils';
import { X, CheckCircle2, Clock, ChefHat, AlertCircle, ShoppingBag, Lock, Trash2, XCircle, Tag, Edit, Save, Undo, Plus, Minus, Search, FileText } from 'lucide-react';
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
        className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          className="w-full max-w-4xl glass-panel h-full shadow-2xl flex flex-col relative border-l border-[var(--border-color)]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 lg:p-8 border-b border-[var(--border-color)] bg-[var(--bg-card)] backdrop-blur-md">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Order #{order.id.slice(0, 8)}</h2>
                  <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                    order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    order.status === 'Preparing' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 animate-pulse-glow' :
                    order.status === 'Picked Up' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                    order.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    'bg-[var(--bg-panel)] text-[var(--text-secondary)] border-[var(--border-color)]'
                  }`}>
                    {order.status}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)] font-black">{order.customerName}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                  <button
                    onClick={handleTogglePayment}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                      order.paymentStatus === 'Paid'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-emerald-500 animate-pulse-glow' : 'bg-amber-500'}`} />
                    {order.paymentStatus}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isEditing && !isEditBlocked && order.status !== 'Cancelled' && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-12 h-12 flex items-center justify-center bg-[var(--bg-panel)] text-[var(--accent-primary)] rounded-2xl hover:bg-[var(--accent-primary)] hover:text-white transition-all duration-300 border border-[var(--border-color)] shadow-sm"
                    title="Edit Order"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="w-12 h-12 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-panel)] rounded-2xl transition-all border border-[var(--border-color)] shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Column: Summary & Status */}
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] bg-[var(--bg-panel)] overflow-y-auto">
              <div className="p-6 lg:p-10 space-y-10 lg:space-y-12">
                {/* Progress Section */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3 text-[var(--accent-primary)]">
                      <ChefHat className="w-6 h-6" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Kitchen Status</h3>
                    </div>
                    <span className="text-sm font-black text-[var(--text-primary)]">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-[var(--bg-card)] rounded-full overflow-hidden shadow-inner border border-[var(--border-color)]">
                    <motion.div 
                      className={`h-full rounded-full ${isAllPrepared ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'purple-gradient accent-shadow'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Totals Section */}
                <div className="space-y-8 pt-8 lg:pt-10 border-t border-[var(--border-color)]">
                  <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Order Summary</h3>
                  <div className="space-y-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-[10px]">Subtotal</span>
                      <span className="text-[var(--text-primary)] font-black tracking-tight">{formatCurrency(isEditing ? editedSubtotal : originalTotal)}</span>
                    </div>
                    
                    {(isEditing ? editedDiscount : totalDiscount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-500 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5" />
                          Bundle Applied
                        </span>
                        <span className="text-emerald-500 font-black tracking-tight">-{formatCurrency(isEditing ? editedDiscount : totalDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-6 border-t border-[var(--border-color)]">
                      <span className="text-[var(--text-primary)] font-black uppercase tracking-widest text-xs">Total</span>
                      <span className="text-3xl lg:text-4xl font-black text-[var(--accent-primary)] tracking-tighter drop-shadow-sm">{formatCurrency(isEditing ? editedTotal : order.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-8 lg:pt-10 border-t border-[var(--border-color)]">
                  <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Order Note</h3>
                  {isEditing ? (
                    <div className="relative group/global-note">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <FileText className="w-4 h-4 text-[var(--text-secondary)] group-focus-within/global-note:text-[var(--accent-primary)] transition-colors" />
                      </div>
                      <textarea
                        placeholder="Order note..."
                        value={editedNote}
                        onChange={(e) => setEditedNote(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] text-xs font-black text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-4 focus:ring-[var(--accent-primary)]/10 focus:border-[var(--accent-primary)] outline-none transition-all shadow-sm resize-none h-24"
                      />
                    </div>
                  ) : order.note ? (
                    <div className="flex items-start gap-3 text-xs text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 p-5 rounded-[2rem] border border-[var(--border-color)]/20">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="leading-relaxed font-black">{order.note}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest italic opacity-50">No note provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Menu Checklist */}
            <div className={`flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 relative ${!isEditing && (isPickedUp || order.status === 'Cancelled') ? 'opacity-75 pointer-events-none grayscale-[0.5]' : ''}`}>
              {isEditing ? (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Edit Items</h3>
                    <button
                      onClick={() => setShowAddMenu(true)}
                      className="flex items-center gap-3 text-[10px] font-black text-[var(--accent-primary)] bg-[var(--bg-panel)] px-6 py-3 rounded-2xl border border-[var(--border-color)] hover:bg-[var(--accent-primary)] hover:text-white transition-all uppercase tracking-widest shadow-sm"
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
                        className="p-6 lg:p-8 rounded-[3rem] border border-[var(--border-color)] bg-[var(--bg-card)] mb-6 shadow-sm group"
                      >
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <h4 className="text-xl font-black text-[var(--text-primary)] tracking-tight group-hover:text-[var(--accent-primary)] transition-colors">{item.name}</h4>
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1.5">{formatCurrency(item.basePrice)} / unit</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="w-12 h-12 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all border border-rose-500/20 bg-rose-500/5"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center bg-[var(--bg-panel)] backdrop-blur-md border border-[var(--border-color)] rounded-2xl p-1.5 shadow-inner">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                              className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-card)] rounded-xl transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-14 text-center text-xl font-black text-[var(--text-primary)]">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-card)] rounded-xl transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">
                            {formatCurrency(calculateItemTotal(item, item.quantity))}
                          </span>
                        </div>

                        {/* Edit Item Note */}
                        <div className="relative group/note">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)] group-focus-within/note:text-[var(--accent-primary)] transition-colors" />
                          </div>
                          <input
                            type="text"
                            placeholder="Add note for this item..."
                            value={item.note || ''}
                            onChange={(e) => {
                              const note = e.target.value;
                              setEditedItems(prev => prev.map(i => i.id === item.id ? { ...i, note } : i));
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl text-[10px] font-black text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-all"
                          />
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
                      className={`group relative p-6 lg:p-8 rounded-[3rem] border transition-all duration-500 ${
                        item.isPrepared 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 hover:shadow-2xl hover:shadow-[var(--accent-glow)]'
                      }`}
                    >
                      <label className="flex items-start gap-6 lg:gap-8 cursor-pointer">
                        <div className="relative flex items-center justify-center mt-1">
                          <input
                            type="checkbox"
                            checked={!!item.isPrepared}
                            onChange={() => !isPickedUp && order.status !== 'Cancelled' && toggleOrderItemPrepared(order.id, item.id)}
                            disabled={isPickedUp || order.status === 'Cancelled'}
                            className="peer appearance-none w-10 h-10 border-2 border-[var(--border-color)] bg-[var(--bg-panel)] rounded-2xl checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
                          />
                          <CheckCircle2 className="w-6 h-6 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className={`text-xl font-black tracking-tight transition-all duration-500 ${
                                item.isPrepared ? 'text-[var(--text-secondary)] line-through' : 'text-[var(--text-primary)]'
                              }`}>
                                {item.name}
                              </h4>
                              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1.5">
                                {formatCurrency(item.basePrice)} × {item.quantity}
                              </p>
                              {item.note && (
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                                  <AlertCircle className="w-3 h-3" />
                                  Note: {item.note}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className={`text-2xl font-black tracking-tighter transition-all duration-500 ${
                                item.isPrepared ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'
                              }`}>
                                {formatCurrency(calculateItemTotal(item, item.quantity))}
                              </span>
                            </div>
                          </div>
                          
                          {item.bundle?.enabled && item.quantity >= item.bundle.buyQuantity && (
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-500/10 w-fit px-4 py-1.5 rounded-xl border border-emerald-500/20">
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
          <div className="p-6 lg:p-10 border-t border-[var(--border-color)] bg-[var(--bg-card)] backdrop-blur-md">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="grid grid-cols-2 gap-4 lg:gap-6"
                >
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center justify-center gap-3 p-4 lg:p-5 rounded-2xl font-black text-[var(--text-secondary)] bg-[var(--bg-panel)] hover:bg-[var(--bg-card)] transition-all uppercase tracking-widest text-xs border border-[var(--border-color)]"
                  >
                    <Undo className="w-5 h-5" />
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={editedItems.length === 0 || isSaving}
                    className="flex items-center justify-center gap-3 p-4 lg:p-5 rounded-2xl font-black text-white purple-gradient hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all accent-shadow uppercase tracking-widest text-xs"
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
                <div className="space-y-4 lg:space-y-6">
                  {order.status === 'Completed' && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateOrderStatus(order.id, 'Picked Up')}
                      className="w-full purple-gradient text-white p-5 lg:p-6 rounded-[2rem] flex items-center justify-center gap-4 font-black uppercase tracking-widest accent-shadow transition-all text-sm shadow-xl"
                    >
                      <ShoppingBag className="w-6 h-6" />
                      Mark as Picked Up
                    </motion.button>
                  )}
                  
                  {order.status === 'Picked Up' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 p-5 lg:p-6 rounded-[2rem] flex items-center justify-center gap-4 font-black uppercase tracking-widest text-sm"
                    >
                      <CheckCircle2 className="w-7 h-7" />
                      Order Collected
                    </motion.div>
                  )}

                  {/* Admin Actions */}
                  <div className="grid grid-cols-2 gap-4 lg:gap-6">
                    {order.status === 'Pending' && (
                      <button
                        onClick={() => setIsConfirmCancelOpen(true)}
                        className="flex items-center justify-center gap-3 px-6 lg:px-8 py-4 text-[10px] font-black text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all uppercase tracking-widest"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Order
                      </button>
                    )}
                    <button
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      className={`flex items-center justify-center gap-3 px-6 lg:px-8 py-4 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest ${
                        order.status === 'Cancelled' || order.status === 'Picked Up'
                          ? 'col-span-2 bg-[var(--bg-panel)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                          : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
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

      <AnimatePresence>
        {showAddMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] border-[var(--border-color)] bg-[var(--bg-panel)]"
            >
              <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Add Menu Item</h3>
                <button
                  onClick={() => setShowAddMenu(false)}
                  className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-all text-[var(--text-primary)] font-medium"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-card)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {menu
                    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleAddItem(item)}
                        className="flex flex-col items-start p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/5 transition-all text-left group"
                      >
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">{item.category}</span>
                        <h4 className="font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">{item.name}</h4>
                        <p className="text-sm font-black text-[var(--accent-primary)]">{formatCurrency(item.basePrice)}</p>
                      </button>
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
