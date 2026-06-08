import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { DashboardStats } from '../types';
import {
  Boxes,
  Shirt,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  ShoppingCart
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading, refetch, isFetching } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data;
    },
    refetchInterval: 15000 // Refresh every 15s for real-time stock monitoring
  });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" />
        <p className="font-semibold text-sm">Dashboard yuklanmoqda...</p>
      </div>
    );
  }

  // Mock revenue history chart data (FastAPI dynamically sends dashboard overview)
  const revenueHistory = [
    { name: 'Yanvar', daromad: (stats?.monthly_revenue || 0) * 0.7 },
    { name: 'Fevral', daromad: (stats?.monthly_revenue || 0) * 0.8 },
    { name: 'Mart', daromad: (stats?.monthly_revenue || 0) * 0.9 },
    { name: 'Aprel', daromad: (stats?.monthly_revenue || 0) * 0.75 },
    { name: 'May', daromad: (stats?.monthly_revenue || 0) * 1.1 },
    { name: 'Iyun', daromad: stats?.monthly_revenue || 0 },
  ];

  // Stock categories mapping or Mock distribution
  const stockDistribution = [
    { name: 'Zara', value: Math.floor((stats?.total_stock || 100) * 0.4) },
    { name: 'Nike', value: Math.floor((stats?.total_stock || 100) * 0.3) },
    { name: 'H&M', value: Math.floor((stats?.total_stock || 100) * 0.2) },
    { name: 'Boshqa', value: Math.floor((stats?.total_stock || 100) * 0.1) },
  ];

  const COLORS = ['#6366f1', '#eab308', '#22c55e', '#a855f7'];

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {/* Card 1: Total Products */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Barcha Tovar</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{stats?.total_products}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Shirt className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Total Stock */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Ombor Qoldig'i</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{stats?.total_stock}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Kam qolgan tovar</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{stats?.low_stock_products}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${stats && stats.low_stock_products > 0 ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Today's Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Bugungi Savdo</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">${stats?.todays_sales?.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 5: Monthly Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Oylik Tushum</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">${stats?.monthly_revenue?.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 6: Inventory Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Tovar Qiymati</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">${stats?.inventory_value?.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-2xl">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Sotuvlar Dinamikasi</h4>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">Oxirgi 6 oy</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    color: '#0f172a'
                  }}
                />
                <Area type="monotone" dataKey="daromad" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Brendlar Bo'yicha Qoldiq</h4>
          <div className="h-60 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-xs text-slate-400 font-semibold uppercase">Jami Zaxira</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{stats?.total_stock}</span>
            </div>
          </div>
          {/* Legend indicator */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {stockDistribution.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{entry.name} ({entry.value} dona)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lists Section: Recent Orders & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions list */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Oxirgi Harakatlar (Kirim/Chiqim)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">SKU</th>
                  <th className="pb-3 font-semibold">Turi</th>
                  <th className="pb-3 font-semibold text-right">Miqdor</th>
                  <th className="pb-3 font-semibold pl-4">Sana</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
                  stats.recent_transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-50 dark:border-slate-850/20 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 font-mono font-medium text-slate-800 dark:text-slate-200">{tx.variant?.sku}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                          tx.transaction_type === 'INCOMING' ? 'bg-emerald-500/10 text-emerald-500' :
                          tx.transaction_type === 'OUTGOING' ? 'bg-rose-500/10 text-rose-500' :
                          tx.transaction_type === 'TRANSFER' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-bold ${tx.quantity >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </td>
                      <td className="py-3 pl-4 text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Hozircha harakatlar tarixi yo'q.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-500" />
              Oxirgi Sotuvlar (Buyurtmalar)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Mijoz</th>
                  <th className="pb-3 font-semibold text-right">Summa</th>
                  <th className="pb-3 font-semibold pl-4">Sana</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_orders && stats.recent_orders.length > 0 ? (
                  stats.recent_orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-50 dark:border-slate-850/20 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 font-bold text-slate-700 dark:text-slate-300">#{order.id}</td>
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{order.customer?.full_name}</td>
                      <td className="py-3 text-right font-extrabold text-slate-800 dark:text-slate-100">
                        ${order.total_amount?.toFixed(2)}
                      </td>
                      <td className="py-3 pl-4 text-slate-400">
                        {new Date(order.created_at).toLocaleDateString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Hozircha sotuvlar yo'q.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
