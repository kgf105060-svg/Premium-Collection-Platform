import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Check,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Download,
  Upload,
  FileJson,
  Copy,
  AlertCircle,
  FileText,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Database,
  Sliders,
  Send,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { SystemSettings } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface SystemSettingsViewProps {
  token: string;
}

interface ExportedBundle {
  version: string;
  exportedAt: string;
  appName: string;
  type: string;
  settings: SystemSettings;
  adNetworks?: any[];
  categories?: any[];
  bannerAds?: any[];
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ token }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'প্রিমিয়াম কালেকশন',
    siteSubtitle: 'Premium Collection Platform',
    botUsername: '@Advisit_bot',
    botToken: '8329711123:AAG2pVo9OXB8AZYmWEzpAomKTB9sfkoGmUE',
    botStatus: 'online',
    webhookStatus: 'active',
    telegramChannelUrl: 'https://t.me/Advisit_bot',
    telegramMiniAppUrl: 'https://t.me/Advisit_bot/app',
    contactEmail: 'kgf105060@gmail.com',
    defaultRequiredAds: 3,
    primaryAdProvider: 'Monetag',
    adRotationEnabled: true,
    maintenanceMode: false,
    adDistributionMode: 'single_network',
    singleNetworkProvider: 'Monetag',
    singleNetworkAdCount: 4,
    bunnyLibraryId: '780246',
    bunnyCdnHostname: 'vz-52277185-b48.b-cdn.net',
    bunnyPullZone: 'vz-52277185-b48',
    bunnyApiKey: '4053222b-1979-4467-b29343c450e0-581b-425c',
    bunnyReadonlyKey: 'b321b3cb-3216-42a8-8f6612a325d6-6dcb-4305',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bunny Stream state
  const [testingBunny, setTestingBunny] = useState<boolean>(false);
  const [bunnyTestResult, setBunnyTestResult] = useState<{ success: boolean; message: string; videoCount?: number } | null>(null);
  const [showBunnyKey, setShowBunnyKey] = useState<boolean>(false);

  const handleTestBunnyConnection = async () => {
    setTestingBunny(true);
    setBunnyTestResult(null);
    try {
      const data = await safeFetchJson<any>('/api/bunny/test-connection', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setBunnyTestResult({
          success: true,
          message: data.message || `সফল! Bunny Stream CDN লাইব্রেরি #${data.libraryId} সক্রিয় (ভিডিও: ${data.videoCount})`,
          videoCount: data.videoCount,
        });
      } else {
        setBunnyTestResult({
          success: false,
          message: data.error || 'Bunny API সংযোগ ব্যর্থ হয়েছে',
        });
      }
    } catch (err: any) {
      setBunnyTestResult({
        success: false,
        message: err.message || 'নেটওয়ার্ক সংযোগ সমস্যা',
      });
    } finally {
      setTestingBunny(false);
    }
  };

  // Migration & Export / Import State
  const [includeExtrasInExport, setIncludeExtrasInExport] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);
  const [showExportPreview, setShowExportPreview] = useState<boolean>(false);
  const [exportPreviewData, setExportPreviewData] = useState<string>('');

  // Import State
  const [importing, setImporting] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'file' | 'text'>('file');
  const [pastedJson, setPastedJson] = useState<string>('');
  const [stagedImportData, setStagedImportData] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessSummary, setImportSuccessSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    safeFetchJson<any>('/api/settings')
      .then((data) => {
        setSettings((prev) => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('সেটিংস সেভ করতে সমস্যা হয়েছে');

      setMsg({ type: 'success', text: 'সিস্টেম সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'সেটিংস সংরক্ষণে ব্যর্থ হয়েছে' });
    } finally {
      setSaving(false);
    }
  };

  // Export current configuration as JSON file
  const handleExportJson = async (downloadDirectly: boolean = true) => {
    setExporting(true);
    try {
      const data = await safeFetchJson<ExportedBundle>(`/api/settings/export?includeExtras=${includeExtrasInExport}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const jsonString = JSON.stringify(data, null, 2);

      if (downloadDirectly) {
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `system-configuration-${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setMsg({
          type: 'success',
          text: 'সিস্টেম কনফিগারেশন JSON ফাইল সফলভাবে ডাউনলোড হয়েছে!',
        });
        setTimeout(() => setMsg(null), 4000);
      } else {
        setExportPreviewData(jsonString);
        setShowExportPreview(true);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'এক্সপোর্ট ব্যর্থ হয়েছে' });
    } finally {
      setExporting(false);
    }
  };

  // Copy JSON to clipboard
  const handleCopyExportJson = async () => {
    setExporting(true);
    try {
      const data = await safeFetchJson<any>(`/api/settings/export?includeExtras=${includeExtrasInExport}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 3000);
      setMsg({ type: 'success', text: 'কনফিগারেশন JSON ক্লিপবোর্ডে কপি করা হয়েছে!' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'কপিতে সমস্যা হয়েছে' });
    } finally {
      setExporting(false);
    }
  };

  // Inspect and validate parsed JSON
  const validateAndStageJson = (rawContent: string) => {
    setImportError(null);
    setImportSuccessSummary(null);

    try {
      const parsed = JSON.parse(rawContent);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('অবৈধ JSON ডাটা ফরম্যাট');
      }

      // Check if it has a settings property or if it's direct SystemSettings
      const candidate = parsed.settings || (parsed.siteName ? parsed : null);
      if (!candidate || typeof candidate !== 'object') {
        throw new Error('ফাইলের মধ্যে কোনো সিস্টেম সেটিংস (siteName, primaryAdProvider ইত্যাদি) খুঁজে পাওয়া যায়নি');
      }

      setStagedImportData(parsed);
    } catch (err: any) {
      setStagedImportData(null);
      setImportError(err.message || 'JSON পার্সিং এরর: ফাইল বা কোডের গঠন সঠিক নয়');
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setImportError('অনুগ্রহ করে একটি বৈধ .json ফাইল নির্বাচন করুন');
      setStagedImportData(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      validateAndStageJson(content);
    };
    reader.onerror = () => {
      setImportError('ফাইল পড়তে ব্যর্থ হয়েছে');
    };
    reader.readAsText(file);
  };

  // Handle paste change
  const handlePasteChange = (val: string) => {
    setPastedJson(val);
    if (!val.trim()) {
      setStagedImportData(null);
      setImportError(null);
      return;
    }
    validateAndStageJson(val);
  };

  // Confirm and apply import
  const handleExecuteImport = async () => {
    if (!stagedImportData) return;
    setImporting(true);
    setImportError(null);

    try {
      const result = await safeFetchJson<any>('/api/settings/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(stagedImportData),
      });

      // Update local state immediately with imported settings
      if (result.settings) {
        setSettings((prev) => ({ ...prev, ...result.settings }));
      }

      const summaryText = result.summary
        ? `সিস্টেম সেটিংস সফলভাবে প্রয়োগ হয়েছে (আপডেট: অ্যাড নেটওয়ার্ক ${result.summary.adNetworksUpdated || 0}টি, ব্যানার ${result.summary.bannersUpdated || 0}টি)`
        : 'সিস্টেম কনফিগারেশন সফলভাবে ইমপোর্ট ও সংরক্ষিত হয়েছে!';

      setImportSuccessSummary(summaryText);
      setMsg({ type: 'success', text: summaryText });
      setStagedImportData(null);
      setPastedJson('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportError(err.message || 'ইমপোর্ট প্রক্রিয়াকরণে সমস্যা হয়েছে');
    } finally {
      setImporting(false);
    }
  };

  const handleCancelImport = () => {
    setStagedImportData(null);
    setImportError(null);
    setPastedJson('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-purple-500" />
        <span>সিস্টেম সেটিংস লোড হচ্ছে...</span>
      </div>
    );
  }

  const stagedSettings = stagedImportData
    ? stagedImportData.settings || stagedImportData
    : null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>সিস্টেম ও গ্লোবাল সেটিংস (System Settings)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            সাইটের ব্র্যান্ডিং, বিজ্ঞাপন আনলক রুলস, টেলিগ্রাম ইন্টিগ্রেশন এবং ব্যাকআপ/মাইগ্রেশন কনফিগার করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExportJson(true)}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
            title="বর্তমান কনফিগারেশন JSON হিসেবে ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5" />
            <span>এক্সপোর্ট JSON</span>
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {msg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DATA MIGRATION SECTION: EXPORT & IMPORT CONFIGURATION AS JSON */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-purple-50/70 via-white to-pink-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/30 rounded-2xl p-5 border border-purple-200/80 dark:border-purple-900/50 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>ডাটা মাইগ্রেশন ও ব্যাকআপ (Export & Import JSON)</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  New Feature
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                এক ইনস্ট্যান্স থেকে অন্য ইনস্ট্যান্সে সহজে সিস্টেম সেটিংস স্থানান্তর ও রিস্টোর করার সুবিধা।
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          {/* EXPORT CARD */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  কনফিগারেশন এক্সপোর্ট (Export JSON)
                </span>
                <span className="text-[10px] font-medium text-slate-400">JSON Format</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                বর্তমান সাইট নাম, আনলক রুলস, টেলিগ্রাম সেটিংস এবং অ্যাড নেটওয়ার্ক কনফিগারেশন একটি পূর্ণাঙ্গ JSON ফাইলে ডাউনলোড করে সংরক্ষণ করুন।
              </p>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={includeExtrasInExport}
                    onChange={(e) => setIncludeExtrasInExport(e.target.checked)}
                    className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                  />
                  <span>পূর্ণ সিস্টেম কনফিগারেশন (অ্যাড নেটওয়ার্ক, ব্যানার ও ক্যাটাগরি সহ)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportJson(true)}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exporting ? 'প্রসেসিং...' : 'JSON ফাইল ডাউনলোড করুন'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyExportJson}
                  disabled={exporting}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                  title="ক্লিপবোর্ডে কপি করুন"
                >
                  {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedExport ? 'কপি হয়েছে' : 'কপি JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportJson(false)}
                  disabled={exporting}
                  className="flex items-center justify-center px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs transition cursor-pointer"
                  title="এক্সপোর্ট প্রিভিউ দেখুন"
                >
                  {showExportPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Collapsible Export Preview */}
              {showExportPreview && exportPreviewData && (
                <div className="mt-3 p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-[10px] max-h-48 overflow-auto border border-slate-700">
                  <div className="flex justify-between items-center text-slate-400 mb-1 border-b border-slate-800 pb-1">
                    <span>Export Preview ({exportPreviewData.length} chars)</span>
                    <button
                      type="button"
                      onClick={() => setShowExportPreview(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <pre>{exportPreviewData}</pre>
                </div>
              )}
            </div>
          </div>

          {/* IMPORT CARD */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  কনফিগারেশন ইমপোর্ট (Import JSON)
                </span>
                <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-700 p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setImportMode('file')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      importMode === 'file'
                        ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    ফাইল
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('text')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      importMode === 'text'
                        ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    কোড পেস্ট
                  </button>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                অন্য কোনো ইনস্ট্যান্স থেকে এক্সপোর্ট করা JSON ফাইল আপলোড করুন অথবা সরাসরি টেক্সট কোড পেস্ট করে সেটিংস সহজে প্রয়োগ করুন।
              </p>

              {importMode === 'file' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="settings-file-input"
                  />
                  <label
                    htmlFor="settings-file-input"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-200 dark:border-purple-900/60 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer transition text-center group"
                  >
                    <FileJson className="w-7 h-7 text-purple-500 dark:text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      JSON ফাইল সিলেক্ট করুন বা ড্রপ করুন
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">.json ফাইল ফরম্যাট সমর্থিত</span>
                  </label>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={3}
                    value={pastedJson}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    placeholder="এখানে সিস্টেম কনফিগারেশন JSON পেস্ট করুন..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-[11px] outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Error in Import */}
            {importError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Success in Import */}
            {importSuccessSummary && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importSuccessSummary}</span>
              </div>
            )}

            {/* Staged Import Inspection / Confirmation Card */}
            {stagedSettings && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
                  <span className="font-bold text-purple-700 dark:text-purple-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    ইমপোর্ট প্রিভিউ প্রস্তুত
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {stagedImportData.exportedAt
                      ? new Date(stagedImportData.exportedAt).toLocaleDateString()
                      : 'Custom Config'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">সাইটের নাম:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {stagedSettings.siteName || 'অনির্ধারিত'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">বিজ্ঞাপন নিয়ম:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {stagedSettings.primaryAdProvider || 'Monetag'} ({stagedSettings.defaultRequiredAds ?? 3} ads)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">টেলিগ্রাম চ্যানেল:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {stagedSettings.telegramChannelUrl || 'অনির্ধারিত'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">অন্তর্ভুক্ত ডাটা:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {stagedImportData.adNetworks
                        ? `${stagedImportData.adNetworks.length}টি নেটওয়ার্ক`
                        : 'সেটিংস শুধুমাত্র'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 border-t border-purple-500/20">
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={importing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {importing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    <span>{importing ? 'ইমপোর্ট হচ্ছে...' : 'ইমপোর্ট সম্পন্ন করুন'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelImport}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs transition cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SYSTEM CONFIGURATION FORM */}
      {/* ========================================================================= */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* General Branding */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-500" />
            <span>সাইট ব্র্যান্ডিং (General Branding)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ওয়েবসাইটের নাম (Site Name)
              </label>
              <input
                type="text"
                required
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                উপ-শিরোনাম (Site Subtitle)
              </label>
              <input
                type="text"
                value={settings.siteSubtitle}
                onChange={(e) => setSettings({ ...settings, siteSubtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                যোগাযোগের ইমেল (Contact Email)
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                বট ইউজারনেম (Bot Username)
              </label>
              <input
                type="text"
                value={settings.botUsername}
                onChange={(e) => setSettings({ ...settings, botUsername: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="@YourBot"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                টেলিগ্রাম চ্যানেল লিঙ্ক (Telegram Channel URL)
              </label>
              <input
                type="url"
                value={settings.telegramChannelUrl}
                onChange={(e) => setSettings({ ...settings, telegramChannelUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                টেলিগ্রাম মিনি অ্যাপ URL (Telegram Mini App URL)
              </label>
              <input
                type="url"
                value={settings.telegramMiniAppUrl || ''}
                onChange={(e) => setSettings({ ...settings, telegramMiniAppUrl: e.target.value })}
                placeholder="https://t.me/YourBot/app"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Ad Defaults & Overrides */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>আনলক ও বিজ্ঞাপন নিয়মাবলী (Unlock & Ad Distribution Rules)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                বিজ্ঞাপন ডিস্ট্রিবিউশন মোড (Ad Distribution Mode)
              </label>
              <select
                value={settings.adDistributionMode || 'single_network'}
                onChange={(e) => setSettings({ ...settings, adDistributionMode: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="single_network">নির্দিষ্ট একক নেটওয়ার্ক মোড (Single Network Mode)</option>
                <option value="auto_rotation">স্বয়ংক্রিয় রাউন্ড-রবিন রোটেশন (Auto Rotation)</option>
                <option value="custom_quota">কাস্টম কোটা বন্টন (Custom Quota)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                একক নেটওয়ার্ক মোডে ব্যবহারকারী কেবল নির্বাচিত নেটওয়ার্ক থেকেই অ্যাড দেখবে।
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                একক নেটওয়ার্কের অ্যাড সংখ্যা (Single Network Ad Count)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.singleNetworkAdCount ?? 4}
                onChange={(e) =>
                  setSettings({ ...settings, singleNetworkAdCount: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                ভিডিও আনলক করতে ব্যবহারকারীকে কতটি বিজ্ঞাপন সফলভাবে দেখতে হবে।
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                একক নেটওয়ার্ক প্রোভাইডার (Single Network Provider)
              </label>
              <select
                value={settings.singleNetworkProvider || 'Monetag'}
                onChange={(e) => setSettings({ ...settings, singleNetworkProvider: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="Monetag">Monetag (হাই পেআউট ডিরেক্ট লিংক)</option>
                <option value="Bengal Ads">Bengal Ads (বাংলাদেশি লোকাল অডিয়েন্স)</option>
                <option value="GigaPub">GigaPub (গ্লোবাল পাবলিশার নেটওয়ার্ক)</option>
                <option value="AdsGram">AdsGram (অফিসিয়াল টেলিগ্রাম মিনি অ্যাপ SDK)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                গ্লোবাল ডিফল্ট আবশ্যকীয় বিজ্ঞাপন (Global Required Ads)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={settings.defaultRequiredAds}
                onChange={(e) => setSettings({ ...settings, defaultRequiredAds: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                যেসব ভিডিওতে আলাদা অ্যাড সংখ্যা নির্দিষ্ট করা নেই সেগুলোতে এই সংখ্যা কার্যকর হবে।
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rotationToggle"
                checked={settings.adRotationEnabled}
                onChange={(e) => setSettings({ ...settings, adRotationEnabled: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
              <label htmlFor="rotationToggle" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                স্বয়ংক্রিয় অ্যাড রোটেশন ও ফলব্যাক সক্রিয় রাখুন (Auto Fallback Rotation)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="maintenanceToggle"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
              <label
                htmlFor="maintenanceToggle"
                className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                রক্ষণাবেক্ষণ মোড সক্রিয় (Maintenance Mode)
              </label>
            </div>
          </div>
        </div>

        {/* Bunny Stream CDN Configuration Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-base">🐰</span>
              <span>Bunny Stream CDN কনফিগারেশন (Video Library &amp; Pull Zone)</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestBunnyConnection}
                disabled={testingBunny}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-500/30 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingBunny ? 'animate-spin' : ''}`} />
                <span>{testingBunny ? 'যাচাই হচ্ছে...' : 'টেস্ট কানেকশন (Test Connection)'}</span>
              </button>
              <a
                href={`https://dash.bunny.net/stream/libraries/${settings.bunnyLibraryId || '780246'}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition"
                title="Bunny.net কনসোল খুলুন"
              >
                <span>কনসোল</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {bunnyTestResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                bunnyTestResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {bunnyTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{bunnyTestResult.message}</span>
              </div>
              <button type="button" onClick={() => setBunnyTestResult(null)} className="opacity-60 hover:opacity-100">✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ভিডিও লাইব্রেরি আইডি (Video Library ID)
              </label>
              <input
                type="text"
                value={settings.bunnyLibraryId || '780246'}
                onChange={(e) => setSettings({ ...settings, bunnyLibraryId: e.target.value })}
                placeholder="780246"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                সিডিএন হোস্টনেম (CDN Hostname)
              </label>
              <input
                type="text"
                value={settings.bunnyCdnHostname || 'vz-52277185-b48.b-cdn.net'}
                onChange={(e) => setSettings({ ...settings, bunnyCdnHostname: e.target.value })}
                placeholder="vz-52277185-b48.b-cdn.net"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                পুল জোন (Pull Zone)
              </label>
              <input
                type="text"
                value={settings.bunnyPullZone || 'vz-52277185-b48'}
                onChange={(e) => setSettings({ ...settings, bunnyPullZone: e.target.value })}
                placeholder="vz-52277185-b48"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Bunny Stream API Key (Full Access / Uploads)
                </label>
                <button
                  type="button"
                  onClick={() => setShowBunnyKey(!showBunnyKey)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showBunnyKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showBunnyKey ? 'লুকান' : 'দেখান'}</span>
                </button>
              </div>
              <input
                type={showBunnyKey ? 'text' : 'password'}
                value={settings.bunnyApiKey || '4053222b-1979-4467-b29343c450e0-581b-425c'}
                onChange={(e) => setSettings({ ...settings, bunnyApiKey: e.target.value })}
                placeholder="4053222b-1979-4467-b29343c450e0-581b-425c"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Read-only API Key
              </label>
              <input
                type={showBunnyKey ? 'text' : 'password'}
                value={settings.bunnyReadonlyKey || 'b321b3cb-3216-42a8-8f6612a325d6-6dcb-4305'}
                onChange={(e) => setSettings({ ...settings, bunnyReadonlyKey: e.target.value })}
                placeholder="b321b3cb-3216-42a8-8f6612a325d6-6dcb-4305"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">📌 Bunny Stream স্টোরেজ নির্দেশিকা:</span>
            <p>
              মিডিয়া গ্যালারি থেকে যেকোনো নতুন ভিডিও ফাইল আপলোড করা হলে তা স্বয়ংক্রিয়ভাবে সরাসরি আপনার Bunny Stream লাইব্রেরি <strong>#{settings.bunnyLibraryId || '780246'}</strong> তে ট্রান্সকোড হয়ে সংরক্ষিত হবে। ব্লগার থিম এবং অ্যাপ উভয় স্থানেই এটি বাফারিং ছাড়া আল্ট্রা-ফাস্ট স্ট্রিমিং ও রেজোলিউশন সুইচিং প্রদান করে।
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-md shadow-pink-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{saving ? 'সংরক্ষণ করা হচ্ছে...' : 'সেটিংস সেভ করুন (Save Settings)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
