import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Warehouse } from '../types';
import { MapPin, Plus, Warehouse as WhIcon, X, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Warehouses: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  // Fetch warehouses
  const { data: warehouses, isLoading } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data;
    }
  });

  // Create warehouse mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; location?: string }) => {
      return api.post('/warehouses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setModalOpen(false);
      setName('');
      setLocation('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    createMutation.mutate({ name, location });
  };

  const isAdmin = hasRole(['ADMIN']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Ombor tizimi</p>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans">Jismoniy Omborlar</h2>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-150 text-sm"
          >
            <Plus className="w-4 h-4" />
            Yangi ombor qo'shish
          </button>
        )}
      </div>

      {/* Grid of Warehouses */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
          <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold">Yuklanmoqda...</p>
        </div>
      ) : warehouses && warehouses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Decorative design */}
              <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800/40 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                <WhIcon className="w-10 h-10 text-slate-300 dark:text-slate-700/60 translate-y-3 -translate-x-3" />
              </div>

              <div className="space-y-4">
                <div className="pr-10">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-500 transition-colors">{wh.name}</h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">ID: #{wh.id}</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-xs">
                    <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{wh.location || 'Manzil ko\'rsatilmagan'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Yaratilgan sana: {new Date(wh.created_at).toLocaleDateString('uz-UZ')}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Zaxira holati</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold">
                    Faol
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <WhIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="font-semibold text-sm">Hech qanday ombor topilmadi.</p>
        </div>
      )}

      {/* Create Warehouse Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Yangi Ombor Qo'shish</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Ombor Nomi</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan, Toshkent Shimoliy Ombori"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Ombor Manzili</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Masalan, Toshkent, Chilonzor 15-daha"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending || !name}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all text-sm mt-2"
              >
                {createMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
