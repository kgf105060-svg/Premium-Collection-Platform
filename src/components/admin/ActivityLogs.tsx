import React, { useState, useEffect } from 'react';
import { Activity, Shield, RefreshCw } from 'lucide-react';
import { ActivityLog } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface ActivityLogsProps {
  token: string;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ token }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = () => {
    setLoading(true);
    safeFetchJson<{ logs: ActivityLog[] }>('/api/analytics/activity-logs', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load logs:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            অ্যাডমিন অ্যাক্টিভিটি অডিট লগ (Audit Trail)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            অ্যাডমিনিস্ট্রেটরদের সকল অ্যাকশন, লগইন ও কনফিগারেশন পরিবর্তনের অডিট রেকর্ড।
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">অ্যাক্টিভিটি লগ লোড হচ্ছে...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">কোনো লগ রেকর্ড পাওয়া যায়নি।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">টাইমস্ট্যাম্প</th>
                  <th className="py-3 px-4">অ্যাকশন (Action)</th>
                  <th className="py-3 px-4">টার্গেট (Target)</th>
                  <th className="py-3 px-4">অ্যাডমিন ইমেল</th>
                  <th className="py-3 px-4">আইপি (IP)</th>
                  <th className="py-3 px-4">বিস্তারিত (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {log.target}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {log.adminEmail}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[10px]">
                      {log.ip}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
