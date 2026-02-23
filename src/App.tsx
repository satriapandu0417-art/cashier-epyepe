/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CashierView } from './components/CashierView';
import { AdminDashboard } from './components/AdminDashboard';
import { Sidebar, ViewType } from './components/Sidebar';
import { useStore } from './hooks/useStore';
import { Toaster } from 'sonner';
import { Menu } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('cashier');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { menu, createOrder, isRealtime } = useStore();

  // Close sidebar on mobile when view changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeView]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F2F5] font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 blur-[120px] rounded-full" />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-md border-b border-white/60 z-40 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-200">
            B
          </div>
          <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none">
            Bupar POS
          </h1>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar 
          activeView={activeView} 
          onViewChange={setActiveView} 
          isRealtime={isRealtime} 
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="max-w-[1600px] mx-auto h-full">
          {activeView === 'cashier' ? (
            <CashierView menu={menu} onCreateOrder={createOrder} />
          ) : (
            <AdminDashboard activeTab={activeView as any} />
          )}
        </div>
      </main>
      <Toaster position="top-right" richColors closeButton theme="light" />
    </div>
  );
}

