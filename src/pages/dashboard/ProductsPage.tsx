import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService, DEFAULT_HERO_IMAGE_URL } from '../../lib/services/businessService';
import { productService } from '../../lib/services/productService';
import { Modal } from '../../components/Modal';
import { formatNaira } from '../../lib/utils';
import { productSchema } from '../../lib/validation/schemas';
import { useToast } from '../../components/Toast';
import { getRegistry, AttributeField } from '../../lib/config/productRegistries';
import type { Business } from '../../lib/types';
import { Plus, MagnifyingGlass, Package, Tag, Trash } from '@phosphor-icons/react';

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    const phone = authService.getCurrentPhone();
    if (!phone) return;
    const b = await businessService.getBusinessByPhone(phone);
    if (b) {
      if (!b.themeConfig || !b.themeConfig.heroImageUrl) {
        const defaultHeroUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4';
        const repairedThemeConfig = {
          primaryColor: '#111111',
          ctaText: 'Add to Bag',
          heroImageUrl: defaultHeroUrl,
          ...(b.themeConfig || {})
        };
        const updatedBiz = await businessService.updateBusiness(b.id, { themeConfig: repairedThemeConfig });
        if (updatedBiz) {
          setBusiness(updatedBiz);
        } else {
          setBusiness(b);
        }
      } else {
        setBusiness(b);
      }
      setBusinessId(b.id);
      const p = await productService.getProducts(b.id);
      setProducts(p);
    }
    setIsLoading(false);
  }

  const handleToggleAvailable = async (product: Product, newValue: boolean) => {
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: newValue } : p));
    try {
      await productService.updateProduct(product.id, { isAvailable: newValue });
      
      if (business) {
        const channel = new BroadcastChannel('inventory_updates');
        channel.postMessage({ type: 'inventory_changed', slug: business.storefrontSlug });
        channel.close();
      }
    } catch {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: product.isAvailable } : p));
      addToast('Failed to update availability', 'error');
    }
  };

  const openAddModal = () => { setEditingProduct(null); setIsModalOpen(true); };
  const openEditModal = (product: Product) => { setEditingProduct(product); setIsModalOpen(true); };

  const handleResetHero = async () => {
    if (!business) return;
    try {
      const updated = await businessService.updateBusiness(business.id, {
        themeConfig: {
          ...business.themeConfig,
          heroImageUrl: DEFAULT_HERO_IMAGE_URL
        }
      });
      if (updated) {
        setBusiness(updated);
        addToast('Reverted to default hero image', 'success');
        const channel = new BroadcastChannel('theme_updates');
        channel.postMessage({
          type: 'theme_changed',
          slug: business.storefrontSlug,
          theme: business.theme,
          themeConfig: { ...business.themeConfig, heroImageUrl: DEFAULT_HERO_IMAGE_URL }
        });
        channel.close();
      }
    } catch {
      addToast('Failed to reset hero image', 'error');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const defaultHeroUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4';
  const activeHeroUrl = business?.themeConfig?.heroImageUrl || defaultHeroUrl;

  const registry = business ? getRegistry(business.category) : null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-10 selection:bg-[#E0FF4F] selection:text-slate-900">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 mb-1">Products</h1>
          {registry && (
            <p className="text-sm md:text-base font-bold text-slate-500 flex items-center gap-2">
              <span>{registry.icon}</span>
              <span>{registry.categoryLabel} details active</span>
            </p>
          )}
        </div>
        <div className="hidden md:block">
          <button onClick={openAddModal} className="flex items-center gap-2 bg-[#E0FF4F] text-slate-900 px-6 py-3 rounded-[12px] font-bold border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">
            <Plus weight="bold" className="w-5 h-5" /> Add Product
          </button>
        </div>
      </header>

      {/* Current Storefront Hero Banner display */}
      {!isLoading && business && (
        <div className="mb-8 bg-white border-2 border-slate-900 rounded-[20px] p-5 shadow-[4px_4px_0px_#0f172a] relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/3 aspect-[12/5] bg-slate-100 border-2 border-slate-900 rounded-xl overflow-hidden relative shadow-[2px_2px_0px_#0f172a] shrink-0">
            {activeHeroUrl ? (
              <img src={activeHeroUrl} className="w-full h-full object-cover" alt="Current Storefront Hero" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No hero image configured</div>
            )}
          </div>
          <div className="flex-1 text-left space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#FFD166] border-2 border-slate-900 text-slate-900 rounded-[6px] text-[10px] font-black shadow-[2px_2px_0px_#0f172a] select-none uppercase">
                Active Storefront Hero
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Current Storefront Hero Banner</h3>
            <p className="text-xs font-bold text-slate-500 max-w-md leading-relaxed">
              This landscape image is displayed at the top of your storefront. You can select any product's image to become the hero banner below.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[10px] sm:text-xs font-bold">
              <span>📏 Required dimension: 1200 x 500 px (Landscape aspect ratio)</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={openAddModal}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-[#E0FF4F] border-2 border-slate-900 text-slate-900 rounded-full shadow-[4px_4px_0px_#0f172a] flex items-center justify-center z-30 active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"
      >
        <Plus weight="bold" className="w-6 h-6" />
      </button>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 rounded-[12px] w-full max-w-md border-2 border-slate-300"></div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-200 rounded-[24px] border-2 border-slate-300"></div>)}
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-slate-100 border-2 border-slate-900 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0px_#0f172a]">
            <Package weight="bold" className="w-10 h-10 text-slate-900" />
          </div>
          <h3 className="text-2xl font-display font-black text-slate-900 mb-2">No products yet</h3>
          <p className="text-sm font-bold text-slate-500 mb-8 max-w-sm">Add your first product to start taking orders.</p>
          <button onClick={openAddModal} className="bg-slate-900 text-white px-6 py-3 rounded-[12px] font-bold border-2 border-slate-900 shadow-[4px_4px_0px_#E0FF4F] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">
            Add First Product
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8 relative max-w-md">
            <MagnifyingGlass weight="bold" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-900 rounded-[12px] shadow-[4px_4px_0px_#0f172a] font-bold placeholder-slate-400 focus:outline-none focus:bg-[#E0FF4F] transition-colors text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProducts.map(product => {
              const isHeroImage = product.imageUrl && activeHeroUrl === product.imageUrl;
              return (
                <div
                  key={product.id}
                  className="glass-panel overflow-hidden flex flex-col group cursor-pointer hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0px_#0f172a] transition-all"
                  onClick={() => openEditModal(product)}
                >
                  <div className="h-32 md:h-48 bg-slate-100 border-b-2 border-slate-900 relative overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="text-4xl select-none text-slate-300 group-hover:scale-110 transition-transform duration-500">
                        {registry?.icon ?? '📦'}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      {product.stockCount !== undefined && product.stockCount <= 5 && (
                        <span className="px-2 py-1 bg-[#FF6666] border-2 border-slate-900 text-white rounded-[8px] text-[10px] md:text-xs font-black shadow-[2px_2px_0px_#0f172a] select-none">
                          {product.stockCount === 0 ? 'SOLD OUT' : `${product.stockCount} LEFT`}
                        </span>
                      )}
                    </div>
                    {isHeroImage && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-[#FFD166] border-2 border-slate-900 text-slate-900 rounded-[8px] text-[10px] md:text-xs font-black shadow-[2px_2px_0px_#0f172a] select-none">
                        ⭐ HERO IMAGE
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm md:text-base font-bold text-slate-900 line-clamp-1 mb-1">{product.name}</h3>
                    <div className="text-lg md:text-xl font-black text-slate-900 mb-3">{formatNaira(product.price)}</div>

                    {product.attributes && Object.keys(product.attributes).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Object.entries(product.attributes).map(([key, val]) => val && (
                          <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 border-2 border-slate-900 text-slate-900 rounded-[8px] text-[10px] md:text-xs font-bold shadow-[2px_2px_0px_#0f172a]">
                            <Tag weight="fill" className="w-3 h-3" />
                            {val}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto space-y-2">
                      <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <span className="text-xs md:text-sm font-bold text-slate-600">Available</span>
                        <button 
                          className={`w-12 h-7 rounded-full border-2 border-slate-900 relative transition-colors shadow-sm ${product.isAvailable ? 'bg-[#10B981]' : 'bg-slate-200'}`}
                          onClick={(e) => { e.stopPropagation(); handleToggleAvailable(product, !product.isAvailable); }}
                        >
                          <div className={`absolute top-0.5 bottom-0.5 w-5 h-5 bg-white border-2 border-slate-900 rounded-full transition-transform ${product.isAvailable ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
                        </button>
                      </div>

                      {product.imageUrl && (
                        <div className="pt-2 flex flex-col gap-1 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs md:text-sm font-bold text-slate-600">Storefront Hero</span>
                            <div className="flex items-center gap-1.5">
                              {/* Reset to default — only shown when a custom hero is active */}
                              {isHeroImage && activeHeroUrl !== DEFAULT_HERO_IMAGE_URL && (
                                <button
                                  type="button"
                                  onClick={async (e) => { e.stopPropagation(); await handleResetHero(); }}
                                  className="px-2.5 py-1 text-[10px] md:text-xs font-black rounded-lg border-2 border-slate-900 bg-white text-slate-500 shadow-[2px_2px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all"
                                >
                                  Reset
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (business) {
                                    try {
                                      const updated = await businessService.updateBusiness(business.id, {
                                        themeConfig: {
                                          ...business.themeConfig,
                                          heroImageUrl: product.imageUrl
                                        }
                                      });
                                      if (updated) {
                                        setBusiness(updated);
                                        addToast('Set as storefront hero image!', 'success');
                                        const channel = new BroadcastChannel('theme_updates');
                                        channel.postMessage({
                                          type: 'theme_changed',
                                          slug: business.storefrontSlug,
                                          theme: business.theme,
                                          themeConfig: {
                                            ...business.themeConfig,
                                            heroImageUrl: product.imageUrl
                                          }
                                        });
                                        channel.close();
                                      }
                                    } catch {
                                      addToast('Failed to update storefront hero image', 'error');
                                    }
                                  }
                                }}
                                className={`px-2.5 py-1 text-[10px] md:text-xs font-black rounded-lg border-2 border-slate-900 transition-all ${
                                  isHeroImage
                                    ? 'bg-[#FFD166] text-slate-900 shadow-sm cursor-default'
                                    : 'bg-white text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none'
                                }`}
                                disabled={isHeroImage}
                              >
                                {isHeroImage ? 'Current Hero' : 'Use as Hero'}
                              </button>
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold self-end">
                            Required size: 1200 x 500 px
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && searchQuery && (
            <div className="text-center py-12 rounded-[24px] border-2 border-slate-900 border-dashed bg-slate-50 font-bold text-slate-500 mt-6">
              No products found matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        businessId={businessId}
        businessCategory={business?.category ?? ''}
        storefrontSlug={business?.storefrontSlug ?? ''}
        onSaved={loadProducts}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Product?" theme="brutal" headerClassName="bg-[#FF6666]">
        <div className="p-2 md:p-4 text-center">
          <div className="w-16 h-16 bg-[#FF6666] border-2 border-slate-900 text-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-[4px_4px_0px_#0f172a]">
            <Trash weight="bold" className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-slate-700 mb-8 pb-4">
            This action cannot be undone. Are you sure you want to delete <span className="font-black text-slate-900">{editingProduct?.name}</span>?
          </p>
          <div className="flex gap-3">
            <button className="flex-1 bg-white text-slate-900 font-bold py-3.5 rounded-[12px] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] transition-all" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button
              className="flex-1 bg-[#FF6666] text-white font-bold py-3.5 rounded-[12px] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] transition-all"
              onClick={async () => {
                if (editingProduct) {
                  await productService.deleteProduct(editingProduct.id);
                  addToast('Product deleted', 'success');
                  if (business) {
                    const channel = new BroadcastChannel('inventory_updates');
                    channel.postMessage({ type: 'inventory_changed', slug: business.storefrontSlug });
                    channel.close();
                  }
                  setIsDeleteModalOpen(false);
                  setIsModalOpen(false);
                  loadProducts();
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  businessId: string;
  businessCategory: string;
  storefrontSlug: string;
  onSaved: () => void;
  onDelete: () => void;
}

function ProductFormModal({ isOpen, onClose, product, businessId, businessCategory, storefrontSlug, onSaved, onDelete }: ProductFormModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const registry = getRegistry(businessCategory);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (product) {
        reset({
          name: product.name,
          price: product.price,
          description: product.description || '',
          isAvailable: product.isAvailable,
          trackStock: product.stockCount !== undefined,
          stockCount: product.stockCount,
          attributes: product.attributes || {},
        });
        setImagePreview(product.imageUrl || null);
        setAttributes(product.attributes || {});
      } else {
        reset({
          name: '',
          price: undefined as any,
          description: '',
          isAvailable: true,
          trackStock: false,
          stockCount: undefined,
          attributes: {},
        });
        setImagePreview(null);
        setAttributes({});
      }
    }
  }, [isOpen, product, reset]);

  const trackStock = watch('trackStock');

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 400;
          let w = img.width, h = img.height;
          if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
          else { if (h > MAX) { w *= MAX / h; h = MAX; } }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const b64 = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(b64);
          setValue('imageUrl', b64, { shouldDirty: true });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttributeChange = (key: string, value: string) => {
    const updated = { ...attributes, [key]: value };
    setAttributes(updated);
    setValue('attributes', updated, { shouldDirty: true });
  };

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm('Discard changes?')) return;
    }
    onClose();
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        businessId,
        imageUrl: imagePreview || undefined,
        stockCount: data.trackStock ? data.stockCount : undefined,
        attributes,
      };
      if (product) {
        await productService.updateProduct(product.id, payload);
        addToast('Product updated', 'success');
      } else {
        await productService.createProduct(payload);
        addToast('Product added', 'success');
      }
      
      const channel = new BroadcastChannel('inventory_updates');
      channel.postMessage({ type: 'inventory_changed', slug: storefrontSlug });
      channel.close();
      
      onSaved();
      onClose();
    } catch {
      addToast('Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={product ? 'Edit Product' : 'Add Product'} theme="brutal" headerClassName="bg-[#FFD166]">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 py-2">
        {/* Image upload */}
        <div className="relative w-full aspect-video sm:aspect-square max-h-48 rounded-[16px] border-4 border-slate-900 border-dashed bg-slate-50 flex items-center justify-center overflow-hidden hover:bg-[#E0FF4F] hover:border-solid transition-colors cursor-pointer group">
          {imagePreview ? (
            <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <span className="text-4xl group-hover:scale-110 transition-transform group-hover:text-slate-900">{registry?.icon || '📸'}</span>
              <span className="text-sm font-bold group-hover:text-slate-900 transition-colors">Tap to add photo</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={onImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </div>

        {/* Core fields */}
        <div>
          <label className="block font-bold text-slate-900 text-sm mb-1.5">Product Name</label>
          <input type="text" {...register('name')} className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]" placeholder="e.g. Vintage Leather Bag" />
          {errors.name?.message && <span className="text-xs font-bold text-red-500 mt-1.5 block">{errors.name?.message}</span>}
        </div>
        
        <div>
          <label className="block font-bold text-slate-900 text-sm mb-1.5">Price (₦)</label>
          <input 
            type="text" 
            value={watch('price') !== undefined && !isNaN(watch('price')) ? Number(watch('price')).toLocaleString() : ''}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setValue('price', val ? parseInt(val, 10) : undefined as any, { shouldValidate: true, shouldDirty: true });
            }}
            className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]" 
            placeholder="0" 
          />
          {errors.price?.message && <span className="text-xs font-bold text-red-500 mt-1.5 block">{errors.price?.message}</span>}
        </div>
        
        <div>
          <label className="block font-bold text-slate-900 text-sm mb-1.5">Description (Optional)</label>
          <textarea {...register('description')} className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F] min-h-[100px] resize-y" placeholder="Describe your product..." />
          {errors.description?.message && <span className="text-xs font-bold text-red-500 mt-1.5 block">{errors.description?.message}</span>}
        </div>

        {/* Category-specific attribute fields */}
        {registry && registry.fields.length > 0 && (
          <div className="rounded-[16px] border-2 border-slate-900 p-5 bg-slate-50 flex flex-col gap-4 shadow-inner">
            <p className="text-xs font-black text-slate-900 uppercase tracking-wide border-b-2 border-slate-200 pb-2 flex items-center gap-2">
              {registry.icon} {registry.categoryLabel} Details
            </p>
            {registry.fields.map((field: AttributeField) => (
              field.type === 'select' ? (
                <div key={field.key}>
                  <label className="block font-bold text-slate-900 text-sm mb-1.5">{field.label}</label>
                  <select
                    value={attributes[field.key] || ''}
                    onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                    className="w-full px-3 py-3 bg-white border-2 border-slate-200 rounded-[12px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:shadow-[4px_4px_0px_#E0FF4F] cursor-pointer"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div key={field.key}>
                  <label className="block font-bold text-slate-900 text-sm mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={attributes[field.key] || ''}
                    onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                    className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]"
                  />
                </div>
              )
            ))}
          </div>
        )}

        {/* Stock and availability toggles */}
        <div className="border-t-2 border-slate-100 pt-4 flex flex-col gap-4 mt-2">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="font-bold text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Available for sale</span>
            <input type="checkbox" className="hidden" checked={!!watch('isAvailable')} onChange={(e) => setValue('isAvailable', e.target.checked, { shouldDirty: true })} />
            <div className={`w-12 h-7 rounded-full border-2 border-slate-900 relative transition-colors shadow-sm ${!!watch('isAvailable') ? 'bg-[#10B981]' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 bottom-0.5 w-5 h-5 rounded-full bg-white border-2 border-slate-900 transition-transform ${!!watch('isAvailable') ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
            </div>
          </label>
          
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="font-bold text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Track stock?</span>
            <input type="checkbox" className="hidden" checked={!!watch('trackStock')} onChange={(e) => setValue('trackStock', e.target.checked, { shouldDirty: true })} />
            <div className={`w-12 h-7 rounded-full border-2 border-slate-900 relative transition-colors shadow-sm ${!!watch('trackStock') ? 'bg-[#E0FF4F]' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 bottom-0.5 w-5 h-5 rounded-full bg-white border-2 border-slate-900 transition-transform ${!!watch('trackStock') ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
            </div>
          </label>
          
          {trackStock && (
            <div className="mt-1">
              <input type="number" placeholder="Stock count" {...register('stockCount', { valueAsNumber: true })} className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]" />
              {errors.stockCount?.message && <span className="text-xs font-bold text-red-500 mt-1.5 block">{errors.stockCount?.message}</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3">
          <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-[12px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50">
            {isSubmitting ? 'Saving...' : product ? 'Save Changes' : 'Add Product'}
          </button>
          {product && (
            <button
              type="button"
              onClick={onDelete}
              className="font-bold text-sm text-red-600 bg-white hover:bg-red-50 py-3.5 rounded-[12px] transition-colors border-2 border-red-600 shadow-[2px_2px_0px_#EF4444]"
            >
              Delete Product
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
