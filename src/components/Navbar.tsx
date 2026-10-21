import React from 'react';
import { Sparkles, Eye, Download, ShieldCheck, Sun, Moon } from 'lucide-react';
import { AdminUser } from '../types';

interface NavbarProps {
  currentView: 'simulator' | 'xml-hub' | 'admin';
  onChangeView: (view: 'simulator' | 'xml-hub' | 'admin') => void;
  adminUser: AdminUser | null;
  onLogoutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  adminUser,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <div
          onClick={() => onChangeView('simulator')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-600 flex items-center justify-center shadow-md shadow-pink-500/20 flex-shrink-0">
            <div className="w-4 h-4 rotate-45 border-2 border-white bg-white/20" />
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base leading-tight bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              প্রিমিয়াম কালেকশন
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">
              Blogger Theme &amp; Admin Suite
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => onChangeView('simulator')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'simulator'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">লাইভ থিম প্রিভিউ</span>
            <span className="sm:hidden">Theme</span>
          </button>

          <button
            onClick={() => onChangeView('xml-hub')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'xml-hub'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Blogger XML হাব</span>
            <span className="sm:hidden">XML</span>
          </button>

          <button
            onClick={() => onChangeView('admin')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'admin'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">অ্যাডমিন প্যানেল</span>
            <span className="sm:hidden">Admin</span>
            {adminUser && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            )}
          </button>
        </nav>

        {/* Quick XML Download Action */}
        <div className="flex items-center gap-2">
          <a
            href="/api/theme/download"
            download
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.XML Download</span>
          </a>
        </div>
      </div>
    </header>
  );
};
