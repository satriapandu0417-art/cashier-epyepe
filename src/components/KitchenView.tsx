import React, { useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Clock, CheckCircle, AlertCircle, Timer, User, Hash } from 'lucide-react';
import { formatCurrency } from '../utils';

export function KitchenView() {
  const { orders, toggleOrderItemPrepared, updateOrderStatus } = useStore();

  const activeOrders = useMemo(() => {
    return orders
      .filter(o => o.status !== 'Picked Up' && o.status !== 'Cancelled')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  const getTimeElapsed = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000); // minutes
    return diff;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] flex items-center gap-5 tracking-tighter uppercase">
            <div className="w-12 h-12 purple-gradient rounded-2xl flex items-center justify-center text-white accent-shadow">
              <ChefHat className="w-7 h-7" />
            </div>
            Kitchen Display
          </h2>
          <p className="text-[var(--text-secondary)] text-sm font-black uppercase tracking-[0.2em] mt-2">
            Manage active orders and preparation status
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="glass-panel px-6 py-3 rounded-2xl border border-[var(--border-color)] flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">
              {activeOrders.length} Active Orders
            </span>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {activeOrders.map((order) => {
            const timeElapsed = getTimeElapsed(order.createdAt);
            const isUrgent = timeElapsed > 15;
            const preparedCount = order.items.filter(i => i.isPrepared).length;
            const totalCount = order.items.length;
            const progress = (preparedCount / totalCount) * 100;

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -50 }}
                className={`glass-panel rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 ${
                  isUrgent ? 'border-rose-500/30 shadow-xl shadow-rose-500/10' : 'border-[var(--border-color)]'
                }`}
              >
                {/* Order Header */}
                <div className={`p-6 flex items-center justify-between border-b border-[var(--border-color)] ${
                  isUrgent ? 'bg-rose-500/5' : 'bg-[var(--bg-card)]'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                      isUrgent ? 'bg-rose-500 text-white accent-shadow animate-pulse' : 'bg-[var(--bg-panel)] text-[var(--text-secondary)]'
                    }`}>
                      #{order.id.slice(-3).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight truncate max-w-[150px]">
                        {order.customerName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className={`w-3 h-3 ${isUrgent ? 'text-rose-500' : 'text-[var(--text-secondary)]'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isUrgent ? 'text-rose-500' : 'text-[var(--text-secondary)]'}`}>
                          {timeElapsed}m ago
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                      order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      order.status === 'Preparing' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {order.status}
                    </span>
                    {order.note && (
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 max-w-[120px]">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span className="truncate">{order.note}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-[var(--bg-panel)] overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full transition-all duration-500 ${
                      progress === 100 ? 'bg-emerald-500' : 'purple-gradient'
                    }`}
                  />
                </div>

                {/* Items List */}
                <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide">
                  {order.items.map((item, idx) => (
                    <div 
                      key={`${item.id}-${idx}`}
                      onClick={() => toggleOrderItemPrepared(order.id, item.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border group ${
                        item.isPrepared 
                          ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' 
                          : 'bg-[var(--bg-panel)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                          item.isPrepared ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-primary)]'
                        }`}>
                          {item.quantity}x
                        </div>
                        <div>
                          <p className={`text-sm font-black tracking-tight ${item.isPrepared ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                            {item.name}
                          </p>
                          {item.note && (
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">
                              Note: {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        item.isPrepared ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-card)] border border-[var(--border-color)] group-hover:border-[var(--accent-primary)]'
                      }`}>
                        {item.isPrepared && <CheckCircle className="w-4 h-4" />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-[var(--bg-panel)]/50 border-t border-[var(--border-color)] flex gap-3">
                  {progress === 100 ? (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Picked Up')}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all accent-shadow flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Picked Up
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <Timer className="w-4 h-4" />
                      {preparedCount} / {totalCount} Items Ready
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {activeOrders.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-[var(--bg-panel)] rounded-[3rem] flex items-center justify-center mb-8 border border-[var(--border-color)] shadow-inner">
              <ChefHat className="w-12 h-12 text-[var(--text-secondary)] opacity-20" />
            </div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">No Active Orders</h3>
            <p className="text-[var(--text-secondary)] text-sm font-black uppercase tracking-widest mt-2">
              Kitchen is all caught up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
