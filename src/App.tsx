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
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 blur-[120px] rounded-full" />
      </div>

      {/* Top Navigation Bar */}
      <nav className="h-20 glass-panel px-8 flex items-center justify-between sticky top-0 z-50 border-b-0 shadow-none">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 purple-gradient rounded-2xl flex items-center justify-center text-white font-black text-2xl purple-glow rotate-3 transition-transform hover:rotate-0 cursor-pointer">
            B
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
              Bupar POS
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
              Premium SaaS Terminal
            </p>
          </div>
          
          {/* Connection Status Badge */}
          <div className={`ml-8 flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all border ${
            isRealtime 
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 neon-green-glow' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isRealtime ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isRealtime ? 'Cloud Sync Active' : 'Offline Mode'}
          </div>
        </div>

        <div className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/60 shadow-inner">
          <button
            onClick={() => setView('cashier')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              view === 'cashier'
                ? 'bg-white text-purple-600 shadow-lg shadow-purple-100 ring-1 ring-white/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Store className="w-4 h-4" />
            Cashier
          </button>
          <button
            onClick={() => setView('admin')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              view === 'admin'
                ? 'bg-white text-purple-600 shadow-lg shadow-purple-100 ring-1 ring-white/50'
                : 'text-slate-400 hover:text-slate-600'
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

