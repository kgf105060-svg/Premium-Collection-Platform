import React, { useState } from 'react';
import {
  LayoutDashboard,
  Video,
  Layers,
  Image,
  BarChart3,
  Users,
  Send,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminLayoutProps {
  admin: AdminUser;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  onBackToApp?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  admin,
  activeTab,
  onSelectTab,
  onLogout,
  onBackToApp,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড (Dashboard)', icon: LayoutDashboard },
    { id: 'videos', label: 'ভিডিও ম্যানেজমেন্ট (Videos)', icon: Video },
    { id: 'networks', label: 'অ্যাড নেটওয়ার্কস (Ad Networks)', icon: Layers },
    { id: 'banners', label: 'ব্যানার বিজ্ঞাপন (Banner Ads)', icon: Image },
    { id: 'analytics', label: 'অ্যানালিটিক্স (Analytics)', icon: BarChart3 },
    { id: 'users', label: 'ইউজার ও সেশন (Users)', icon: Users },
    { id: 'telegram', label: 'টেলিগ্রাম বট (Telegram Bot)', icon: Send },
    { id: 'logs', label: 'অ্যাক্টিভিটি লগ (Audit Logs)', icon: Activity },
    { id: 'settings', label: 'সিস্টেম সেটিংস (Settings)', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-[#0d121f] border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm">অ্যাডমিন প্যানেল</span>
        </div>

        <div className="flex items-center gap-2">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="text-xs px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold"
            >
              ← অ্যাপ
            </button>
          )}
          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold truncate max-w-[120px]">
            {admin.email}
          </span>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="লগআউট"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#0d121f] border-r border-slate-200 dark:border-slate-800 p-4 justify-between">
          <div className="space-y-6">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-600 flex items-center justify-center shadow-md shadow-pink-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
                  প্রিমিয়াম অ্যাডমিন
                </h1>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Admin Panel v2.5
                </span>
              </div>
            </div>

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-colors cursor-pointer border border-purple-200 dark:border-purple-800"
              >
                <span>← ভিডিও অ্যাপে ফিরে যান</span>
              </button>
            )}

            {/* Navigation links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User profile & logout */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="px-2">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {admin.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{admin.email}</div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট (Logout)</span>
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-[#0d121f] p-4 flex flex-col justify-between shadow-2xl z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm">অ্যাডমিন মেনু</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-left ${
                          isActive
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>লগআউট</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
