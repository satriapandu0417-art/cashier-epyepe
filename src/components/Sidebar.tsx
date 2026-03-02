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
  Moon,
  Sun,
  ChefHat
} from 'lucide-react';

export type ViewType = 'dashboard' | 'cashier' | 'orders' | 'menu' | 'analytics' | 'kitchen';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isRealtime: boolean;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export function Sidebar({ activeView, onViewChange, isRealtime, isDarkMode, onToggleDarkMode }: SidebarProps) {
  return (
    <aside
      className="h-[calc(100vh-32px)] m-4 w-20 glass-panel rounded-3xl flex flex-col z-50 overflow-hidden shrink-0"
    >
      {/* Top Section - Logo Only */}
      <div className="h-24 flex items-center justify-center border-b border-[var(--border-color)] shrink-0">
        <div className="w-10 h-10 rounded-2xl purple-gradient flex items-center justify-center text-white font-black text-xl shrink-0 accent-shadow">
          C
        </div>
      </div>

      {/* Navigation Menu - Icons Only */}
      <div className="flex-1 py-6 px-4 space-y-4 overflow-y-auto scrollbar-hide flex flex-col items-center">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'cashier', label: 'Cashier', icon: Store },
          { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
          { id: 'orders', label: 'Orders', icon: ListOrdered },
          { id: 'menu', label: 'Menu', icon: MenuSquare },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onViewChange(item.id as ViewType)}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 relative overflow-hidden group/btn ${
                  isActive
                    ? 'text-white accent-shadow'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 purple-gradient"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'drop-shadow-md' : 'group-hover/btn:text-[var(--accent-primary)] transition-colors'}`} />
              </button>
              {/* Tooltip */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section - Icons Only */}
      <div className="p-4 border-t border-[var(--border-color)] space-y-4 flex flex-col items-center">
        {onToggleDarkMode && (
          <div className="relative group">
            <button 
              onClick={onToggleDarkMode}
              className="w-12 h-12 flex items-center justify-center rounded-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-all duration-300"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </div>
          </div>
        )}
        
        <div className="relative group">
          <button className="w-12 h-12 flex items-center justify-center rounded-2xl text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-300">
            <LogOut className="w-5 h-5" />
          </button>
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
            Logout
          </div>
        </div>
      </div>
    </aside>
  );
}
