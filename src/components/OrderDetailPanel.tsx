import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';
import { formatCurrency } from '../utils';
import { X, CheckCircle2, Clock, ChefHat, AlertCircle, ShoppingBag, Lock } from 'lucide-react';
import { useStore } from '../hooks/useStore';

interface OrderDetailPanelProps {
  order: Order;
  onClose: () => void;
}

export function OrderDetailPanel({ order, onClose }: OrderDetailPanelProps) {
  const { toggleOrderItemPrepared, updateOrderStatus, updateOrderPaymentStatus } = useStore();

  const totalItems = order.items.length;
  const preparedItems = order.items.filter(i => i.isPrepared).length;
  const progress = totalItems > 0 ? (preparedItems / totalItems) * 100 : 0;
  const isAllPrepared = preparedItems === totalItems && totalItems > 0;
  const isPickedUp = order.status === 'Picked Up';

  const handleTogglePayment = () => {
    const nextStatus = order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    updateOrderPaymentStatus(order.id, nextStatus);
  };

  return (
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
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
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
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
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

        {/* Progress Section */}
        <div className="p-6 pb-2">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2 text-orange-600 font-medium">
              <ChefHat className="w-5 h-5" />
              <h3>Kitchen Status</h3>
            </div>
            <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full rounded-full ${isAllPrepared ? 'bg-green-500' : 'bg-orange-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-3 ${isPickedUp ? 'opacity-75 pointer-events-none grayscale-[0.5]' : ''}`}>
          {order.items.map((item) => (
            <motion.div
              key={item.id}
              layout
              className={`group relative p-4 rounded-xl border transition-all duration-200 ${
                item.isPrepared 
                  ? 'bg-green-50/50 border-green-100' 
                  : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-sm'
              }`}
            >
              <label className="flex items-start gap-4 cursor-pointer">
                <div className="relative flex items-center justify-center mt-1">
                  <input
                    type="checkbox"
                    checked={!!item.isPrepared}
                    onChange={() => !isPickedUp && toggleOrderItemPrepared(order.id, item.id)}
                    disabled={isPickedUp}
                    className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-lg checked:bg-green-500 checked:border-green-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  />
                  <CheckCircle2 className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-medium transition-all ${
                      item.isPrepared ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </h4>
                    <span className="font-bold text-gray-900">x{item.quantity}</span>
                  </div>
                  
                  {item.note && (
                    <div className="mt-1 flex items-start gap-1.5 text-xs text-orange-600 bg-orange-50 p-1.5 rounded-md inline-block">
                      <AlertCircle className="w-3 h-3 mt-0.5" />
                      {item.note}
                    </div>
                  )}
                </div>
              </label>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(order.total)}</span>
          </div>
          
          <AnimatePresence mode="wait">
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

            {order.status === 'Preparing' && (
               <div className="text-center text-sm text-gray-500 italic">
                 Finish preparing all items to complete order
               </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
