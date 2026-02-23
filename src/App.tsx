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
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-900">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-200 rotate-3">
            B
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
              Bupar POS
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Smart Terminal
            </p>
          </div>
          
          {/* Connection Status Badge */}
          <div className={`ml-6 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
            isRealtime 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isRealtime ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isRealtime ? 'Cloud Sync Active' : 'Offline Mode'}
          </div>
        </div>

        <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/40">
          <button
            onClick={() => setView('cashier')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              view === 'cashier'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <Store className="w-4 h-4" />
            Cashier
          </button>
          <button
            onClick={() => setView('admin')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              view === 'admin'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-0">
        {view === 'cashier' ? (
          <CashierView menu={menu} onCreateOrder={createOrder} />
        ) : (
          <AdminDashboard />
        )}
      </main>
      <Toaster position="top-right" richColors closeButton theme="light" />
    </div>
  );
}

