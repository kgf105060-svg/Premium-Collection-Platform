import React, { useState, useEffect } from 'react';
import {
  Layers,
  ShieldCheck,
  Check,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  X,
  Play,
  Globe,
  Code,
  Zap,
} from 'lucide-react';
import { AdNetwork, AdNetworkConfig } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface AdNetworksManagerProps {
  token: string;
}

export const AdNetworksManager: React.FC<AdNetworksManagerProps> = ({ token }) => {
  const [networks, setNetworks] = useState<AdNetwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'monetag' | 'bengal' | 'gigapub' | 'adsgram' | null>(null);

  // System Strategy Settings State
  const [settings, setSettings] = useState<{
    adDistributionMode: 'single_network' | 'custom_quota' | 'auto_rotation';
    singleNetworkProvider: 'Bengal Ads' | 'Monetag' | 'GigaPub' | 'AdsGram';
    singleNetworkAdCount: number;
    defaultRequiredAds: number;
  }>({
    adDistributionMode: 'single_network',
    singleNetworkProvider: 'Monetag',
    singleNetworkAdCount: 3,
    defaultRequiredAds: 3,
  });
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Live Test Modal state
  const [testModal, setTestModal] = useState<{
    isOpen: boolean;
    network: AdNetwork | null;
    countdown: number;
    timerActive: boolean;
    completed: boolean;
    openedTab: boolean;
  }>({
    isOpen: false,
    network: null,
    countdown: 5,
    timerActive: false,
    completed: false,
    openedTab: false,
  });

  const fetchNetworks = () => {
    safeFetchJson<{ networks: AdNetwork[] }>('/api/ads/networks', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setNetworks(data.networks || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load ad networks:', err);
        setLoading(false);
      });
  };

  const fetchSettings = () => {
    safeFetchJson<any>('/api/settings')
      .then((data) => {
        if (data) {
          setSettings({
            adDistributionMode: data.adDistributionMode || 'single_network',
            singleNetworkProvider: data.singleNetworkProvider || 'Monetag',
            singleNetworkAdCount: data.singleNetworkAdCount || 3,
            defaultRequiredAds: data.defaultRequiredAds || 3,
          });
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  };

  useEffect(() => {
    fetchNetworks();
    fetchSettings();
  }, [token]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('সেটিংস সংরক্ষণ ব্যর্থ হয়েছে');
      setSuccessMsg('অ্যাড ডেলিভারি পলিসি ও নেটওয়ার্ক মোড সফলভাবে সংরক্ষিত হয়েছে!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setSuccessMsg(`ত্রুটি: ${err.message || 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে'}`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdate = async (net: AdNetwork) => {
    setSavingId(net.id);
    try {
      const res = await fetch(`/api/ads/networks/${net.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(net),
      });

      if (!res.ok) throw new Error('আপডেট ব্যর্থ হয়েছে');

      setSuccessMsg(`${net.name} কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!`);
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchNetworks();
    } catch (err: any) {
      setSuccessMsg(`ত্রুটি: ${err.message || 'সংরক্ষণে ত্রুটি হয়েছে'}`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } finally {
      setSavingId(null);
    }
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newNetworks = [...networks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newNetworks.length) return;

    const tempPriority = newNetworks[index].priority;
    newNetworks[index].priority = newNetworks[targetIndex].priority;
    newNetworks[targetIndex].priority = tempPriority;

    handleUpdate(newNetworks[index]);
    handleUpdate(newNetworks[targetIndex]);
  };

  const updateNetworkField = (id: string, updates: Partial<AdNetwork>) => {
    setNetworks(
      networks.map((n) => {
        if (n.id === id) {
          return { ...n, ...updates };
        }
        return n;
      })
    );
  };

  const updateNetworkConfig = (id: string, configUpdates: Partial<AdNetworkConfig>) => {
    setNetworks(
      networks.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            config: {
              ...(n.config || {}),
              ...configUpdates,
            },
          };
        }
        return n;
      })
    );
  };

  const startTestAd = (net: AdNetwork) => {
    const duration = net.config?.countdownSeconds || 5;
    const directUrl = net.config?.directUrl;
    let didOpen = false;

    if (directUrl && net.config?.openInNewTab !== false) {
      try {
        const win = window.open(directUrl, '_blank');
        if (win) didOpen = true;
      } catch (e) {
        didOpen = false;
      }
    }

    setTestModal({
      isOpen: true,
      network: net,
      countdown: duration,
      timerActive: true,
      completed: false,
      openedTab: didOpen,
    });
  };

  useEffect(() => {
    let interval: any = null;
    if (testModal.isOpen && testModal.timerActive && testModal.countdown > 0) {
      interval = setInterval(() => {
        setTestModal((prev) => {
          if (prev.countdown <= 1) {
            clearInterval(interval);
            return { ...prev, countdown: 0, timerActive: false, completed: true };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testModal.isOpen, testModal.timerActive, testModal.countdown]);

  const getNetworkBadgeColor = (name: string) => {
    switch (name) {
      case 'Bengal Ads':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'Monetag':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30';
      case 'GigaPub':
        return 'bg-teal-500/10 text-teal-500 border-teal-500/30';
      case 'AdsGram':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/30';
      default:
        return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-500" />
            <span>বিজ্ঞাপন নেটওয়ার্ক কনফিগারেশন (Ad Networks)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monetag, Bengal Ads, GigaPub এবং AdsGram এর ডাইরেক্ট লিঙ্ক, জোন আইডি, অফিসিয়াল SDK ও অটো-রোটেশন ম্যানেজ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveGuideTab(activeGuideTab ? null : 'monetag')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{activeGuideTab ? 'গাইড বন্ধ করুন' : 'নেটওয়ার্ক সেটআপ গাইড'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Network Setup Guide Collapsible */}
      {activeGuideTab && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 space-y-4 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>৪টি বিজ্ঞাপন নেটওয়ার্ক ইন্টিগ্রেশন নির্দেশিকা (Setup Guide)</span>
            </h3>
            <button
              onClick={() => setActiveGuideTab(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'monetag', label: 'Monetag (মনেট্যাগ)' },
              { id: 'bengal', label: 'Bengal Ads (বেঙ্গল অ্যাডস)' },
              { id: 'gigapub', label: 'GigaPub (গিগাপাব)' },
              { id: 'adsgram', label: 'AdsGram (এডসগ্রাম)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGuideTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  activeGuideTab === tab.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeGuideTab === 'monetag' && (
            <div className="space-y-2 text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-white/5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span>Monetag সেটআপ ও অফিশিয়াল SDK (Zone 11699704):</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">SDK ACTIVE</span>
              </h4>
              <p>১. <strong>অফিশিয়াল Rewarded SDK:</strong> অ্যাপ ও ব্লুগার থিমে Monetag SDK যুক্ত করা হয়েছে:<br/>
                <code className="text-pink-300 bg-black/40 px-2 py-1 rounded block mt-1 font-mono text-[11px] select-all">
                  &lt;script src=&apos;//libtl.com/sdk.js&apos; data-zone=&apos;11699704&apos; data-sdk=&apos;show_11699704&apos;&gt;&lt;/script&gt;
                </code>
              </p>
              <p>২. <strong>Zone ID:</strong> আপনার সক্রিয় জোন আইডি <code>11699704</code> এবং ফাংশন <code>window.show_11699704()</code>। ইউজার আনলক ক্লিক করলে ফুলস্ক্রিন রিওয়ার্ডেড ইন্টারস্টিশিয়াল অ্যাড ট্রিগার হয়।</p>
              <p>৩. <strong>Direct Link / SmartLink:</strong> পপ-আপ বা ফলব্যাকের জন্য ডাইরেক্ট লিঙ্ক দেওয়া রয়েছে। ব্লগারে এটি সম্পূর্ণ স্বয়ংক্রিয়ভাবে কাজ করে এবং সর্বোচ্চ CPM রেভিনিউ প্রদান করে।</p>
            </div>
          )}

          {activeGuideTab === 'bengal' && (
            <div className="space-y-2 text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-white/5">
              <h4 className="font-bold text-white text-sm">Bengal Ads সেটআপ কীভাবে করবেন:</h4>
              <p>১. <strong>SmartLink URL:</strong> Bengal Ads ড্যাশবোর্ড থেকে ক্যাম্পেইন স্মার্টলিঙ্ক কপি করে &ldquo;Direct Link URL&rdquo; বক্সে পেস্ট করুন। বাংলাদেশি ট্রাফিকের জন্য এটি অত্যন্ত লাভজনক।</p>
              <p>২. <strong>Zone / Unit ID:</strong> আপনার নির্ধারিত ইউনিট বা জোন আইডি (যেমন: <code>BG_ADS_ZONE_884</code>) বসিয়ে দিন।</p>
              <p>৩. স্ক্রিপ্ট মোডে ব্যবহার করতে চাইলে লোডার URL (<code>https://bengalads.net/tag/loader.js</code>) ব্যবহার করুন।</p>
            </div>
          )}

          {activeGuideTab === 'gigapub' && (
            <div className="space-y-2 text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-white/5">
              <h4 className="font-bold text-white text-sm">GigaPub সেটআপ কীভাবে করবেন:</h4>
              <p>১. <strong>Offer Link:</strong> GigaPub ড্যাশবোর্ড থেকে আপনার অফার ডাইরেক্ট লিঙ্ক কপি করে পেস্ট করুন (যেমন: <code>https://gigapub.com/r/gp_49012</code>)।</p>
              <p>২. <strong>Zone ID &amp; Token:</strong> আপনার পাবলিশার টোকেন ও জোন আইডি প্রদান করুন।</p>
              <p>৩. গ্লোবাল এবং মাল্টি-কান্ট্রি ট্রাফিকের জন্য এটি চমৎকার ফলব্যাক নেটওয়ার্ক।</p>
            </div>
          )}

          {activeGuideTab === 'adsgram' && (
            <div className="space-y-2 text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-white/5">
              <h4 className="font-bold text-white text-sm">AdsGram সেটআপ কীভাবে করবেন:</h4>
              <p>১. <strong>Block ID:</strong> টেলিগ্রাম বটের মাধ্যমে (<code>@AdsgramBot</code>) বা adsgram.ai ড্যাশবোর্ড থেকে প্রাপ্ত Block ID (যেমন: <code>4821</code>) বসান।</p>
              <p>২. <strong>Official SDK:</strong> থিমে অফিশিয়াল AdsGram SDK (<code>https://sad.adsgram.ai/js/sad.min.js</code>) বিল্ট-ইন যুক্ত রয়েছে। টেলিগ্রাম মিনি-অ্যাপ ও মোবাইল ওয়েব ব্রাউজারে এটি ভিডিও অ্যাড লোড করে।</p>
              <p>৩. ব্রাউজারে AdsGram লোড না হলে স্বয়ংক্রিয়ভাবে ডাইরেক্ট লিঙ্কে ফলব্যাক হয়ে আনলক সম্পন্ন করায়।</p>
            </div>
          )}
        </div>
      )}

      {/* Interactive Ad Delivery Mode & Network Count Configuration Panel */}
      <div className="bg-white dark:bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                বিজ্ঞাপন ডেলিভারি পলিসি ও নেটওয়ার্ক নির্বাচন (Delivery Strategy)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                সকল ৪টি বিজ্ঞাপন ১টি নেটওয়ার্ক থেকে চালাবেন নাকি প্রতিটি নেটওয়ার্কের বিজ্ঞাপন সংখ্যা নির্ধারণ করবেন তা নিয়ন্ত্রণ করুন।
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-pink-500/20 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>{savingSettings ? 'সংরক্ষণ হচ্ছে...' : 'পলিসি সেভ করুন'}</span>
          </button>
        </div>

        {/* Mode selector buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSettings({ ...settings, adDistributionMode: 'single_network' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              settings.adDistributionMode === 'single_network'
                ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="font-bold text-xs flex items-center justify-between mb-1">
              <span>১টি নেটওয়ার্ক থেকে সকল অ্যাড</span>
              {settings.adDistributionMode === 'single_network' && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
            </div>
            <p className="text-[11px] leading-relaxed opacity-80">
              সকল ৪টি বা নির্ধারিত বিজ্ঞাপন ১টি নির্দিষ্ট নেটওয়ার্ক (যেমন Monetag বা Bengal Ads) থেকেই চলবে।
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSettings({ ...settings, adDistributionMode: 'custom_quota' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              settings.adDistributionMode === 'custom_quota'
                ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="font-bold text-xs flex items-center justify-between mb-1">
              <span>কাস্টম নেটওয়ার্ক কোটা</span>
              {settings.adDistributionMode === 'custom_quota' && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
            </div>
            <p className="text-[11px] leading-relaxed opacity-80">
              প্রতিটি নেটওয়ার্ক থেকে কয়টি করে বিজ্ঞাপন দেখতে হবে তা কার্ডের নিচে আলাদাভাবে নির্দিষ্ট করুন।
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSettings({ ...settings, adDistributionMode: 'auto_rotation' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              settings.adDistributionMode === 'auto_rotation'
                ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="font-bold text-xs flex items-center justify-between mb-1">
              <span>অটো রাউন্ড-রবিন রোটেশন</span>
              {settings.adDistributionMode === 'auto_rotation' && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
            </div>
            <p className="text-[11px] leading-relaxed opacity-80">
              সক্রিয় ৪টি নেটওয়ার্কের মধ্যে চক্রাকারে প্রতিটি বিজ্ঞাপনে স্বয়ংক্রিয় রোটেশন বজায় থাকবে।
            </p>
          </button>
        </div>

        {/* When Single Network Mode is active, show the dropdowns */}
        {settings.adDistributionMode === 'single_network' && (
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in text-xs">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                প্রধান বিজ্ঞাপন নেটওয়ার্ক নির্বাচন করুন (Primary Ad Network)
              </label>
              <select
                value={settings.singleNetworkProvider}
                onChange={(e) => setSettings({ ...settings, singleNetworkProvider: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold text-xs"
              >
                <option value="Monetag">Monetag (গ্লোবাল হাই-সিপিএম ও ডাইরেক্ট লিঙ্ক)</option>
                <option value="Bengal Ads">Bengal Ads (বাংলাদেশ লোকাল স্মার্টলিঙ্ক)</option>
                <option value="GigaPub">GigaPub (পাবলিশার ডাইরেক্ট অফার লিঙ্ক)</option>
                <option value="AdsGram">AdsGram (টেলিগ্রাম মিনি-অ্যাপ ও অফিশিয়াল SDK)</option>
              </select>
              <span className="text-[10px] text-purple-500 mt-1 block">
                ইউজার যতগুলো বিজ্ঞাপন দেখবে, তার সবগুলোই এই ১টি নির্বাচিত নেটওয়ার্ক থেকেই আসবে।
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                ভিডিও আনলকে কয়টি বিজ্ঞাপন দেখতে হবে? (Required Ads Count)
              </label>
              <select
                value={settings.singleNetworkAdCount}
                onChange={(e) => setSettings({ ...settings, singleNetworkAdCount: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold text-xs"
              >
                <option value={1}>১টি বিজ্ঞাপন (1 Ad Required)</option>
                <option value={2}>২টি বিজ্ঞাপন (2 Ads Required)</option>
                <option value={3}>৩টি বিজ্ঞাপন (3 Ads Required)</option>
                <option value={4}>৪টি বিজ্ঞাপন (All 4 Ads Required)</option>
                <option value={5}>৫টি বিজ্ঞাপন (5 Ads Required)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                ইউজারকে ভিডিওর সম্পূর্ণ অংশ বা ডাউনলোড লিঙ্ক পেতে এই পরিমাণ বিজ্ঞাপন সম্পন্ন করতে হবে।
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid of networks */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
          <span>নেটওয়ার্ক ডেটা লোড হচ্ছে...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {networks.map((net, index) => {
            const cfg = net.config || {};
            return (
              <div
                key={net.id}
                className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between gap-5 transition-all ${
                  net.enabled
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ring-1 ring-purple-500/10'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/40 opacity-70'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1 items-center">
                        <button
                          onClick={() => movePriority(index, 'up')}
                          disabled={index === 0}
                          title="প্রায়োরিটি উপরে তুলুন"
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <span className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                          #{net.priority}
                        </span>
                        <button
                          onClick={() => movePriority(index, 'down')}
                          disabled={index === networks.length - 1}
                          title="প্রায়োরিটি নিচে নামান"
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {net.name}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getNetworkBadgeColor(net.name)}`}>
                            {net.name === 'Monetag' ? 'Global High-CPM' : net.name === 'Bengal Ads' ? 'Bangladesh Local' : net.name === 'AdsGram' ? 'Telegram & Web' : 'Publisher Link'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {net.placement}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className={`text-xs font-semibold ${net.enabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {net.enabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                        <input
                          type="checkbox"
                          checked={net.enabled}
                          onChange={(e) => {
                            updateNetworkField(net.id, { enabled: e.target.checked });
                          }}
                          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-3.5 text-xs">
                    {/* Format Selector */}
                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        বিজ্ঞাপনের ফরম্যাট (Ad Format)
                      </label>
                      <select
                        value={cfg.adFormat || 'direct_link'}
                        onChange={(e) => updateNetworkConfig(net.id, { adFormat: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-medium"
                      >
                        <option value="direct_link">🔗 Direct Link / SmartLink (ডাইরেক্ট লিঙ্ক - সবচেয়ে লাভজনক)</option>
                        <option value="script">⚡ Official SDK / Loader Script (স্ক্রিপ্ট ট্যাগ)</option>
                        <option value="adsgram_sdk">💎 AdsGram Block SDK (টেলিগ্রাম ও ওয়েব ব্লক)</option>
                        <option value="custom_code">💻 Custom HTML / Banner Tag (কাস্টম কোড)</option>
                      </select>
                    </div>

                    {/* Direct Link URL Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-600 dark:text-slate-300 font-semibold">
                          Direct Link / SmartLink URL
                        </label>
                        {cfg.directUrl && (
                          <a
                            href={cfg.directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-500 hover:text-purple-400 flex items-center gap-1 text-[11px]"
                          >
                            <span>লিঙ্ক চেক করুন</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        value={cfg.directUrl || ''}
                        onChange={(e) => updateNetworkConfig(net.id, { directUrl: e.target.value })}
                        placeholder={
                          net.name === 'Monetag'
                            ? 'https://whomee.top/4/7829104'
                            : net.name === 'Bengal Ads'
                            ? 'https://bengalads.net/smartlink?zone=884'
                            : net.name === 'GigaPub'
                            ? 'https://gigapub.com/r/gp_49012'
                            : 'https://t.me/AdsgramBot?start=reward'
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500 font-mono text-[11px]"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        ইউজার &ldquo;বিজ্ঞাপন দেখুন&rdquo; বাটনে চাপলে নতুন ট্যাবে এই লিঙ্কটি ওপেন হবে।
                      </span>
                    </div>

                    {/* Zone ID / Block ID Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                          {net.name === 'AdsGram' ? 'Block ID' : 'Zone ID / Unit ID'}
                        </label>
                        <input
                          type="text"
                          value={net.name === 'AdsGram' ? cfg.blockId || '' : cfg.zoneId || ''}
                          onChange={(e) => {
                            if (net.name === 'AdsGram') {
                              updateNetworkConfig(net.id, { blockId: e.target.value });
                            } else {
                              updateNetworkConfig(net.id, { zoneId: e.target.value });
                            }
                          }}
                          placeholder={net.name === 'AdsGram' ? '4821' : '11699704'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-xs font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                            বিজ্ঞাপন কোটা (Ads)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={cfg.adCount || 1}
                            onChange={(e) =>
                              updateNetworkConfig(net.id, {
                                adCount: parseInt(e.target.value, 10) || 1,
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                            সময় (Sec)
                          </label>
                          <input
                            type="number"
                            min={3}
                            max={30}
                            value={cfg.countdownSeconds || 5}
                            onChange={(e) =>
                              updateNetworkConfig(net.id, {
                                countdownSeconds: parseInt(e.target.value, 10) || 5,
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Script URL or Custom Code if applicable */}
                    {(cfg.adFormat === 'script' || cfg.adFormat === 'adsgram_sdk' || cfg.scriptUrl) && (
                      <div>
                        <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                          SDK Script URL
                        </label>
                        <input
                          type="text"
                          value={cfg.scriptUrl || ''}
                          onChange={(e) => updateNetworkConfig(net.id, { scriptUrl: e.target.value })}
                          placeholder="//libtl.com/sdk.js বা https://sad.adsgram.ai/js/sad.min.js"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono text-[11px]"
                        />
                      </div>
                    )}

                    {cfg.adFormat === 'custom_code' && (
                      <div>
                        <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                          কাস্টম বিজ্ঞাপন কোড (HTML / JS Embed Tag)
                        </label>
                        <textarea
                          rows={2}
                          value={cfg.customCode || ''}
                          onChange={(e) => updateNetworkConfig(net.id, { customCode: e.target.value })}
                          placeholder="<script>...</script> বা <iframe...>"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono text-[11px]"
                        />
                      </div>
                    )}

                    {/* Toggles */}
                    <div className="pt-1 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cfg.openInNewTab !== false}
                          onChange={(e) => updateNetworkConfig(net.id, { openInNewTab: e.target.checked })}
                          className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                        />
                        <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                          ক্লিক করলে নতুন ট্যাবে ডাইরেক্ট লিঙ্ক ওপেন হবে
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => startTestAd(net)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
                    <span>টেস্ট অ্যাড দেখুন</span>
                  </button>

                  <button
                    onClick={() => handleUpdate(net)}
                    disabled={savingId === net.id}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingId === net.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>সংরক্ষণ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIVE TEST AD MODAL */}
      {testModal.isOpen && testModal.network && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-purple-500/60 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${getNetworkBadgeColor(testModal.network.name)}`}>
                  {testModal.network.name}
                </span>
                <span className="text-[11px] text-slate-400">লাইভ ভেরিফিকেশন টেস্ট</span>
              </div>
              <button
                onClick={() => setTestModal({ ...testModal, isOpen: false })}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-center">
              <div className="bg-slate-950 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="text-xs text-slate-300">
                  {testModal.openedTab ? (
                    <span className="text-emerald-400 font-semibold block">
                      ✔ বিজ্ঞাপনটি নতুন ট্যাবে সফলভাবে ওপেন হয়েছে!
                    </span>
                  ) : testModal.network.config?.directUrl ? (
                    <div className="space-y-2">
                      <span className="text-amber-400 block">
                        ⚠️ ব্রাউজারে পপ-আপ ব্লক থাকলে নিচের বোতামে ক্লিক করে টেস্ট করুন:
                      </span>
                      <a
                        href={testModal.network.config.directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs"
                      >
                        <span>বিজ্ঞাপন লিঙ্ক খুলুন</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span>অফিশিয়াল স্ক্রিপ্ট / এডসগ্রাম ব্লক টেস্ট চলছে...</span>
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  Zone / Block ID: <strong>{testModal.network.config?.zoneId || testModal.network.config?.blockId || 'Standard'}</strong>
                </div>

                <div className="py-2">
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                      style={{
                        width: `${(((testModal.network.config?.countdownSeconds || 5) - testModal.countdown) / (testModal.network.config?.countdownSeconds || 5)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  {testModal.countdown > 0 ? (
                    <span className="text-pink-400 font-bold text-xs animate-pulse">
                      ⏳ বিজ্ঞাপন শেষ হতে বাকি: {testModal.countdown} সেকেন্ড...
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-extrabold text-xs flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      বিজ্ঞাপন দেখা সফলভাবে সম্পন্ন হয়েছে!
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                এই বিজ্ঞাপনটি ব্লগারে এবং ফ্রন্টএন্ডে ঠিক একইভাবে কাজ করবে।
              </div>

              <button
                onClick={() => setTestModal({ ...testModal, isOpen: false })}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-purple-600/30"
              >
                টেস্ট সম্পন্ন ও বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
