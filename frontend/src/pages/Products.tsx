import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Product, Category, Brand, ProductVariant } from '../types';
import { Plus, Search, Tag, Trash2, FolderPlus, Bookmark, ChevronRight, ChevronDown, Barcode, Layers, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Products: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  
  // State variables for search and modals
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedBrand, setSelectedBrand] = useState<number | ''>('');
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  // Modal Open States
  const [productModal, setProductModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [brandModal, setBrandModal] = useState(false);

  // Category & Brand Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState<number | ''>('');
  const [prodBrand, setProdBrand] = useState<number | ''>('');
  const [variants, setVariants] = useState<Array<{ size: string; color: string; price: number; sku?: string; barcode?: string }>>([
    { size: 'M', color: 'Qora', price: 29.99 }
  ]);

  // Queries
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products', searchTerm, selectedCategory, selectedBrand],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category_id', String(selectedCategory));
      if (selectedBrand) params.append('brand_id', String(selectedBrand));
      const res = await api.get(`/products?${params.toString()}`);
      return res.data;
    }
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return res.data;
    }
  });

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get('/products/brands');
      return res.data;
    }
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return api.post('/products/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryModal(false);
      setCatName('');
      setCatDesc('');
    }
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return api.post('/products/brands', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setBrandModal(false);
      setBrandName('');
      setBrandDesc('');
    }
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductModal(false);
      setProdName('');
      setProdDesc('');
      setProdCat('');
      setProdBrand('');
      setVariants([{ size: 'M', color: 'Qora', price: 29.99 }]);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  // Handlers
  const handleAddVariant = () => {
    setVariants([...variants, { size: 'L', color: 'Ko\'k', price: 29.99 }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodCat || !prodBrand || variants.length === 0) return;
    
    createProductMutation.mutate({
      name: prodName,
      description: prodDesc,
      category_id: Number(prodCat),
      brand_id: Number(prodBrand),
      variants: variants.map(v => ({
        ...v,
        price: Number(v.price)
      }))
    });
  };

  const isEditable = hasRole(['ADMIN', 'WAREHOUSE_MANAGER']);

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Ombor tizimi</p>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Kiyim-kechaklar Boshqaruvi</h2>
        </div>
        
        {isEditable && (
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setCategoryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition-colors duration-150 text-sm border border-slate-300 dark:border-slate-700"
            >
              <FolderPlus className="w-4 h-4" />
              Kategoriya qo'shish
            </button>
            <button
              onClick={() => setBrandModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition-colors duration-150 text-sm border border-slate-300 dark:border-slate-700"
            >
              <Bookmark className="w-4 h-4" />
              Brend qo'shish
            </button>
            <button
              onClick={() => setProductModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-150 text-sm"
            >
              <Plus className="w-4 h-4" />
              Mahsulot qo'shish
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Mahsulot nomi yoki SKU bo'yicha qidiruv..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="">Barcha Kategoriyalar</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Brand Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="">Barcha Brendlar</option>
            {brands?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {productsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
            <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold">Yuklanmoqda...</p>
          </div>
        ) : products && products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                  <th className="w-12 py-4 px-6 text-center"></th>
                  <th className="py-4 px-4">Mahsulot nomi</th>
                  <th className="py-4 px-4">Kategoriya</th>
                  <th className="py-4 px-4">Brend</th>
                  <th className="py-4 px-4 text-center">Variant soni</th>
                  <th className="py-4 px-6 text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isExpanded = expandedProduct === product.id;
                  return (
                    <React.Fragment key={product.id}>
                      <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                          >
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{product.name}</h4>
                            <p className="text-slate-400 text-[11px] truncate max-w-sm mt-0.5">{product.description || 'Tavsif yozilmagan'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-350">{product.category?.name}</td>
                        <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-350">{product.brand?.name}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-xs">
                            {product.variants?.length} ta
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {isEditable && (
                            <button
                              onClick={() => {
                                if (window.confirm("Rostdan ham ushbu mahsulot va uning barcha o'lcham variantlarini o'chirmoqchimisiz?")) {
                                  deleteProductMutation.mutate(product.id);
                                }
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                              title="O'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* Expanded variants list */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/50 dark:bg-slate-950/20 py-4 px-8 border-b border-slate-100 dark:border-slate-800">
                            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden bg-white dark:bg-slate-900">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/50 dark:bg-slate-800/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 px-4">SKU (Zaxira kodi)</th>
                                    <th className="py-3 px-4">Shtrixkod</th>
                                    <th className="py-3 px-4">O'lcham</th>
                                    <th className="py-3 px-4">Rang</th>
                                    <th className="py-3 px-4 text-right">Narxi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {product.variants?.map((variant) => (
                                    <tr key={variant.id} className="border-b border-slate-100 dark:border-slate-800/50 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50/30 dark:hover:bg-slate-800/5">
                                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-200">{variant.sku}</td>
                                      <td className="py-2.5 px-4 font-mono text-slate-500 flex items-center gap-1.5">
                                        <Barcode className="w-3.5 h-3.5" />
                                        {variant.barcode}
                                      </td>
                                      <td className="py-2.5 px-4 font-bold text-indigo-600 dark:text-indigo-400 uppercase">{variant.size}</td>
                                      <td className="py-2.5 px-4">{variant.color}</td>
                                      <td className="py-2.5 px-4 text-right font-extrabold text-slate-800 dark:text-slate-100">${variant.price?.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400">
            <Layers className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="font-semibold text-sm">Hech qanday mahsulot topilmadi.</p>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setCategoryModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Yangi Kategoriya Qo'shish</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Nomi</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Masalan, Shimlar"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Tavsif (Opsional)</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Kategoriya tavsifi..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none h-20"
                />
              </div>
              <button
                onClick={() => createCategoryMutation.mutate({ name: catName, description: catDesc })}
                disabled={!catName}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all text-sm mt-2"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {brandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setBrandModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Yangi Brend Qo'shish</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Nomi</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Masalan, Nike"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Tavsif (Opsional)</label>
                <textarea
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  placeholder="Brend tavsifi..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none h-20"
                />
              </div>
              <button
                onClick={() => createBrandMutation.mutate({ name: brandName, description: brandDesc })}
                disabled={!brandName}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all text-sm mt-2"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {productModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 my-8">
            <button onClick={() => setProductModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Yangi Mahsulot yaratish</h3>
            
            <form onSubmit={handleProductSubmit} className="space-y-4">
              {/* Product Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Nomi</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Mahsulot nomi"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">Kategoriya</label>
                    <select
                      required
                      value={prodCat}
                      onChange={(e) => setProdCat(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none"
                    >
                      <option value="">Tanlang</option>
                      {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">Brend</label>
                    <select
                      required
                      value={prodBrand}
                      onChange={(e) => setProdBrand(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none"
                    >
                      <option value="">Tanlang</option>
                      {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Tavsif (Opsional)</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Tovar haqida batafsil..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none h-14 text-sm"
                />
              </div>

              {/* Variants Section */}
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">O'lcham va Rang Variantlari</h4>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Variant qo'shish
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {variants.map((v, index) => (
                    <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl relative">
                      {/* Size */}
                      <div className="w-20 shrink-0">
                        <select
                          value={v.size}
                          onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-700 dark:text-slate-250 text-xs"
                        >
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </select>
                      </div>

                      {/* Color */}
                      <div className="flex-1 min-w-[80px]">
                        <input
                          type="text"
                          required
                          value={v.color}
                          onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                          placeholder="Rang (Qizil...)"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
                        />
                      </div>

                      {/* Price */}
                      <div className="w-24 shrink-0">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={v.price}
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          placeholder="Narxi ($)"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none text-right font-bold"
                        />
                      </div>

                      {/* Optional Custom SKU */}
                      <div className="w-32 shrink-0 hidden md:block">
                        <input
                          type="text"
                          value={v.sku || ''}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value || undefined)}
                          placeholder="SKU (Avto)"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none font-mono"
                        />
                      </div>

                      {/* Remove Button */}
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning tooltip for SKU */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-500 leading-normal">
                <ShieldAlert className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p>
                  Agar SKU va shtrixkodlarni bo'sh qoldirsangiz, tizim ularni toifalar, brendlar, o'lcham va rang kodlaridan foydalangan holda avtomatik tarzda yaratadi.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setProductModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition-colors text-sm"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all text-sm flex items-center gap-2"
                >
                  {createProductMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
