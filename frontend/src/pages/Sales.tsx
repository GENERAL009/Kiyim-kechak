import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Product, ProductVariant, Customer, Order } from '../types';
import { ShoppingCart, Plus, Trash2, UserPlus, CheckCircle, Barcode, FileText, Search, User } from 'lucide-react';

interface CartItem {
  variantId: number;
  sku: string;
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
}

export const Sales: React.FC = () => {
  const queryClient = useQueryClient();

  // Search input for barcode scanner simulation
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Customer details
  const [customerMode, setCustomerMode] = useState<'walkin' | 'existing' | 'new'>('walkin');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // Dropdown manual product search
  const [selectedVariantId, setSelectedVariantId] = useState<number | ''>('');

  // Success state
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Queries
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/sales/customers');
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

  // Flat list of variants for manual addition dropdown
  const allVariants = React.useMemo(() => {
    if (!products) return [];
    const list: Array<ProductVariant & { productName: string }> = [];
    products.forEach(p => {
      p.variants?.forEach(v => {
        list.push({
          ...v,
          productName: p.name
        });
      });
    });
    return list;
  }, [products]);

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sales/orders', data);
      return res.data;
    },
    onSuccess: (data: Order) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setLastOrder(data);
      setCart([]);
      setBarcodeInput('');
      setCustName('');
      setCustPhone('');
      setSelectedCustomerId('');
      setCustomerMode('walkin');
      
      // Auto trigger invoice download
      handleDownloadInvoice(data.id);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Sotuvni amalga oshirishda xatolik yuz berdi. Zaxirani tekshiring.");
    }
  });

  // Functions
  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const res = await api.get(`/sales/orders/${orderId}/invoice`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `invoice_${orderId}.pdf`;
      link.click();
    } catch (error) {
      alert("Chekni yuklashda xatolik yuz berdi.");
    }
  };

  const handleScanBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    try {
      // 1. Try fetching by Barcode
      let res;
      try {
        res = await api.get(`/products/variants/barcode/${barcodeInput}`);
      } catch (err) {
        // 2. Try fetching by SKU if barcode search fails
        res = await api.get(`/products/variants/sku/${barcodeInput}`);
      }

      if (res && res.data) {
        const variant: ProductVariant = res.data;
        // Find main product name
        const match = allVariants.find(av => av.id === variant.id);
        const prodName = match ? match.productName : "Mahsulot";
        
        addToCart(variant, prodName);
        setBarcodeInput('');
      }
    } catch (error) {
      alert("Kiritilgan shtrixkod yoki SKU bo'yicha tovar topilmadi!");
    }
  };

  const handleManualAddProduct = () => {
    if (!selectedVariantId) return;
    const match = allVariants.find(av => av.id === Number(selectedVariantId));
    if (match) {
      addToCart(match, match.productName);
      setSelectedVariantId('');
    }
  };

  const addToCart = (variant: ProductVariant, productName: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.variantId === variant.id);
      if (existing) {
        return prev.map(item =>
          item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            variantId: variant.id,
            sku: variant.sku,
            name: productName,
            size: variant.size,
            color: variant.color,
            price: variant.price,
            quantity: 1
          }
        ];
      }
    });
  };

  const handleRemoveFromCart = (variantId: number) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
  };

  const handleQuantityChange = (variantId: number, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => prev.map(item =>
      item.variantId === variantId ? { ...item, quantity: qty } : item
    ));
  };

  const handleOrderSubmit = () => {
    if (cart.length === 0) return;

    const payload: any = {
      items: cart.map(item => ({
        variant_id: item.variantId,
        quantity: item.quantity
      }))
    };

    if (customerMode === 'existing' && selectedCustomerId) {
      payload.customer_id = Number(selectedCustomerId);
    } else if (customerMode === 'new' && custPhone) {
      payload.customer_name = custName || "Walk-in Customer";
      payload.customer_phone = custPhone;
    }

    createOrderMutation.mutate(payload);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product lookup & Cart list */}
      <div className="lg:col-span-2 space-y-6">
        {/* Barcode scan bar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <Barcode className="w-5 h-5 text-indigo-500" />
            Shtrixkod yoki SKU Skanerlash (Simulyatsiya)
          </h3>
          <form onSubmit={handleScanBarcodeSubmit} className="flex gap-2">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Shtrixkodni kiriting yoki mahsulot SKUsini yozing..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              Scan
            </button>
          </form>

          {/* Manual Selector */}
          <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 flex gap-2">
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value === '' ? '' : Number(e.target.value))}
              className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
            >
              <option value="">Ro'yxatdan tovar tanlash (Qo'lda)...</option>
              {allVariants.map(v => (
                <option key={v.id} value={v.id}>
                  {v.productName} ({v.size} / {v.color}) - Narxi: ${v.price?.toFixed(2)} [SKU: {v.sku}]
                </option>
              ))}
            </select>
            <button
              onClick={handleManualAddProduct}
              disabled={!selectedVariantId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl text-xs transition-colors shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Qo'shish
            </button>
          </div>
        </div>

        {/* Cart List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10">
            <ShoppingCart className="w-5 h-5 text-indigo-500" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Savatchadagi Tovar</h3>
          </div>

          {cart.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {cart.map((item) => (
                <div key={item.variantId} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-350">{item.sku}</span>
                      <span>O'lcham: <strong className="text-indigo-500 uppercase">{item.size}</strong></span>
                      <span>Rang: <strong>{item.color}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Price */}
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400 font-semibold">Dona Narxi</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">${item.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity counter */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.variantId, Number(e.target.value))}
                        className="w-10 bg-transparent text-center text-xs font-black focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    {/* Total item subtotal */}
                    <div className="text-right w-20 shrink-0">
                      <p className="text-[10px] text-slate-400 font-semibold font-sans">Jami</p>
                      <p className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemoveFromCart(item.variantId)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="font-semibold text-sm">Savatcha bo'sh.</p>
              <p className="text-xs text-slate-400 mt-1">Tovar qo'shish uchun yuqoridagi qidiruv panelidan foydalaning.</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer panel & checkout summary */}
      <div className="space-y-6">
        {/* Customer Select panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 text-sm">
            <User className="w-4.5 h-4.5 text-indigo-500" />
            Mijoz Ma'lumoti
          </h3>

          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl text-[10px] font-bold text-slate-500">
            <button
              onClick={() => setCustomerMode('walkin')}
              className={`py-1.5 rounded-xl transition-all ${customerMode === 'walkin' ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-white shadow-sm' : ''}`}
            >
              Oddiy
            </button>
            <button
              onClick={() => setCustomerMode('existing')}
              className={`py-1.5 rounded-xl transition-all ${customerMode === 'existing' ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-white shadow-sm' : ''}`}
            >
              Mavjud
            </button>
            <button
              onClick={() => setCustomerMode('new')}
              className={`py-1.5 rounded-xl transition-all ${customerMode === 'new' ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-white shadow-sm' : ''}`}
            >
              Yangi +
            </button>
          </div>

          {customerMode === 'walkin' && (
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
              Standard <strong>"Walk-in Customer"</strong> (Oddiy tashrif buyuruvchi) hisobi orqali sotuv amalga oshiriladi.
            </div>
          )}

          {customerMode === 'existing' && (
            <div>
              <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Mavjud Mijozlar</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
              >
                <option value="">Mijozni tanlang...</option>
                {customers?.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>)}
              </select>
            </div>
          )}

          {customerMode === 'new' && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">F.I.SH (Mijoz ismi)</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="Ism sharifi"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Telefon Raqami (Majburiy)</label>
                <input
                  type="text"
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="Telefon raqami"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Order checkout bill */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Sotuv Hisob-kitobi</h3>
          
          <div className="space-y-2.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Mahsulot turi:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{cart.length} xil</span>
            </div>
            <div className="flex justify-between">
              <span>Jami dona:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} dona
              </span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex justify-between items-end">
              <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Umumiy narxi:</span>
              <span className="text-xl font-black text-indigo-650 dark:text-indigo-400">${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleOrderSubmit}
            disabled={cart.length === 0 || createOrderMutation.isPending}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm mt-2"
          >
            {createOrderMutation.isPending ? 'Sotuv yozilmoqda...' : 'Sotuvni amalga oshirish'}
          </button>
        </div>

        {/* Last Order receipt download option */}
        {lastOrder && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle className="w-4 h-4" />
              Sotuv muvaffaqiyatli yakunlandi!
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Sotuv kodi: <strong>#{lastOrder.id}</strong>. PDF kvitansiya cheki avtomatik yuklandi. Agar yuklanmagan bo'lsa, quyidagi tugmani bosing.
            </p>
            <button
              onClick={() => handleDownloadInvoice(lastOrder.id)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Chekni PDF Yuklab olish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
