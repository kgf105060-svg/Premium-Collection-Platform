import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, FileCode, ExternalLink, HelpCircle, Layers, ShieldCheck, Sparkles, Smartphone, ArrowLeft } from 'lucide-react';

interface BloggerThemeHubProps {
  onBackToApp?: () => void;
}

export const BloggerThemeHub: React.FC<BloggerThemeHubProps> = ({ onBackToApp }) => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'code' | 'snippet'>('guide');
  const [backendApiUrl, setBackendApiUrl] = useState<string>(typeof window !== 'undefined' ? window.location.origin : '');

  const loadXml = (urlToUse: string) => {
    setLoading(true);
    fetch(`/api/theme/xml?apiUrl=${encodeURIComponent(urlToUse)}`)
      .then((res) => res.text())
      .then((data) => {
        setXmlContent(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch XML:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadXml(backendApiUrl);
  }, []);

  const handleCopy = () => {
    if (!xmlContent) return;
    navigator.clipboard.writeText(xmlContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const samplePostSnippet = `<!-- নমুনা ভিডিও পোস্ট কোড: YouTube 16:9 Play Box (Blogger Post Editor -> HTML View তে পেস্ট করুন) -->
<section class="video-part-card youtube-16-9-box" data-part="1" id="videoPart1Container">
  <div class="video-part-header">
    <div class="part-header-left">
      <span>▶ ভিডিও ১ (YouTube 16:9)</span>
    </div>
    <span class="part-header-right">16:9 Aspect Ratio</span>
  </div>

  <div class="player-responsive-container" style="position: relative; width: 100%; padding-top: 56.25%; aspect-ratio: 16 / 9; background: #000; overflow: hidden;">
    <!-- এখানে আপনার ইউটিউব অথবা সরাসরি ভিডিও লিঙ্ক দিন (YouTube Size 16:9 Play Box) -->
    <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="true" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></iframe>
  </div>
</section>

<!-- পোস্টের বিবরণ -->
<p>এখানে ভিডিওটির সম্পূর্ণ বিবরণ ও সারসংক্ষেপ লিখুন...</p>`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {onBackToApp && (
        <div className="mb-4">
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← মূল ভিডিও অ্যাপে ফিরে যান (Back to Video App)</span>
          </button>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-purple-900/40 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              100% Valid Blogger XML &bull; Production Ready
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              প্রিমিয়াম কালেকশন ব্লুগার থিম (Blogger XML Theme)
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
              ভিডিও কালেকশন ওয়েবসাইটের জন্য সম্পূর্ণ আধুনিক ও রেসপনসিভ ব্লুগার থিম। কোনো এক্সটারনাল সিএসএস/জেএস ফ্রেমওয়ার্ক নির্ভরতা ছাড়া পিওর ভ্যানিলা জেএস ও আধুনিক ইউআই।
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`/api/theme/download?apiUrl=${encodeURIComponent(backendApiUrl)}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                download
              >
                <Download className="w-4 h-4" />
                <span>Download XML (.xml)</span>
              </a>

              <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied XML!' : 'Copy XML'}</span>
              </button>
            </div>

            {/* Backend API URL Configurator */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-400 whitespace-nowrap">API URL:</span>
              <input
                type="text"
                value={backendApiUrl}
                onChange={(e) => {
                  setBackendApiUrl(e.target.value);
                  loadXml(e.target.value);
                }}
                placeholder="https://your-api-domain.com"
                className="bg-transparent text-purple-200 font-mono text-[11px] outline-none w-full max-w-[280px]"
                title="Your deployed backend API URL for ad unlocks and analytics"
              />
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span>Mobile-First (0-650px)</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Server-Side Ad Unlock</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Multi-Part Video Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <span>Dark / Light Mode Toggle</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'guide'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>ইনস্টলেশন ও ব্যবহার নির্দেশিকা (Setup Guide)</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'code'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>সম্পূর্ণ XML কোড (Raw XML Viewer)</span>
        </button>

        <button
          onClick={() => setActiveTab('snippet')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'snippet'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ভিডিও পোস্ট টেমপ্লেট (Post Template)</span>
        </button>
      </div>

      {/* TAB 1: GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 font-bold flex items-center justify-center text-lg mb-4">
                ১
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                থিম ডাউনলোড করুন
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                উপরে থাকা <strong>&ldquo;Download XML (.xml)&rdquo;</strong> বাটনে ক্লিক করে ফাইলটি আপনার ডিভাইসে সেভ করুন।
              </p>
              <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg text-slate-500 font-mono">
                ফাইল নেম: premium-collection-blogger-theme.xml
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300 font-bold flex items-center justify-center text-lg mb-4">
                ২
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                ব্লগারে আপলোড করুন
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                ব্লগার ড্যাশবোর্ডে গিয়ে <strong>Theme</strong> অপশনে ক্লিক করুন। তারপর <strong>Customize</strong> এর পাশের ড্রপডাউন মেনু থেকে <strong>Restore</strong> &rarr; <strong>Upload</strong> নির্বাচন করুন।
              </p>
              <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg text-slate-500 font-mono">
                Blogger &rarr; Theme &rarr; Restore &rarr; Upload
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 font-bold flex items-center justify-center text-lg mb-4">
                ৩
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                কনফিগারেশন কাস্টমাইজ
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                থিমের ভেতরের স্ক্রিপ্ট অংশে আপনার টেলিগ্রাম চ্যানেল লিঙ্ক ও যোগাযোগ ইমেল সহজে পরিবর্তন করতে পারেন।
              </p>
              <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg text-slate-500 font-mono">
                CONFIG.telegramUrl = &ldquo;https://t.me/...&rdquo;
              </div>
            </div>
          </div>

          {/* 4 Supported Ad Networks Live Status */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>ইন্টিগ্রেটেড ৪টি বিজ্ঞাপন নেটওয়ার্ক (Integrated Ad Networks)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                এই থিমটিতে নিচের ৪টি নেটওয়ার্ক স্বয়ংক্রিয় রোটেশন ও ডাইরেক্ট লিঙ্ক সাপোর্ট সহ শতভাগ সক্রিয় অবস্থায় এমবেড করা রয়েছে:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">🇧🇩 Bengal Ads</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold">Active</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  বাংলাদেশি হাই-সিপিএম স্মার্টলিঙ্ক ও পুরস্কৃত ভিডিও সাপোর্ট।
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400">⚡ Monetag</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">Active</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  গ্লোবাল ডাইরেক্ট লিঙ্ক ও ইন্টারস্টিশিয়াল অটো-পপআপ সাপোর্ট।
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-teal-500/30 bg-teal-500/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-teal-600 dark:text-teal-400">🌐 GigaPub</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-600 text-white font-bold">Active</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  হাই ফিল-রেট অফার লিঙ্ক ও নেটিভ অ্যাড সাপোর্ট।
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-sky-600 dark:text-sky-400">💎 AdsGram</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500 text-white font-bold">Active</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  অফিসিয়াল AdsGram SDK ও টেলিগ্রাম ব্লক সাপোর্ট।
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              💡 <strong>টিপস:</strong> আপনি যদি ব্লগারে কোনো এক্সটার্নাল ব্যাকএন্ড সার্ভার ছাড়াই থিম চালান (Standalone Mode), বিজ্ঞাপনগুলো স্বয়ংক্রিয়ভাবে ব্রাউজারের ভেতর কাজ করবে। আর আপনি যদি আপনার API URL যুক্ত করেন, তাহলে অ্যান্টি-চিট ভেরিফিকেশন ও রিয়েল-টাইম এনালিটিক্স সক্রিয় হবে।
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
              কীভাবে ভিডিও পোস্ট তৈরি করবেন?
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li>ব্লগারের <strong>New Post</strong> এ যান।</li>
              <li>পোস্ট এডিটরের বামপাশের পেন্সিল আইকনে ক্লিক করে <strong>HTML View</strong> সিলেক্ট করুন।</li>
              <li>আমাদের দেওয়া টেমপ্লেট কোডটি পেস্ট করুন এবং আপনার ভিডিও লিঙ্ক (YouTube, MP4, বা বৈধ Iframe) বসিয়ে দিন।</li>
              <li>পোস্টে একটি আকর্ষণীয় থাম্বনেইল যুক্ত করুন (থিম স্বয়ংক্রিয়ভাবে প্রথম ছবিটি থাম্বনেইল হিসেবে নিয়ে নেবে)।</li>
              <li>ক্যাটাগরি হিসেবে লেবেল (Labels) দিন (যেমন: <code>Trending</code>, <code>Viral</code>, <code>University</code>)।</li>
              <li>পোস্টটি <strong>Publish</strong> করুন!</li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 2: RAW CODE */}
      {activeTab === 'code' && (
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-slate-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs text-slate-400">
            <span>ফাইল সাইজ: {(xmlContent.length / 1024).toFixed(1)} KB &bull; ভ্যালিডেশন: XML v1.0 UTF-8</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading XML content...</div>
          ) : (
            <pre className="text-xs font-mono overflow-x-auto max-h-[600px] leading-relaxed p-2 text-emerald-400 select-all">
              {xmlContent}
            </pre>
          )}
        </div>
      )}

      {/* TAB 3: POST SNIPPET */}
      {activeTab === 'snippet' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              মাল্টি-পার্ট ভিডিও পোস্ট এইচটিএমএল কোড
            </h3>
            <p className="text-xs text-slate-500">
              ব্লগার পোস্ট এডিটরের <strong>HTML View</strong> তে সরাসরি এই কোড ব্যবহার করতে পারবেন:
            </p>
          </div>

          <div className="relative bg-slate-950 rounded-xl p-4 border border-slate-800">
            <button
              onClick={() => {
                navigator.clipboard.writeText(samplePostSnippet);
                alert('নমুনা কোড কপি হয়েছে!');
              }}
              className="absolute top-3 right-3 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Snippet
            </button>
            <pre className="text-xs font-mono text-purple-300 overflow-x-auto leading-relaxed pt-6">
              {samplePostSnippet}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
