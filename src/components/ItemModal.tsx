import React, { useState, useEffect } from 'react';
import { MenuItem, BundleConfig, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, AlertCircle } from 'lucide-react';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<MenuItem, 'id'>) => void;
  initialData?: MenuItem;
}

const CATEGORIES: Category[] = ['Coffee', 'Tea', 'Food', 'Dessert', 'Other'];

export function ItemModal({ isOpen, onClose, onSave, initialData }: ItemModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [basePrice, setBasePrice] = useState(initialData?.basePrice?.toString() || '');
  const [category, setCategory] = useState<Category>(initialData?.category || 'Coffee');
  
  const [stock, setStock] = useState(initialData?.stock?.toString() || '');
  const [minStock, setMinStock] = useState(initialData?.minStock?.toString() || '');
  
  const [bundleEnabled, setBundleEnabled] = useState(initialData?.bundle?.enabled || false);
  const [buyQuantity, setBuyQuantity] = useState(initialData?.bundle?.buyQuantity?.toString() || '');
  const [bundlePrice, setBundlePrice] = useState(initialData?.bundle?.bundlePrice?.toString() || '');
  const [showPromoLabel, setShowPromoLabel] = useState(initialData?.bundle?.showPromoLabel || false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setBasePrice(initialData?.basePrice?.toString() || '');
      setCategory(initialData?.category || 'Coffee');
      setStock(initialData?.stock?.toString() || '');
      setMinStock(initialData?.minStock?.toString() || '');
      setBundleEnabled(initialData?.bundle?.enabled || false);
      setBuyQuantity(initialData?.bundle?.buyQuantity?.toString() || '');
      setBundlePrice(initialData?.bundle?.bundlePrice?.toString() || '');
      setShowPromoLabel(initialData?.bundle?.showPromoLabel || false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const bundle: BundleConfig = {
      enabled: bundleEnabled,
      buyQuantity: bundleEnabled ? parseInt(buyQuantity) || 0 : 0,
      bundlePrice: bundleEnabled ? parseInt(bundlePrice) || 0 : 0,
      showPromoLabel: bundleEnabled ? showPromoLabel : false,
    };

    onSave({
      name,
      basePrice: parseInt(basePrice) || 0,
      category,
      bundle,
      stock: stock ? parseInt(stock) : undefined,
      minStock: minStock ? parseInt(minStock) : undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel rounded-[3.5rem] shadow-2xl w-full max-w-lg overflow-hidden border-white/60"
          >
            <div className="flex items-center justify-between p-8 border-b border-white/40 bg-white/20">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                {initialData ? 'Edit Menu Item' : 'Add New Item'}
              </h2>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white/60 rounded-xl transition-all border border-white/60 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 bg-white/60 border border-white/80 rounded-2xl text-sm font-black focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm placeholder:text-slate-400"
                  placeholder="e.g. Signature Iced Latte"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Base Price (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-6 py-4 bg-white/60 border border-white/80 rounded-2xl text-sm font-black focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-6 py-4 bg-white/60 border border-white/80 rounded-2xl text-sm font-black focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-6 py-4 bg-white/60 border border-white/80 rounded-2xl text-sm font-black focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Min. Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full px-6 py-4 bg-white/60 border border-white/80 rounded-2xl text-sm font-black focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/40">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-7 rounded-full p-1 transition-all duration-300 cursor-pointer border ${bundleEnabled ? 'bg-purple-600 border-purple-500 purple-glow' : 'bg-slate-200 border-slate-300'}`}
                         onClick={() => setBundleEnabled(!bundleEnabled)}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${bundleEnabled ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Enable Bundle Pricing</span>
                  </div>
                </div>

                <AnimatePresence>
                  {bundleEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-6 overflow-hidden"
                    >
                      <div className="p-8 bg-purple-500/5 rounded-[2.5rem] border border-purple-500/20 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-[9px] font-black text-purple-600 uppercase tracking-widest ml-2">Buy Quantity</label>
                            <input
                              type="number"
                              min="2"
                              required={bundleEnabled}
                              value={buyQuantity}
                              onChange={(e) => setBuyQuantity(e.target.value)}
                              className="w-full px-5 py-3 bg-white/60 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-black"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[9px] font-black text-purple-600 uppercase tracking-widest ml-2">Bundle Price</label>
                            <input
                              type="number"
                              min="0"
                              required={bundleEnabled}
                              value={bundlePrice}
                              onChange={(e) => setBundlePrice(e.target.value)}
                              className="w-full px-5 py-3 bg-white/60 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-black"
                            />
                          </div>
                        </div>
                        
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={showPromoLabel}
                              onChange={(e) => setShowPromoLabel(e.target.checked)}
                              className="peer appearance-none w-6 h-6 border-2 border-purple-200 rounded-lg checked:bg-purple-600 checked:border-purple-600 transition-all cursor-pointer"
                            />
                            <Plus className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                          </div>
                          <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Show "Promo" label on card</span>
                        </label>

                        <div className="flex items-start gap-3 text-[10px] text-purple-700 bg-purple-500/10 p-4 rounded-2xl border border-purple-500/10 font-black uppercase tracking-widest leading-relaxed">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <p>
                            Customers buying {buyQuantity || 'N'} items will pay {bundlePrice ? `Rp ${bundlePrice}` : '...'} instead of normal price.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-8 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-8 py-4 text-[10px] font-black text-slate-500 bg-white/60 hover:bg-white rounded-2xl uppercase tracking-widest transition-all border border-white/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 text-[10px] font-black text-white purple-gradient hover:opacity-90 rounded-2xl uppercase tracking-widest transition-all shadow-xl shadow-purple-200 purple-glow"
                >
                  Save Item
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
