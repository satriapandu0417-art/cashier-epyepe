import { useState } from 'react';
import { MenuItem, CartItem, Category } from '../types';
import { calculateItemTotal, formatCurrency } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Tag, ShoppingCart, Trash2, CreditCard, User, FileText, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface CashierViewProps {
  menu: MenuItem[];
  onCreateOrder: (order: any) => void;
}

export function CashierView({ menu, onCreateOrder }: CashierViewProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [globalNote, setGlobalNote] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  const addToCart = (item: MenuItem) => {
    if (item.stock !== undefined && item.stock <= 0) {
      toast.error(`"${item.name}" is out of stock`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (item.stock !== undefined && existing.quantity >= item.stock) {
          toast.error(`Only ${item.stock} units of "${item.name}" available`);
          return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateItemNote = (itemId: string, note: string) => {
    setCart(prev => prev.map(item => item.id === itemId ? { ...item, note } : item));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
  const cartDiscount = cart.reduce((sum, item) => sum + ((item.basePrice * item.quantity) - calculateItemTotal(item, item.quantity)), 0);
  const cartTotal = cartSubtotal - cartDiscount;

  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    
    setIsConfirming(true);
    
    // Simulate processing delay for animation
    await new Promise(resolve => setTimeout(resolve, 600));

    onCreateOrder({
      customerName: customerName || 'Guest',
      items: cart,
      total: cartTotal,
      paymentStatus,
      note: globalNote,
    });

    setIsConfirming(false);
    setShowSuccess(true);

    // Reset after showing success
    setTimeout(() => {
      setCart([]);
      setCustomerName('');
      setGlobalNote('');
      setPaymentStatus('Unpaid');
      setShowSuccess(false);
    }, 1500);
  };

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: (Category | 'All')[] = ['All', 'Coffee', 'Tea', 'Food', 'Dessert', 'Other'];

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 bg-[var(--bg-base)] rounded-[2.5rem] overflow-hidden border border-[var(--border-color)] shadow-2xl">
      {/* Left Side - Menu */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-panel)]/30 backdrop-blur-xl overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-6 lg:p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3">
                Menu
              </h2>
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-200 border ${
                      selectedCategory === cat
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 pb-24">
            {filteredMenu.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
                onClick={() => addToCart(item)}
              >
                {/* Promo Badge */}
                {item.bundle?.showPromoLabel && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="bg-indigo-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-widest shadow-sm">
                      <Tag className="w-2 h-2" />
                      PROMO
                    </div>
                  </div>
                )}

                <div className="p-4 flex flex-col h-full">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest opacity-80">{item.category}</span>
                      {item.stock !== undefined && (
                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest ${
                          item.stock <= (item.minStock || 0) 
                            ? 'bg-rose-500/10 text-rose-500' 
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {item.stock} in stock
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-snug text-sm group-hover:text-indigo-500 transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                  </div>

                  {item.bundle?.enabled && (
                    <div className="mb-4 flex items-center gap-1.5 text-[8px] font-bold text-indigo-500/70 dark:text-indigo-400/70 uppercase tracking-tight">
                      <div className="w-1 h-1 rounded-full bg-indigo-500" />
                      {item.bundle.buyQuantity} for {formatCurrency(item.bundle.bundlePrice)}
                    </div>
                  )}

                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Price</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        {formatCurrency(item.basePrice)}
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${
                      item.stock !== undefined && item.stock <= 0
                        ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-transparent'
                    }`}>
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-full lg:w-[450px] h-[60vh] lg:h-full bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 flex flex-col relative z-20">
        {/* Cart Header */}
        <div className="p-6 lg:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3">
              Order
            </h2>
            <div className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {cart.reduce((s, i) => s + i.quantity, 0)} Items
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setPaymentStatus('Unpaid')}
                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ${
                  paymentStatus === 'Unpaid' 
                    ? 'bg-white dark:bg-slate-900 text-indigo-500 shadow-sm border border-slate-200 dark:border-slate-700' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                UNPAID
              </button>
              <button
                onClick={() => setPaymentStatus('Paid')}
                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ${
                  paymentStatus === 'Paid' 
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 border border-indigo-600' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                PAID
              </button>
            </div>
          </div>
        </div>

        {/* Cart Items Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/10">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 mb-6">
                <ShoppingCart className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No items in order</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {cart.map(item => {
                const itemTotal = calculateItemTotal(item, item.quantity);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 group relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight truncate">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">{formatCurrency(item.basePrice)}</p>
                      </div>
                      <button
                        onClick={() => updateQuantity(item.id, -item.quantity)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-0.5 border border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-900 text-slate-400 hover:text-indigo-500 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-7 text-center text-slate-700 dark:text-slate-200">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-900 text-slate-400 hover:text-indigo-500 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">{formatCurrency(itemTotal)}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                      <div className="relative">
                        <FileText className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                        <input
                          type="text"
                          placeholder="Item note..."
                          value={item.note || ''}
                          onChange={(e) => updateItemNote(item.id, e.target.value)}
                          className="w-full pl-6 pr-2 py-1 bg-transparent text-[10px] font-medium text-slate-600 dark:text-slate-400 placeholder-slate-300 outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Cart Footer / Checkout Area */}
        <div className="p-6 lg:p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-6">
          {/* Note Section */}
          <div className="relative">
            <FileText className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <textarea
              placeholder="Global order note..."
              value={globalNote}
              onChange={(e) => setGlobalNote(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all h-16 resize-none"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Subtotal</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatCurrency(cartSubtotal)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Discount</span>
                <span className="text-xs font-bold text-emerald-500">-{formatCurrency(cartDiscount)}</span>
              </div>
            )}
            
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Total</p>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{formatCurrency(cartTotal)}</h2>
                </div>
                <div className="text-right">
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                    paymentStatus === 'Paid' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {paymentStatus}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCart([])}
              disabled={isConfirming || showSuccess || cart.length === 0}
              className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl transition-all disabled:opacity-50"
            >
              RESET
            </button>
            <motion.button
              onClick={handleConfirmOrder}
              disabled={cart.length === 0 || isConfirming || showSuccess}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-3.5 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                showSuccess ? 'bg-emerald-500' : 'bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
              }`}
            >
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div key="success" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>DONE</span>
                  </motion.div>
                ) : isConfirming ? (
                  <motion.div key="loading" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>PROCESS</span>
                  </motion.div>
                ) : (
                  <motion.div key="default" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>CONFIRM</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
