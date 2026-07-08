import React from 'react';
import { ShoppingBag, Minus, Plus, Trash2, X, ArrowRight } from 'lucide-react';
import { Business } from '../lib/types';
import { useCartStore } from '../lib/store';
import { formatNaira } from '../lib/utils';

interface CartDrawerProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ business, isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-[#1E1B4B]" />
            <h2 className="text-lg font-bold text-[#1E1B4B]">Your Cart</h2>
            {items.length > 0 && (
              <span className="w-6 h-6 rounded-full bg-[#1E1B4B] text-white text-xs font-bold flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
              <button
                onClick={onClose}
                className="px-6 h-12 rounded-xl font-bold text-white bg-[#1E1B4B] hover:bg-[#312E81] transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.productId} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{item.productName}</h3>
                      <button 
                        onClick={() => removeItem(item.productId)}
                        className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-sm text-gray-900">{formatNaira(item.unitPrice)}</span>
                      
                      <div className="flex items-center rounded-lg border border-gray-200 p-1 bg-white">
                        <button 
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-xl font-bold text-gray-900">{formatNaira(getTotal())}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full flex items-center justify-center gap-2 px-6 h-14 rounded-xl font-bold text-white bg-[#1E1B4B] hover:bg-[#312E81] transition-colors"
            >
              Checkout <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
