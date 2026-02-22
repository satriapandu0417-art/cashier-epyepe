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
  
  const [bundleEnabled, setBundleEnabled] = useState(initialData?.bundle?.enabled || false);
  const [buyQuantity, setBuyQuantity] = useState(initialData?.bundle?.buyQuantity?.toString() || '');
  const [bundlePrice, setBundlePrice] = useState(initialData?.bundle?.bundlePrice?.toString() || '');
  const [showPromoLabel, setShowPromoLabel] = useState(initialData?.bundle?.showPromoLabel || false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setBasePrice(initialData?.basePrice?.toString() || '');
      setCategory(initialData?.category || 'Coffee');
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
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {initialData ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="e.g. Iced Latte"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${bundleEnabled ? 'bg-orange-500' : 'bg-gray-200'}`}
                         onClick={() => setBundleEnabled(!bundleEnabled)}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${bundleEnabled ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Enable Bundle Pricing</span>
                  </div>
                </div>

                <AnimatePresence>
                  {bundleEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-orange-800 mb-1">Buy Quantity</label>
                            <input
                              type="number"
                              min="2"
                              required={bundleEnabled}
                              value={buyQuantity}
                              onChange={(e) => setBuyQuantity(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-orange-800 mb-1">Bundle Price (Total)</label>
                            <input
                              type="number"
                              min="0"
                              required={bundleEnabled}
                              value={bundlePrice}
                              onChange={(e) => setBundlePrice(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                            />
                          </div>
                        </div>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showPromoLabel}
                            onChange={(e) => setShowPromoLabel(e.target.checked)}
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm text-orange-800">Show "Promo" label on card</span>
                        </label>

                        <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-100/50 p-2 rounded-lg">
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

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-xl font-medium transition-colors shadow-sm shadow-orange-200"
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
