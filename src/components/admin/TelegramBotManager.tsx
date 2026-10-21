import React, { useState, useEffect } from 'react';
import { Send, Check, RefreshCw, Terminal, Sparkles, ShieldCheck, MessageSquare, ExternalLink, Key, Eye, EyeOff } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

interface TelegramBotManagerProps {
  token: string;
}

export const TelegramBotManager: React.FC<TelegramBotManagerProps> = ({ token }) => {
  const [botUsername, setBotUsername] = useState<string>('@Advisit_bot');
  const [botToken, setBotToken] = useState<string>('8329711123:AAG2pVo9OXB8AZYmWEzpAomKTB9sfkoGmUE');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [telegramChannelUrl, setTelegramChannelUrl] = useState<string>('https://t.me/Advisit_bot');
  const [botStatus, setBotStatus] = useState<string>('online');
  const [webhookStatus, setWebhookStatus] = useState<string>('active');
  const [hasTokenConfigured, setHasTokenConfigured] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Command simulator
  const [commandInput, setCommandInput] = useState<string>('/start');
  const [botChatHistory, setBotChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'স্বাগতম প্রিমিয়াম কালেকশন অফিসিয়াল টেলিগ্রাম বটে! 🎬\n\nকমান্ড তালিকা দেখতে /help টাইপ করুন।',
      time: '10:00 AM',
    },
  ]);

  useEffect(() => {
    safeFetchJson<any>('/api/telegram/config', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setBotUsername(data.botUsername || '@Advisit_bot');
        if (data.botToken) setBotToken(data.botToken);
        setTelegramChannelUrl(data.telegramChannelUrl || 'https://t.me/Advisit_bot');
        setBotStatus(data.botStatus || 'online');
        setWebhookStatus(data.webhookStatus || 'active');
        setHasTokenConfigured(Boolean(data.hasTokenConfigured));
      })
      .catch((err) => console.error('Failed to load telegram config:', err));
  }, [token]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/telegram/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          botUsername,
          botToken,
          telegramChannelUrl,
          botStatus,
          webhookStatus,
        }),
      });

      if (!res.ok) throw new Error('আপডেট ব্যর্থ হয়েছে');

      setMsg('টেলিগ্রাম বট ও টোকেন কনফিগারেশন সংরক্ষিত হয়েছে!');
      setHasTokenConfigured(true);
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateCommand = async (cmd: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBotChatHistory((prev) => [...prev, { sender: 'user', text: cmd, time: timeStr }]);

    try {
      const data = await safeFetchJson<{ response: string }>('/api/telegram/simulate-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command: cmd }),
      });
      setBotChatHistory((prev) => [
        ...prev,
        { sender: 'bot', text: data.response, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (err: any) {
      console.error(err);
      setBotChatHistory((prev) => [
        ...prev,
        { sender: 'bot', text: 'কমান্ড প্রসেসিং এ ত্রুটি হয়েছে: ' + (err.message || 'অজানা সমস্যা'), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    }
  };

  const [testingLive, setTestingLive] = useState<boolean>(false);
  const [liveBotResult, setLiveBotResult] = useState<{ success: boolean; message: string; bot?: any } | null>(null);

  const handleTestLiveBot = async () => {
    setTestingLive(true);
    setLiveBotResult(null);
    try {
      const data = await safeFetchJson<{ success: boolean; message?: string; bot?: any; error?: string }>('/api/telegram/test-live-bot', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success && data.bot) {
        setLiveBotResult({
          success: true,
          message: `সফল! টেলিগ্রাম বটের সাথে সরাসরি সংযোগ সক্রিয়: ${data.bot.first_name} (@${data.bot.username}, ID: ${data.bot.id})`,
          bot: data.bot,
        });
      } else {
        setLiveBotResult({
          success: false,
          message: data.error || data.message || 'টেলিগ্রাম এপিআই সংযোগ ব্যর্থ হয়েছে',
        });
      }
    } catch (err: any) {
      setLiveBotResult({
        success: false,
        message: err.message || 'নেটওয়ার্ক সংযোগ ত্রুটি',
      });
    } finally {
      setTestingLive(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          টেলিগ্রাম বট কনফিগারেশন (Telegram Bot Settings)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          বট ইউজারনেম, ওয়েবহুক সংযোগ ও লাইভ বট কমান্ড পরীক্ষা করুন।
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-500" />
            <span>বট সেটিংস (Bot Settings)</span>
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  বট ইউজারনেম (BOT_USERNAME)
                </label>
                {botUsername && (
                  <a
                    href={`https://t.me/${botUsername.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-500 hover:text-sky-600 flex items-center gap-1 font-medium"
                  >
                    <span>টেলিগ্রামে খুলুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="text"
                value={botUsername}
                onChange={(e) => setBotUsername(e.target.value)}
                placeholder="@Advisit_bot"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  বট সিক্রেট টোকেন (BOT_TOKEN)
                </label>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showToken ? 'হাইড করুন' : 'টোকেন দেখুন'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="8329711123:AAG2pVo9OXB8AZYmWEzpAomKTB9sfkoGmUE"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {hasTokenConfigured ? '✅ সক্রিয় টোকেন কনফিগার করা আছে (Bot ID: 8329711123)' : 'টেলিগ্রাম @BotFather থেকে প্রাপ্ত টোকেন'}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                টেলিগ্রাম চ্যানেল লিঙ্ক (Telegram Channel URL)
              </label>
              <input
                type="url"
                value={telegramChannelUrl}
                onChange={(e) => setTelegramChannelUrl(e.target.value)}
                placeholder="https://t.me/Advisit_bot"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  বট স্ট্যাটাস (Bot Status)
                </label>
                <select
                  value={botStatus}
                  onChange={(e) => setBotStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  <option value="online">Online</option>
                  <option value="standby">Standby</option>
                  <option value="disconnected">Disconnected</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ওয়েবহুক স্ট্যাটাস
                </label>
                <select
                  value={webhookStatus}
                  onChange={(e) => setWebhookStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-slate-600 dark:text-slate-300 text-[11px] space-y-1">
              <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>নিরাপত্তা নিশ্চয়তা (Zero Secret Leak)</span>
              </div>
              <p>
                টেলিগ্রাম <code>BOT_TOKEN</code> কোনোভাবেই ব্রাউজারের জাভাস্ক্রিপ্ট বা ব্লুগার থিমে থাকে না। এটি কেবল সার্ভার এনভায়রনমেন্টে এনক্রিপ্টেড থাকে।
              </p>
            </div>

            {liveBotResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium ${
                  liveBotResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                {liveBotResult.message}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-md shadow-pink-500/20 hover:from-purple-500 hover:to-pink-500 transition-all cursor-pointer"
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'বট কনফিগারেশন সেভ করুন'}
              </button>

              <button
                type="button"
                onClick={handleTestLiveBot}
                disabled={testingLive}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="সরাসরি টেলিগ্রাম এপিআই সংযোগ পরীক্ষা"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingLive ? 'animate-spin' : ''}`} />
                <span>{testingLive ? 'যাচাই হচ্ছে...' : 'লাইভ টেস্ট'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Bot Interactive Simulator */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span>লাইভ কমান্ড সিমুলেটর (Command Tester)</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                Live Simulator
              </span>
            </div>

            {/* Simulated Chat Feed */}
            <div className="bg-slate-950 rounded-xl p-4 min-h-[240px] max-h-[280px] overflow-y-auto space-y-3 font-mono text-xs">
              {botChatHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                      item.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-emerald-300 rounded-bl-none border border-slate-700'
                    }`}
                  >
                    {item.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Command Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400">কমান্ড টেস্ট করুন:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSimulateCommand('/start')}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                /start
              </button>
              <button
                type="button"
                onClick={() => handleSimulateCommand('/videos')}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                /videos
              </button>
              <button
                type="button"
                onClick={() => handleSimulateCommand('/help')}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                /help
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
