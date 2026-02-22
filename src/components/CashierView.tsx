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
    <div className="flex h-[calc(100vh-4rem)] gap-6 p-6 bg-gray-50/50">
      {/* Left Side - Menu */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Search & Filter */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none shadow-sm transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 overflow-y-auto pr-2 pb-20">
          {filteredMenu.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
              whileTap={{ scale: 0.97 }}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm transition-all cursor-pointer relative overflow-hidden flex flex-col h-full min-h-[160px]"
              onClick={() => addToCart(item)}
            >
              {/* Promo Label */}
              {item.bundle?.showPromoLabel && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    PROMO
                  </span>
                </div>
              )}
              
              {/* Content Area */}
              <div className="p-4 lg:p-5 flex flex-col flex-1">
                <div className="flex-1">
                    <div className="mb-1">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{item.category}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors text-base lg:text-lg">
                      {item.name}
                    </h3>
                </div>
                
                <div className="mt-4 flex flex-col gap-2">
                    <p className="text-xl lg:text-2xl font-black text-orange-600 leading-none">
                      {formatCurrency(item.basePrice)}
                    </p>
                    
                    {item.bundle?.enabled && (
                        <div className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1.5 rounded-lg border border-green-100 flex items-center gap-1.5 w-fit">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span>{item.bundle.buyQuantity} for {formatCurrency(item.bundle.bundlePrice)}</span>
                        </div>
                    )}
                </div>
              </div>

              {/* Subtle Add Indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-96 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 font-medium placeholder-gray-400 focus:ring-0"
            />
          </div>
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setPaymentStatus('Unpaid')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                paymentStatus === 'Unpaid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Not Paid
            </button>
            <button
              onClick={() => setPaymentStatus('Paid')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                paymentStatus === 'Paid' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>No items in cart</p>
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-orange-600 font-semibold">{formatCurrency(itemTotal)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {isBundleActive && (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-2">
                        <Tag className="w-3 h-3" />
                        Bundle price applied
                      </div>
                    )}

                    {showSuggestion && nextBundleQty === 1 && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 font-medium mb-2">
                        <AlertCircle className="w-3 h-3" />
                        Add 1 more for bundle price!
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Add note..."
                      value={item.note || ''}
                      onChange={(e) => updateItemNote(item.id, e.target.value)}
                      className="w-full text-xs bg-transparent border-b border-gray-200 focus:border-orange-500 outline-none py-1 text-gray-600 placeholder-gray-400"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Order Note..."
                value={globalNote}
                onChange={(e) => setGlobalNote(e.target.value)}
                className="flex-1 text-sm bg-transparent border-none outline-none text-gray-600 placeholder-gray-400"
              />
            </div>
            <div className="flex justify-between items-end">
              <span className="text-gray-500">Total</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCart([])}
              disabled={isConfirming || showSuccess}
              className="px-4 py-3 text-gray-600 font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleConfirmOrder}
              disabled={cart.length === 0 || isConfirming || showSuccess}
              whileTap={{ scale: 0.95 }}
              animate={showSuccess ? { backgroundColor: '#22c55e' } : { backgroundColor: '#f97316' }}
              className="px-4 py-3 text-white font-medium rounded-xl transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative"
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
                    <span>Success!</span>
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
                    <span>Processing...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
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
