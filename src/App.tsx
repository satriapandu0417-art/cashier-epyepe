/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CashierView } from './components/CashierView';
import { AdminDashboard } from './components/AdminDashboard';
import { Sidebar, ViewType } from './components/Sidebar';
import { KitchenView } from './components/KitchenView';
import { useStore } from './hooks/useStore';
import { Toaster } from 'sonner';
import { Menu, Moon, Sun } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('cashier');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { menu, createOrder, isRealtime } = useStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close sidebar on mobile when view changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeView]);

  return (
    <div className="flex h-screen overflow-hidden font-sans selection:bg-[var(--accent-primary)]/30 selection:text-[var(--text-primary)] transition-colors duration-300">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[var(--bg-base)]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--accent-primary)]/20 dark:bg-[var(--accent-primary)]/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-float" style={{ animationDuration: '15s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/20 dark:bg-indigo-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-float" style={{ animationDuration: '20s', animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-emerald-500/10 dark:bg-emerald-500/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-float" style={{ animationDuration: '18s', animationDelay: '5s' }} />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBMMDAgMEw0MCAwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMTUwLCAxNTAsIDE1MCwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50 dark:opacity-20" />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-panel z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl purple-gradient flex items-center justify-center text-white font-black text-lg accent-shadow">
            B
          </div>
          <h1 className="text-sm font-black tracking-tight leading-none text-[var(--text-primary)]">
            Bupar POS
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] rounded-xl transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar 
          activeView={activeView} 
          onViewChange={setActiveView} 
          isRealtime={isRealtime}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 pt-20 lg:pt-6 relative z-10">
        <div className="max-w-[1600px] mx-auto h-full">
          {activeView === 'cashier' ? (
            <CashierView menu={menu} onCreateOrder={createOrder} />
          ) : activeView === 'kitchen' ? (
            <KitchenView />
          ) : (
            <AdminDashboard activeTab={activeView as any} />
          )}
        </div>
      </main>
      <Toaster position="top-right" richColors closeButton theme={isDarkMode ? 'dark' : 'light'} />
    </div>
  );
}

