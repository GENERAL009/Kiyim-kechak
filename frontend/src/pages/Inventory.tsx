import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Inventory, Warehouse, ProductVariant, Product } from '../types';
import { ArrowLeftRight, ChevronRight, Download, Eye, Layers, Plus, RotateCw, Settings, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const isEditable = hasRole(['ADMIN', 'WAREHOUSE_MANAGER']);

  // Filters
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | ''>('');
  
  // Transaction Modal state
  const [txModal, setTxModal] = useState(false);
  const [txType, setTxType] = useState<'INCOMING' | 'OUTGOING' | 'TRANSFER' | 'ADJUSTMENT'>('INCOMING');
  const [txVariant, setTxVariant] = useState<number | ''>('');
  const [txFromWh, setTxFromWh] = useState<number | ''>('');
  const [txToWh, setTxToWh] = useState<number | ''>('');
  const [txQty, setTxQty] = useState<number>(1);
  const [txRemarks, setTxRemarks] = useState('');

  // Queries
  const { data: stocks, isLoading: stocksLoading, refetch } = useQuery<Inventory[]>({
    queryKey: ['inventory', selectedWarehouse],
    queryFn: async () => {
      let url = '/inventory';
      if (selectedWarehouse) url += `?warehouse_id=${selectedWarehouse}`;
      const res = await api.get(url);
      return res.data;
    }
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data;
    }
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products?limit=500');
      return res.data;
    }
  });

  // Flat list of variants for easy dropdown selection
  const allVariants = React.useMemo(() => {
    if (!products) return [];
    const list: Array<{ id: number; label: string }> = [];
    products.forEach(p => {
      p.variants?.forEach(v => {
        list.push({
          id: v.id,
          label: `${p.name} (${v.size} / ${v.color}) - SKU: ${v.sku}`
        });
      });
    });
    return list;
  }, [products]);

  // Mutations
  const executeTxMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/inventory/transaction', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTxModal(false);
      // Reset form
      setTxVariant('');
      setTxFromWh('');
      setTxToWh('');
      setTxQty(1);
      setTxRemarks('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Tranzaksiya bajarilishida xatolik yuz berdi. Zaxira yetarli ekanligini tekshiring.");
    }
  });

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txVariant || txQty <= 0) return;

    const payload: any = {
      transaction_type: txType,
      variant_id: Number(txVariant),
      quantity: Number(txQty),
      remarks: txRemarks
    };

    if (txType === 'INCOMING') {
      payload.to_warehouse_id = Number(txToWh);
    } else if (txType === 'OUTGOING') {
      payload.from_warehouse_id = Number(txFromWh);
    } else if (txType === 'TRANSFER') {
      payload.from_warehouse_id = Number(txFromWh);
      payload.to_warehouse_id = Number(txToWh);
    } else if (txType === 'ADJUSTMENT') {
      payload.to_warehouse_id = Number(txToWh); // Target warehouse where we set stock
    }

    executeTxMutation.mutate(payload);
  };

  const openTransactionModal = (type: typeof txType) => {
    setTxType(type);
    setTxModal(true);
  };

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

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Ombor tizimi</p>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Inventar va Zaxira qoldiqlari</h2>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition-colors duration-150 text-sm border border-slate-300 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            Excel Eksport
          </button>

          {isEditable && (
            <div className="flex gap-2">
              <button
                onClick={() => openTransactionModal('INCOMING')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl shadow-md shadow-emerald-600/10 active:scale-[0.98] transition-all text-xs"
              >
                <Plus className="w-4 h-4" /> Kirim qilish
              </button>
              <button
                onClick={() => openTransactionModal('TRANSFER')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl shadow-md shadow-blue-600/10 active:scale-[0.98] transition-all text-xs"
              >
                <ArrowLeftRight className="w-4 h-4" /> Transfer
              </button>
              <button
                onClick={() => openTransactionModal('ADJUSTMENT')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-2xl shadow-md shadow-amber-600/10 active:scale-[0.98] transition-all text-xs"
              >
                <Settings className="w-4 h-4" /> Stok audit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-500">Ombor bo'yicha saralash:</span>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-250 font-medium focus:outline-none"
          >
            <option value="">Barchasi</option>
            {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          title="Yangilash"
        >
          <RotateCw className="w-4 h-4 animate-hover" />
        </button>
      </div>

      {/* Stocks Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {stocksLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
            <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold">Yuklanmoqda...</p>
          </div>
        ) : stocks && stocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                  <th className="py-4 px-6">Ombor</th>
                  <th className="py-4 px-4">Mahsulot</th>
                  <th className="py-4 px-4 font-mono">SKU</th>
                  <th className="py-4 px-4">O'lcham / Rang</th>
                  <th className="py-4 px-4 text-right">Narxi</th>
                  <th className="py-4 px-6 text-right">Zaxira (Qoldiq)</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((item) => {
                  const isLow = item.quantity <= item.min_stock_level;
                  return (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-850 dark:text-slate-200">{item.warehouse?.name}</td>
                      <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        {item.variant?.product?.name || 'Mahsulot'}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{item.variant?.sku}</td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.variant?.size}</span>
                        <span className="text-slate-400 mx-1.5">/</span>
                        <span className="text-slate-600 dark:text-slate-400 text-xs">{item.variant?.color}</span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-slate-800 dark:text-slate-100">${item.variant?.price?.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isLow && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg animate-pulse">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Kam
                            </div>
                          )}
                          <span className={`font-black text-sm ${isLow ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {item.quantity} dona
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400">
            <Layers className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="font-semibold text-sm">Omborlarda hech qanday tovar qoldig'i topilmadi.</p>
          </div>
        )}
      </div>

      {/* Stock Transaction Modal */}
      {txModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setTxModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              {txType === 'INCOMING' && 'Zaxiraga Tovar Qabul Qilish (Kirim)'}
              {txType === 'OUTGOING' && 'Zaxiradan Tovar Chiqarish (Chiqim)'}
              {txType === 'TRANSFER' && 'Omborlararo Zaxira Transferi'}
              {txType === 'ADJUSTMENT' && "Zaxirani To'g'rilash (Audit)"}
            </h3>

            <form onSubmit={handleTxSubmit} className="space-y-4">
              {/* Product Variant Select */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Tovar Variantini Tanlang</label>
                <select
                  required
                  value={txVariant}
                  onChange={(e) => setTxVariant(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none"
                >
                  <option value="">Tanlang...</option>
                  {allVariants.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>

              {/* Warehouses configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Warehouse */}
                {(txType === 'OUTGOING' || txType === 'TRANSFER') && (
                  <div>
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">Jo'natuvchi Ombor (Chiqish)</label>
                    <select
                      required
                      value={txFromWh}
                      onChange={(e) => setTxFromWh(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none"
                    >
                      <option value="">Tanlang...</option>
                      {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Destination Warehouse */}
                {(txType === 'INCOMING' || txType === 'TRANSFER' || txType === 'ADJUSTMENT') && (
                  <div className={(txType === 'INCOMING' || txType === 'ADJUSTMENT') ? 'col-span-2' : ''}>
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">
                      {txType === 'ADJUSTMENT' ? 'Tekshirilayotgan Ombor' : 'Qabul Qiluvchi Ombor (Kirish)'}
                    </label>
                    <select
                      required
                      value={txToWh}
                      onChange={(e) => setTxToWh(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none"
                    >
                      <option value="">Tanlang...</option>
                      {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Quantity input */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  {txType === 'ADJUSTMENT' ? 'Haqiqiy mavjud qoldiq miqdori' : 'Miqdori (Dona)'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={txQty}
                  onChange={(e) => setTxQty(Number(e.target.value))}
                  placeholder="Dona miqdori"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none font-bold"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Izoh / Tranzaksiya sababi</label>
                <input
                  type="text"
                  value={txRemarks}
                  onChange={(e) => setTxRemarks(e.target.value)}
                  placeholder="Masalan, Yangi kirim tovari yoki transfer sababi"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setTxModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition-colors text-sm"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={executeTxMutation.isPending}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all text-sm flex items-center gap-2"
                >
                  {executeTxMutation.isPending ? 'Bajarilmoqda...' : 'Tranzaksiyani Yakunlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
