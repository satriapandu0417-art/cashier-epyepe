import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Store, 
  ListOrdered, 
  MenuSquare, 
  BarChart3, 
  LogOut,
  Menu,
  Cloud
} from 'lucide-react';

export type ViewType = 'dashboard' | 'cashier' | 'orders' | 'menu' | 'analytics';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isRealtime: boolean;
}

export function Sidebar({ activeView, onViewChange, isRealtime }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cashier', label: 'Cashier', icon: Store },
    { id: 'orders', label: 'Orders', icon: ListOrdered },
    { id: 'menu', label: 'Menu', icon: MenuSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className="h-[calc(100vh-32px)] m-4 bg-white/70 backdrop-blur-lg border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl flex flex-col z-50 overflow-hidden shrink-0"
    >
      {/* Top Section */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200/50 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg shadow-purple-200">
            B
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap"
              >
                <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none">
                  Bupar POS
                </h1>
                <div className="flex items-center gap-1 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isRealtime ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                    {isRealtime ? 'Cloud Sync' : 'Offline'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
        >
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <Menu className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onViewChange(item.id as ViewType)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden group/btn ${
                  isActive
                    ? 'text-white shadow-lg shadow-purple-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 hover:shadow-sm'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <motion.div 
                  className="relative z-10 flex items-center gap-3 w-full"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'drop-shadow-md' : 'group-hover/btn:text-purple-600 transition-colors'}`} />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs font-black uppercase tracking-widest whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </button>
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-200/50">
        <div className="relative group">
          <button className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200`}>
            <LogOut className="w-5 h-5" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs font-black uppercase tracking-widest whitespace-nowrap"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
