import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Edit2, PackageX } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { productService } from '../../lib/services/productService';
import { Button } from '../../components/Button';
import { Input, Textarea, Toggle } from '../../components/FormInputs';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { formatNaira } from '../../lib/utils';
import { productSchema } from '../../lib/validation/schemas';
import { useToast } from '../../components/Toast';

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
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
      setBusinessId(b.id);
      const p = await productService.getProducts(b.id);
      setProducts(p);
    }
    setIsLoading(false);
  }

  const handleToggleAvailable = async (product: Product) => {
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p));
    try {
      await productService.updateProduct(product.id, { isAvailable: !product.isAvailable });
    } catch (error) {
      // Revert on error
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: p.isAvailable } : p));
      addToast('Failed to update availability', 'error');
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-3 md:p-4 max-w-5xl mx-auto pb-24 md:pb-10">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Products</h1>
          <p className="text-gray-500">Manage what you sell.</p>
        </div>
        <Button onClick={openAddModal} className="hidden md:flex">
          <Plus className="w-5 h-5 mr-2" /> Add Product
        </Button>
      </header>

      {/* Floating Action Button (Mobile) */}
      <button 
        onClick={openAddModal}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded-xl w-full max-w-md"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>)}
          </div>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<PackageX className="w-10 h-10" />}
          title="No products yet"
          description="Add your first product to start taking orders."
          actionLabel="Add Your First Product"
          onAction={openAddModal}
        />
      ) : (
        <>
          <div className="mb-6 relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col group cursor-pointer" onClick={() => openEditModal(product)}>
                <div className="h-48 bg-gray-100 relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <PackageX className="w-8 h-8 opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {product.stockCount !== undefined && product.stockCount <= 5 && (
                      <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-bold text-accent-dark rounded border border-gray-200/50 shadow-sm">
                        {product.stockCount === 0 ? 'Out of stock' : `${product.stockCount} left`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1 pr-2">{product.name}</h3>
                  </div>
                  <div className="font-bold text-gray-900 mb-4">{formatNaira(product.price)}</div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="text-sm font-medium text-gray-600">Available</span>
                    <Toggle 
                      checked={product.isAvailable} 
                      onChange={() => handleToggleAvailable(product)} 
                      label=""
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredProducts.length === 0 && searchQuery && (
            <div className="text-center py-12 text-gray-500">
              No products found matching "{searchQuery}"
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
        onSaved={loadProducts}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="py-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-destructive flex items-center justify-center mb-4 mx-auto">
            <PackageX className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-center mb-2">Delete Product?</h3>
          <p className="text-gray-500 text-center mb-6">This action cannot be undone. Are you sure you want to delete {editingProduct?.name}?</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={async () => {
                if (editingProduct) {
                  await productService.deleteProduct(editingProduct.id);
                  addToast('Product deleted', 'success');
                  setIsDeleteModalOpen(false);
                  setIsModalOpen(false);
                  loadProducts();
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Subcomponent for the form modal to keep state clean
function ProductFormModal({ isOpen, onClose, product, businessId, onSaved, onDelete }: any) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

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
        });
        setImagePreview(product.imageUrl || null);
      } else {
        reset({
          name: '',
          price: undefined as any,
          description: '',
          isAvailable: true,
          trackStock: false,
          stockCount: undefined,
        });
        setImagePreview(null);
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
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64String = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(base64String);
          setValue('imageUrl', base64String, { shouldDirty: true });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm("Discard changes?")) return;
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
      };

      if (product) {
        await productService.updateProduct(product.id, payload);
        addToast('Product updated', 'success');
      } else {
        await productService.createProduct(payload);
        addToast('Product added', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      addToast('Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={product ? "Edit Product" : "Add Product"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 py-2">
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="relative w-full aspect-video sm:aspect-square max-h-48 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-sm font-medium text-center">Tap to add photo</span>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={onImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <Input
          label="Product Name"
          {...register('name')}
          error={errors.name?.message}
        />

        <Input
          label="Price (₦)"
          type="number"
          {...register('price', { valueAsNumber: true })}
          error={errors.price?.message}
        />

        <Textarea
          label="Description (Optional)"
          {...register('description')}
          error={errors.description?.message}
        />

        <div className="border-t border-gray-100 pt-4 mt-2 flex flex-col gap-2">
          <Toggle
            label="Available for sale"
            checked={watch('isAvailable')}
            onChange={(c) => setValue('isAvailable', c, { shouldDirty: true })}
          />
          <Toggle
            label="Track stock?"
            checked={trackStock}
            onChange={(c) => setValue('trackStock', c, { shouldDirty: true })}
          />
          {trackStock && (
            <div className="mt-2">
              <Input
                type="number"
                placeholder="Count"
                {...register('stockCount', { valueAsNumber: true })}
                error={errors.stockCount?.message}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {product ? "Save Product" : "Add Product"}
          </Button>
          
          {product && (
            <button 
              type="button" 
              onClick={onDelete}
              className="text-destructive font-medium py-3 hover:bg-red-50 rounded-xl transition-colors mt-2"
            >
              Delete Product
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
