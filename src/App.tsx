/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CashierView } from './components/CashierView';
import { AdminDashboard } from './components/AdminDashboard';
import { useStore } from './hooks/useStore';
import { LayoutDashboard, Store, Wifi, WifiOff } from 'lucide-react';
import { Toaster } from 'sonner';

export default function App() {
  const [view, setView] = useState<'cashier' | 'admin'>('cashier');
  const { menu, createOrder, isRealtime } = useStore();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-200">
            C
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Nasi Bupar POS
          </h1>
          
          {/* Connection Status Badge */}
          <div className={`ml-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
            isRealtime ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}>
            {isRealtime ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isRealtime ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setView('cashier')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'cashier'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Store className="w-4 h-4" />
            Cashier
          </button>
          <button
            onClick={() => setView('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'admin'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto">
        {view === 'cashier' ? (
          <CashierView menu={menu} onCreateOrder={createOrder} />
        ) : (
          <AdminDashboard />
        )}
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}

