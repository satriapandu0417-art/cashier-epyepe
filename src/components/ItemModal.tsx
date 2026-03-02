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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel rounded-[3.5rem] shadow-2xl w-full max-w-lg overflow-hidden border-[var(--border-color)] bg-[var(--bg-panel)]"
          >
            <div className="flex items-center justify-between p-8 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter uppercase">
                {initialData ? 'Edit Menu Item' : 'Add New Item'}
              </h2>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-panel)] rounded-xl transition-all border border-[var(--border-color)] shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-sm font-black focus:ring-2 focus:ring-[var(--accent-primary)]/50 outline-none transition-all shadow-sm placeholder:text-[var(--text-secondary)] text-[var(--text-primary)]"
                  placeholder="e.g. Signature Iced Latte"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Base Price (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-6 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-sm font-black focus:ring-2 focus:ring-[var(--accent-primary)]/50 outline-none transition-all shadow-sm text-[var(--text-primary)]"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-6 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-sm font-black focus:ring-2 focus:ring-[var(--accent-primary)]/50 outline-none transition-all shadow-sm appearance-none cursor-pointer text-[var(--text-primary)]"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-6 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-sm font-black focus:ring-2 focus:ring-[var(--accent-primary)]/50 outline-none transition-all shadow-sm text-[var(--text-primary)]"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Min. Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full px-6 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-sm font-black focus:ring-2 focus:ring-[var(--accent-primary)]/50 outline-none transition-all shadow-sm text-[var(--text-primary)]"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-7 rounded-full p-1 transition-all duration-300 cursor-pointer border ${bundleEnabled ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] animate-pulse-glow' : 'bg-[var(--bg-card)] border-[var(--border-color)]'}`}
                         onClick={() => setBundleEnabled(!bundleEnabled)}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${bundleEnabled ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Enable Bundle Pricing</span>
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
                      <div className="p-8 bg-[var(--accent-primary)]/5 rounded-[2.5rem] border border-[var(--accent-primary)]/20 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-[9px] font-black text-[var(--accent-primary)] uppercase tracking-widest ml-2">Buy Quantity</label>
                            <input
                              type="number"
                              min="2"
                              required={bundleEnabled}
                              value={buyQuantity}
                              onChange={(e) => setBuyQuantity(e.target.value)}
                              className="w-full px-5 py-3 bg-[var(--bg-card)] border border-[var(--accent-primary)]/30 rounded-xl focus:ring-2 focus:ring-[var(--accent-primary)]/50 outline-none text-sm font-black text-[var(--text-primary)]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[9px] font-black text-[var(--accent-primary)] uppercase tracking-widest ml-2">Bundle Price</label>
                            <input
                              type="number"
                              min="0"
                              required={bundleEnabled}
                              value={bundlePrice}
                              onChange={(e) => setBundlePrice(e.target.value)}
                              className="w-full px-5 py-3 bg-[var(--bg-card)] border border-[var(--accent-primary)]/30 rounded-xl focus:ring-2 focus:ring-[var(--accent-primary)]/50 outline-none text-sm font-black text-[var(--text-primary)]"
                            />
                          </div>
                        </div>
                        
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={showPromoLabel}
                              onChange={(e) => setShowPromoLabel(e.target.checked)}
                              className="peer appearance-none w-6 h-6 border-2 border-[var(--accent-primary)]/30 rounded-lg checked:bg-[var(--accent-primary)] checked:border-[var(--accent-primary)] transition-all cursor-pointer bg-[var(--bg-card)]"
                            />
                            <Plus className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                          </div>
                          <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest">Show "Promo" label on card</span>
                        </label>

                        <div className="flex items-start gap-3 text-[10px] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 p-4 rounded-2xl border border-[var(--accent-primary)]/20 font-black uppercase tracking-widest leading-relaxed">
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
                  className="flex-1 px-8 py-4 text-[10px] font-black text-[var(--text-secondary)] bg-[var(--bg-panel)] hover:bg-[var(--bg-card)] rounded-2xl uppercase tracking-widest transition-all border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 text-[10px] font-black text-white purple-gradient hover:opacity-90 rounded-2xl uppercase tracking-widest transition-all accent-shadow animate-pulse-glow"
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
