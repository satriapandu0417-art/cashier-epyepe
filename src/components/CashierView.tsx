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
    <div className="flex h-[calc(100vh-4rem)] gap-0 bg-[#F8F9FA]">
      {/* Left Side - Menu */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 p-6 overflow-hidden">
        {/* Search & Filter */}
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none shadow-sm transition-all text-slate-700 font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
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
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg shadow-indigo-200 uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    Promo
                  </span>
                </div>
              )}
              
              {/* Content Area */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex-1">
                    <div className="mb-1.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">{item.category}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors text-lg">
                      {item.name}
                    </h3>
                </div>
                
                <div className="mt-5 flex flex-col gap-2.5">
                    <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                      {formatCurrency(item.basePrice)}
                    </p>
                    
                    {item.bundle?.enabled && (
                        <div className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-2 w-fit">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{item.bundle.buyQuantity} for {formatCurrency(item.bundle.bundlePrice)}</span>
                        </div>
                    )}
                </div>
              </div>

              {/* Add Indicator */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-[400px] bg-white border-l border-slate-200/60 flex flex-col overflow-hidden shadow-2xl shadow-slate-200/40">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3 mb-5 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <User className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-slate-900 font-bold placeholder-slate-300 focus:ring-0 text-sm"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/40">
            <button
              onClick={() => setPaymentStatus('Unpaid')}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 uppercase tracking-wider ${
                paymentStatus === 'Unpaid' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setPaymentStatus('Paid')}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 uppercase tracking-wider ${
                paymentStatus === 'Paid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 opacity-20" />
              </div>
              <p className="font-bold text-sm uppercase tracking-widest opacity-40">Cart is empty</p>
            </div>
          ) : (
            <AnimatePresence>
              {cart.map(item => {
                const itemTotal = calculateItemTotal(item, item.quantity);
                const isBundleActive = item.bundle?.enabled && item.quantity >= (item.bundle.buyQuantity || 999);
                const nextBundleQty = item.bundle?.enabled ? item.bundle.buyQuantity - (item.quantity % item.bundle.buyQuantity) : 0;
                const showSuggestion = item.bundle?.enabled && !isBundleActive && item.quantity > 0;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                        <p className="text-lg font-black text-indigo-600 mt-0.5">{formatCurrency(itemTotal)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-1 border border-slate-100">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-600 transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-black w-5 text-center text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-600 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isBundleActive && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider mb-3 bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
                        <Tag className="w-3 h-3" />
                        Bundle Applied
                      </div>
                    )}

                    {showSuggestion && nextBundleQty === 1 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider mb-3 bg-indigo-50 w-fit px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3 h-3" />
                        +1 for Bundle Price
                      </div>
                    )}

                    <div className="relative">
                      <FileText className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                      <input
                        type="text"
                        placeholder="Add special instructions..."
                        value={item.note || ''}
                        onChange={(e) => updateItemNote(item.id, e.target.value)}
                        className="w-full text-xs bg-transparent border-none focus:ring-0 pl-5 py-1 text-slate-500 placeholder-slate-300 font-medium"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <FileText className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Order Note..."
                value={globalNote}
                onChange={(e) => setGlobalNote(e.target.value)}
                className="flex-1 text-xs bg-transparent border-none outline-none text-slate-600 font-medium placeholder-slate-300 focus:ring-0"
              />
            </div>
            <div className="flex justify-between items-end pt-2">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Amount</p>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-1">Items</p>
                <span className="text-xl font-black text-slate-900">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCart([])}
              disabled={isConfirming || showSuccess}
              className="px-4 py-4 text-slate-500 font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-200 disabled:opacity-50 uppercase tracking-widest"
            >
              Clear
            </button>
            <motion.button
              onClick={handleConfirmOrder}
              disabled={cart.length === 0 || isConfirming || showSuccess}
              whileTap={{ scale: 0.95 }}
              animate={showSuccess ? { backgroundColor: '#10b981' } : { backgroundColor: '#4f46e5' }}
              className="px-4 py-4 text-white font-bold text-sm rounded-2xl transition-all duration-300 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative uppercase tracking-widest"
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
                    <span>Success</span>
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
                    <span>Processing</span>
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
                    <span>Confirm</span>
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
