import React, { useState, useEffect } from 'react';
import { Plus, Search, PackageX, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { productService } from '../../lib/services/productService';
import BrutalButton from '../../components/ui/BrutalButton';
import { Modal } from '../../components/Modal';
import { formatNaira } from '../../lib/utils';
import { productSchema } from '../../lib/validation/schemas';
import { useToast } from '../../components/Toast';
import { getRegistry, AttributeField } from '../../lib/config/productRegistries';
import type { Business } from '../../lib/types';

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
      setBusiness(b);
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const registry = business ? getRegistry(business.category) : null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-10 selection:bg-[#E0FF4F] selection:text-black">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-[4px] border-black pb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-black uppercase mb-1">Products</h1>
          {registry && (
            <p className="text-sm md:text-base font-bold text-gray-700 uppercase flex items-center gap-2">
              <span>{registry.icon}</span>
              <span>{registry.categoryLabel} details active</span>
            </p>
          )}
        </div>
        <div className="hidden md:block">
          <BrutalButton onClick={openAddModal}>
            <Plus className="w-5 h-5 mr-2 inline-block" /> ADD PRODUCT
          </BrutalButton>
        </div>
      </header>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={openAddModal}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-[#E0FF4F] text-black border-[3px] border-black rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center z-30 active:translate-y-1 active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
      >
        <Plus className="w-6 h-6" strokeWidth={3} />
      </button>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-14 bg-gray-200 border-[3px] border-black w-full max-w-md"></div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-200 border-[4px] border-black"></div>)}
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border-[4px] border-black p-10 text-center shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <PackageX className="w-16 h-16 mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="text-2xl font-black uppercase mb-2">No products yet</h3>
          <p className="text-sm font-bold uppercase text-gray-600 mb-6">Add your first product to start taking orders.</p>
          <BrutalButton onClick={openAddModal}>ADD FIRST PRODUCT</BrutalButton>
        </div>
      ) : (
        <>
          <div className="mb-8 relative max-w-md">
            <Search className="w-6 h-6 absolute left-3 top-1/2 -translate-y-1/2 text-black" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="SEARCH PRODUCTS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] font-black uppercase placeholder-gray-500 focus:outline-none focus:bg-[#E0FF4F] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white border-[4px] border-black overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col group cursor-pointer hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                onClick={() => openEditModal(product)}
              >
                <div className="h-32 md:h-48 bg-gray-100 border-b-[4px] border-black relative overflow-hidden flex items-center justify-center">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="text-4xl select-none group-hover:scale-110 transition-transform">
                      {registry?.icon ?? '📦'}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    {product.stockCount !== undefined && product.stockCount <= 5 && (
                      <span className="px-2 py-1 bg-[#FFD166] border-[2px] border-black text-[10px] md:text-xs font-black uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] select-none">
                        {product.stockCount === 0 ? 'SOLD OUT' : `${product.stockCount} LEFT`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 md:p-4 flex-1 flex flex-col bg-white">
                  <h3 className="text-sm md:text-base font-black text-black uppercase line-clamp-1 mb-1">{product.name}</h3>
                  <div className="text-lg md:text-xl font-black text-black mb-3">{formatNaira(product.price)}</div>

                  {product.attributes && Object.keys(product.attributes).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(product.attributes).map(([key, val]) => val && (
                        <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border-[2px] border-black text-[10px] md:text-xs font-black uppercase text-black">
                          <Tag className="w-3 h-3" />
                          {val}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t-[3px] border-black flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="text-xs md:text-sm font-black uppercase">Available</span>
                    <button 
                      className={`w-12 h-6 border-[3px] border-black relative transition-colors ${product.isAvailable ? 'bg-[#E0FF4F]' : 'bg-gray-300'}`}
                      onClick={(e) => { e.stopPropagation(); handleToggleAvailable(product, !product.isAvailable); }}
                    >
                      <div className={`absolute top-0.5 bottom-0.5 w-4 bg-black transition-transform ${product.isAvailable ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && searchQuery && (
            <div className="text-center py-12 border-[4px] border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] font-black uppercase">
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
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Product?">
        <div className="p-2 md:p-4 text-center">
          <div className="w-16 h-16 bg-[#FF6666] border-[3px] border-black text-white flex items-center justify-center mb-4 mx-auto rotate-12 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <PackageX className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <p className="text-sm font-bold uppercase text-gray-700 mb-8 pb-4">
            This action cannot be undone. Are you sure you want to delete {editingProduct?.name}?
          </p>
          <div className="flex gap-4">
            <BrutalButton variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>CANCEL</BrutalButton>
            <BrutalButton
              color="#FF6666"
              className="flex-1 text-white"
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
              DELETE
            </BrutalButton>
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
    <Modal isOpen={isOpen} onClose={handleClose} title={product ? 'EDIT PRODUCT' : 'ADD PRODUCT'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 py-2">
        {/* Image upload */}
        <div className="relative w-full aspect-video sm:aspect-square max-h-48 border-[4px] border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden hover:bg-[#E0FF4F] transition-colors cursor-pointer group">
          {imagePreview ? (
            <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-black">
              <span className="text-4xl group-hover:scale-110 transition-transform">{registry?.icon || '📸'}</span>
              <span className="text-sm font-black uppercase">Tap to add photo</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={onImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </div>

        {/* Core fields */}
        <div>
          <label className="block font-black uppercase text-xs mb-2">Product Name</label>
          <input type="text" {...register('name')} className="w-full border-[3px] border-black p-3 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors" />
          {errors.name?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.name?.message}</span>}
        </div>
        
        <div>
          <label className="block font-black uppercase text-xs mb-2">Price (₦)</label>
          <input type="number" {...register('price', { valueAsNumber: true })} className="w-full border-[3px] border-black p-3 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors" />
          {errors.price?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.price?.message}</span>}
        </div>
        
        <div>
          <label className="block font-black uppercase text-xs mb-2">Description (Optional)</label>
          <textarea {...register('description')} className="w-full border-[3px] border-black p-3 font-bold outline-none focus:bg-[#E0FF4F] transition-colors min-h-[100px] resize-y" />
          {errors.description?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.description?.message}</span>}
        </div>

        {/* Category-specific attribute fields */}
        {registry && registry.fields.length > 0 && (
          <div className="border-[4px] border-black p-4 bg-gray-50 flex flex-col gap-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-black uppercase border-b-[3px] border-black pb-2 text-black">
              {registry.icon} {registry.categoryLabel} Details
            </p>
            {registry.fields.map((field: AttributeField) => (
              field.type === 'select' ? (
                <div key={field.key}>
                  <label className="block text-xs font-black uppercase mb-1">{field.label}</label>
                  <select
                    value={attributes[field.key] || ''}
                    onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                    className="w-full px-3 py-3 bg-white border-[3px] border-black font-bold uppercase focus:outline-none focus:bg-[#E0FF4F] cursor-pointer appearance-none"
                  >
                    <option value="">SELECT {field.label.toUpperCase()}</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div key={field.key}>
                  <label className="block text-xs font-black uppercase mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder?.toUpperCase()}
                    value={attributes[field.key] || ''}
                    onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                    className="w-full px-3 py-3 bg-white border-[3px] border-black font-bold uppercase focus:outline-none focus:bg-[#E0FF4F]"
                  />
                </div>
              )
            ))}
          </div>
        )}

        {/* Stock and availability toggles */}
        <div className="border-t-[4px] border-black pt-4 flex flex-col gap-4 mt-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-black uppercase text-sm">Available for sale</span>
            <input type="checkbox" className="hidden" checked={watch('isAvailable')} onChange={(e) => setValue('isAvailable', e.target.checked, { shouldDirty: true })} />
            <div className={`w-14 h-8 border-[3px] border-black relative transition-colors ${watch('isAvailable') ? 'bg-[#E0FF4F]' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 bottom-0.5 w-6 bg-black transition-transform ${watch('isAvailable') ? 'translate-x-[26px]' : 'translate-x-0.5'}`} />
            </div>
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-black uppercase text-sm">Track stock?</span>
            <input type="checkbox" className="hidden" checked={watch('trackStock')} onChange={(e) => setValue('trackStock', e.target.checked, { shouldDirty: true })} />
            <div className={`w-14 h-8 border-[3px] border-black relative transition-colors ${watch('trackStock') ? 'bg-[#4D9DE0]' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 bottom-0.5 w-6 bg-black transition-transform ${watch('trackStock') ? 'translate-x-[26px]' : 'translate-x-0.5'}`} />
            </div>
          </label>
          
          {trackStock && (
            <div className="mt-2">
              <input type="number" placeholder="STOCK COUNT" {...register('stockCount', { valueAsNumber: true })} className="w-full border-[3px] border-black p-3 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors" />
              {errors.stockCount?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.stockCount?.message}</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3">
          <BrutalButton type="submit" className="w-full h-14" isLoading={isSubmitting}>
            {product ? 'SAVE PRODUCT' : 'ADD PRODUCT'}
          </BrutalButton>
          {product && (
            <button
              type="button"
              onClick={onDelete}
              className="font-black uppercase text-sm border-[3px] border-black bg-[#FF6666] text-white py-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              DELETE PRODUCT
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
