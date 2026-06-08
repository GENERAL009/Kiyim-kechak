import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { AuditLog } from '../types';
import { Download, BarChart3, Clock, AlertTriangle, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TopProduct {
  variant_id: number;
  sku: string;
  size: string;
  color: string;
  price: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export const Reports: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);
  
  const [activeTab, setActiveTab] = useState<'top' | 'logs'>('top');

  // Queries
  const { data: topProducts, isLoading: topLoading } = useQuery<TopProduct[]>({
    queryKey: ['top-products'],
    queryFn: async () => {
      const res = await api.get('/reports/top-products?limit=10');
      return res.data;
    }
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/reports/audit-logs?limit=100');
      return res.data;
    },
    enabled: isAdmin && activeTab === 'logs'
  });

  const handleExportExcel = async () => {
    try {
      const res = await api.get('/reports/export-excel', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
    } catch (error) {
      alert("Excel yuklanishda xatolik yuz berdi.");
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    if (action.includes('CREATE_ORDER')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (action.includes('STOCK_ADJUST') || action.includes('STOCK_TRANSFER')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    if (action.includes('DELETE')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
  };

  const chartData = topProducts?.map(p => ({
    name: p.product_name.substring(0, 10) + '...',
    miqdor: p.total_quantity,
    daromad: p.total_revenue
  })) || [];

  const COLORS = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Tahlillar</p>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Hisobot va Tizim Audit jurnali</h2>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all text-sm shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ombor zaxiralarini Excelga yuklash
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4">
        <button
          onClick={() => setActiveTab('top')}
          className={`pb-3 font-semibold text-sm transition-all relative ${
            activeTab === 'top'
              ? 'text-indigo-600 dark:text-white'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          {activeTab === 'top' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-500 rounded-full" />}
          <div className="flex items-center gap-2 px-1">
            <BarChart3 className="w-4.5 h-4.5" />
            Top Sotilgan Tovarlar
          </div>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 font-semibold text-sm transition-all relative ${
              activeTab === 'logs'
                ? 'text-indigo-600 dark:text-white'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-500 rounded-full" />}
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4.5 h-4.5" />
              Tizim Audit Loglari (ADMIN)
            </div>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'top' && (
        <div className="space-y-6">
          {/* Chart performance */}
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 mb-5">Eng ko'p sotilganlar (Miqdori bo'yicha)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="miqdor" fill="#6366f1" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Products Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {topLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm font-semibold">Yuklanmoqda...</p>
              </div>
            ) : topProducts && topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                      <th className="py-4 px-6">#</th>
                      <th className="py-4 px-4">Mahsulot nomi</th>
                      <th className="py-4 px-4 font-mono">SKU</th>
                      <th className="py-4 px-4">O'lcham / Rang</th>
                      <th className="py-4 px-4 text-right">Sotilgan miqdor</th>
                      <th className="py-4 px-6 text-right">Jami Tushum ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((item, idx) => (
                      <tr key={item.variant_id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-100">{item.product_name}</td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-500 font-semibold">{item.sku}</td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.size}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-slate-600 dark:text-slate-450 text-xs">{item.color}</span>
                        </td>
                        <td className="py-4 px-4 text-right font-black text-slate-800 dark:text-slate-100">{item.total_quantity} dona</td>
                        <td className="py-4 px-6 text-right font-extrabold text-indigo-600 dark:text-indigo-400">${item.total_revenue?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="font-semibold text-sm">Hozircha sotuvlar haqida ma'lumot yetarli emas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {logsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
              <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-semibold">Yuklanmoqda...</p>
            </div>
          ) : auditLogs && auditLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-4 px-6">Sana</th>
                    <th className="py-4 px-4">Foydalanuvchi</th>
                    <th className="py-4 px-4">Harakat turi</th>
                    <th className="py-4 px-6">Tafsilotlar</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors text-xs">
                      <td className="py-3 px-6 text-slate-400 font-medium shrink-0">
                        {new Date(log.created_at).toLocaleString('uz-UZ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {log.user?.full_name} ({log.user?.email})
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase inline-block ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-slate-550 dark:text-slate-350 leading-relaxed font-sans">{log.details || 'Tafsilotlar yo\'q'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="font-semibold text-sm">Audit loglari topilmadi.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
