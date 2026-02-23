import { useState } from 'react';
import { MenuItem, CartItem, Category } from '../types';
import { calculateItemTotal, formatCurrency } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Tag, ShoppingCart, Trash2, CreditCard, User, FileText, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';

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
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
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

  const cartTotal = cart.reduce((sum, item) => sum + calculateItemTotal(item, item.quantity), 0);

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
    <div className="flex h-full gap-0 bg-[#F8F9FA] rounded-[2rem] overflow-hidden shadow-sm border border-slate-200/50">
      {/* Left Side - Menu */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 p-6 overflow-hidden">
        {/* Search & Filter */}
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none shadow-sm transition-all text-slate-700 font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 overflow-y-auto pr-2 pb-20 scrollbar-hide">
          {filteredMenu.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col h-full min-h-[180px]"
              onClick={() => addToCart(item)}
            >
              {/* Promo Label */}
              {item.bundle?.showPromoLabel && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg shadow-purple-200 uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    Promo
                  </span>
                </div>
              )}
              
              {/* Content Area */}
              <div className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  <div className="mb-2">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.15em]">{item.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-purple-600 transition-colors text-lg mb-4">
                    {item.name}
                  </h3>
                </div>
                
                <div className="flex flex-col gap-3">
                  <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                    {formatCurrency(item.basePrice)}
                  </p>
                  
                  {item.bundle?.enabled && (
                    <div className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-2 w-fit">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="truncate">{item.bundle.buyQuantity} for {formatCurrency(item.bundle.bundlePrice)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Indicator */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-[420px] bg-[#FDFDFD] border-l border-slate-200/50 flex flex-col overflow-hidden shadow-2xl">
        {/* Top Section: Header */}
        <div className="p-8 space-y-6 bg-white border-b border-slate-100">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-slate-500 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Nama Pelanggan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>

          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/40">
            <button
              onClick={() => setPaymentStatus('Unpaid')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                paymentStatus === 'Unpaid' 
                  ? 'bg-white text-purple-600 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/20' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              UNPAID
            </button>
            <button
              onClick={() => setPaymentStatus('Paid')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                paymentStatus === 'Paid' 
                  ? 'bg-white text-purple-600 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/20' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              PAID
            </button>
          </div>
        </div>

        {/* Middle Section: Cart Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-purple-50 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                <ShoppingCart className="w-10 h-10 text-purple-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Keranjang Kosong</h3>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Pilih menu untuk mulai transaksi</p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {cart.map(item => {
                const itemTotal = calculateItemTotal(item, item.quantity);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-black text-slate-900 text-base tracking-tight truncate">{item.name}</h4>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mt-1">{formatCurrency(item.basePrice)}</p>
                      </div>
                      <button
                        onClick={() => updateQuantity(item.id, -item.quantity)}
                        className="w-10 h-10 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-purple-600 transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-black w-8 text-center text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-purple-600 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(itemTotal)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Bottom Section: Sticky Payment Area */}
        <div className="p-8 bg-white border-t border-slate-100 space-y-8">
          {/* Total Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-[2.5rem] border border-purple-100/50 shadow-lg shadow-purple-100/20">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">Total Pembayaran</p>
                <h2 className="text-4xl font-black text-purple-900 tracking-tighter">{formatCurrency(cartTotal)}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">Items</p>
                <p className="text-xl font-black text-purple-900">{cart.reduce((s, i) => s + i.quantity, 0)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCart([])}
              disabled={isConfirming || showSuccess || cart.length === 0}
              className="px-6 py-5 text-slate-600 font-black text-xs uppercase tracking-widest bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all duration-300 disabled:opacity-50"
            >
              CLEAR
            </button>
            <motion.button
              onClick={handleConfirmOrder}
              disabled={cart.length === 0 || isConfirming || showSuccess}
              whileTap={{ scale: 0.98 }}
              animate={showSuccess ? { backgroundColor: '#10b981' } : {}}
              className={`px-6 py-5 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                !showSuccess ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xl shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-0.5' : ''
              }`}
            >
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>SUCCESS</span>
                  </motion.div>
                ) : isConfirming ? (
                  <motion.div
                    key="loading"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>PROCESSING</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>CONFIRM</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Glow effect */}
              {!showSuccess && !isConfirming && cart.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full animate-[shimmer_2s_infinite]" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
