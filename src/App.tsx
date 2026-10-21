import React, { useState, useEffect } from 'react';
import { LiveThemeSimulator } from './components/LiveThemeSimulator';
import { BloggerThemeHub } from './components/BloggerThemeHub';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { VideoManager } from './components/admin/VideoManager';
import { AdNetworksManager } from './components/admin/AdNetworksManager';
import { BannerManager } from './components/admin/BannerManager';
import { VideoAnalytics } from './components/admin/VideoAnalytics';
import { UserManager } from './components/admin/UserManager';
import { TelegramBotManager } from './components/admin/TelegramBotManager';
import { ActivityLogs } from './components/admin/ActivityLogs';
import { SystemSettingsView } from './components/admin/SystemSettingsView';
import { AdminUser } from './types';
import { safeFetchJson } from './utils/api';

export default function App() {
  const [currentView, setCurrentView] = useState<'simulator' | 'xml-hub' | 'admin'>('simulator');
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('premium_admin_token'));
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminTab, setAdminTab] = useState<string>('dashboard');

  // Verify stored admin token on load
  useEffect(() => {
    if (adminToken) {
      safeFetchJson<AdminUser>('/api/auth/me', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((data) => {
          setAdminUser(data);
        })
        .catch(() => {
          localStorage.removeItem('premium_admin_token');
          setAdminToken(null);
          setAdminUser(null);
        });
    }
  }, [adminToken]);

  // Telegram Mini App (WebApp) Integration
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#171128');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0b0f19');
      } catch (err) {
        console.warn('Telegram WebApp init warning:', err);
      }
    }
  }, []);

  // Hash-based navigation support (#admin, #xml-hub, #app)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') setCurrentView('admin');
      else if (hash === '#xml-hub') setCurrentView('xml-hub');
      else if (hash === '#app' || hash === '' || hash === '#/') setCurrentView('simulator');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleLoginSuccess = (token: string, admin: AdminUser) => {
    setAdminToken(token);
    setAdminUser(admin);
    setAdminTab('dashboard');
  };

  const handleLogout = () => {
    if (adminToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }
    localStorage.removeItem('premium_admin_token');
    setAdminToken(null);
    setAdminUser(null);
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Main Views - Top navbar header excluded per user focus request */}
      <main className="w-full">
        {currentView === 'simulator' && (
          <LiveThemeSimulator
            onNavigateToAdmin={() => {
              window.location.hash = '#admin';
              setCurrentView('admin');
            }}
            onNavigateToXml={() => {
              window.location.hash = '#xml-hub';
              setCurrentView('xml-hub');
            }}
          />
        )}

        {currentView === 'xml-hub' && (
          <BloggerThemeHub
            onBackToApp={() => {
              window.location.hash = '#app';
              setCurrentView('simulator');
            }}
          />
        )}

        {currentView === 'admin' && (
          <>
            {!adminUser || !adminToken ? (
              <AdminLogin
                onLoginSuccess={handleLoginSuccess}
                onBackToApp={() => {
                  window.location.hash = '#app';
                  setCurrentView('simulator');
                }}
              />
            ) : (
              <AdminLayout
                admin={adminUser}
                activeTab={adminTab}
                onSelectTab={setAdminTab}
                onLogout={handleLogout}
                onBackToApp={() => {
                  window.location.hash = '#app';
                  setCurrentView('simulator');
                }}
              >
                {adminTab === 'dashboard' && (
                  <AdminDashboard token={adminToken} onNavigate={setAdminTab} />
                )}
                {adminTab === 'videos' && <VideoManager token={adminToken} />}
                {adminTab === 'networks' && <AdNetworksManager token={adminToken} />}
                {adminTab === 'banners' && <BannerManager token={adminToken} />}
                {adminTab === 'analytics' && <VideoAnalytics token={adminToken} />}
                {adminTab === 'users' && <UserManager token={adminToken} />}
                {adminTab === 'telegram' && <TelegramBotManager token={adminToken} />}
                {adminTab === 'logs' && <ActivityLogs token={adminToken} />}
                {adminTab === 'settings' && <SystemSettingsView token={adminToken} />}
              </AdminLayout>
            )}
          </>
        )}
      </main>
    </div>
  );
}
