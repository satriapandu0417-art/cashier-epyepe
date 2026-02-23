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
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">Order #{order.id}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                    order.status === 'Preparing' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    order.status === 'Picked Up' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {isPickedUp && <Lock className="w-3 h-3" />}
                    {order.status}
                  </span>
                </div>
                <p className="text-gray-500 font-medium">{order.customerName}</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && !isEditBlocked && order.status !== 'Cancelled' && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-orange-100 rounded-full transition-colors text-orange-600"
                    title="Edit Order"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePayment}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                    order.paymentStatus === 'Paid'
                      ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span>{order.paymentStatus}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Summary & Status */}
            <div className="w-80 border-r border-gray-100 bg-gray-50/30 overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* Progress Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2 text-orange-600 font-medium">
                      <ChefHat className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Kitchen Status</h3>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${isAllPrepared ? 'bg-green-500' : 'bg-orange-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Totals Section */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900 font-medium">{formatCurrency(isEditing ? editedSubtotal : originalTotal)}</span>
                    </div>
                    
                    {(isEditing ? editedDiscount : totalDiscount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Bundle Discounts
                        </span>
                        <span className="text-green-600 font-medium">-{formatCurrency(isEditing ? editedDiscount : totalDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-gray-900 font-bold">Total</span>
                      <span className="text-xl font-black text-orange-600">{formatCurrency(isEditing ? editedTotal : order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Note (View Mode) */}
                {!isEditing && order.note && (
                  <div className="space-y-2 pt-6 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Note</h3>
                    <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 p-3 rounded-xl border border-orange-100">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="leading-relaxed">{order.note}</p>
                    </div>
                  </div>
                )}

                {/* Edit History */}
                {!isEditing && order.editHistory && order.editHistory.length > 0 && (
                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Edit History</h3>
                    <div className="space-y-3">
                      {order.editHistory.map((log, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-gray-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed">{log.changes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Menu Checklist */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-4 relative ${!isEditing && (isPickedUp || order.status === 'Cancelled') ? 'opacity-75 pointer-events-none grayscale-[0.5]' : ''}`}>
              {isEditing ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Edit Items</h3>
                    <button
                      onClick={() => setShowAddMenu(true)}
                      className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
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
                        className="p-5 rounded-2xl border border-orange-100 bg-orange-50/30"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500">{formatCurrency(item.basePrice)} / unit</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 bg-white border border-orange-100 rounded-xl p-1.5">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Minus className="w-5 h-5 text-gray-500" />
                            </button>
                            <span className="w-10 text-center text-lg font-bold text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Plus className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>
                          <span className="text-lg font-black text-gray-900">
                            {formatCurrency(calculateItemTotal(item, item.quantity))}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div className="pt-4">
                    <label className="block text-sm font-bold text-gray-900 mb-2">Order Note</label>
                    <textarea
                      value={editedNote}
                      onChange={(e) => setEditedNote(e.target.value)}
                      className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all min-h-[80px]"
                      placeholder="Add special instructions..."
                    />
                  </div>
                </>
              ) : (
                order.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    className={`group relative p-5 rounded-2xl border transition-all duration-200 ${
                      item.isPrepared 
                        ? 'bg-green-50/50 border-green-100' 
                        : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'
                    }`}
                  >
                    <label className="flex items-start gap-5 cursor-pointer">
                      <div className="relative flex items-center justify-center mt-1">
                        <input
                          type="checkbox"
                          checked={!!item.isPrepared}
                          onChange={() => !isPickedUp && order.status !== 'Cancelled' && toggleOrderItemPrepared(order.id, item.id)}
                          disabled={isPickedUp || order.status === 'Cancelled'}
                          className="peer appearance-none w-7 h-7 border-2 border-gray-300 rounded-xl checked:bg-green-500 checked:border-green-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        />
                        <CheckCircle2 className="w-5 h-5 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`text-lg font-bold transition-all ${
                              item.isPrepared ? 'text-gray-400 line-through' : 'text-gray-900'
                            }`}>
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(item.basePrice)} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-black transition-all ${
                              item.isPrepared ? 'text-gray-400' : 'text-gray-900'
                            }`}>
                              {formatCurrency(calculateItemTotal(item, item.quantity))}
                            </span>
                          </div>
                        </div>
                        
                        {item.bundle?.enabled && item.quantity >= item.bundle.buyQuantity && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase tracking-wider">
                            <Tag className="w-3 h-3" />
                            Bundle Applied
                          </div>
                        )}
                        
                        {item.note && (
                          <div className="mt-1 flex items-start gap-1.5 text-xs text-orange-600 bg-orange-50 p-1.5 rounded-md inline-block">
                            <AlertCircle className="w-3 h-3 mt-0.5" />
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
                    <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                      <button 
                        onClick={() => setShowAddMenu(false)} 
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <Undo className="w-5 h-5 text-gray-500" />
                      </button>
                      <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search menu items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Item to Add</h3>
                      {filteredMenu.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all text-left group"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.category} • {formatCurrency(item.basePrice)}</p>
                          </div>
                          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-5 h-5" />
                          </div>
                        </button>
                      ))}
                      {filteredMenu.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                          <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">No items match your search</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <AnimatePresence mode="wait">
              {saveStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Failed to save changes. Please try again.
                </motion.div>
              )}
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    <Undo className="w-5 h-5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={editedItems.length === 0 || isSaving}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-orange-200"
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
                <>
                  {order.status === 'Completed' && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={() => updateOrderStatus(order.id, 'Picked Up')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-200 transition-colors"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Mark as Picked Up
                    </motion.button>
                  )}
                  
                  {order.status === 'Picked Up' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 text-blue-700 border border-blue-100 p-3 rounded-xl flex items-center justify-center gap-2 font-medium"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Order Collected
                    </motion.div>
                  )}

                  {order.status === 'Cancelled' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl flex items-center justify-center gap-2 font-medium"
                    >
                      <XCircle className="w-5 h-5" />
                      Order Cancelled
                    </motion.div>
                  )}

                  {order.status === 'Preparing' && (
                    <div className="text-center text-sm text-gray-500 italic">
                      Finish preparing all items to complete order
                    </div>
                  )}
                </>
              )}
            </AnimatePresence>

            {/* Admin Actions */}
            {!isEditing && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {order.status !== 'Cancelled' && order.status !== 'Picked Up' && (
                  <button
                    onClick={() => setIsConfirmCancelOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    order.status === 'Cancelled' || order.status === 'Picked Up'
                      ? 'col-span-2 bg-gray-200 text-gray-600 hover:bg-gray-300'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Order
                </button>
              </div>
            )}
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
