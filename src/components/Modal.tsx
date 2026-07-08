import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  isDrawer?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, isDrawer = false }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            ref={modalRef}
            initial={isDrawer ? { x: '100%' } : { y: '100%', sm: { y: 20, scale: 0.95 } }}
            animate={isDrawer ? { x: 0 } : { y: 0, sm: { y: 0, scale: 1 } }}
            exit={isDrawer ? { x: '100%' } : { y: '100%', sm: { y: 20, scale: 0.95 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              relative flex flex-col bg-white shadow-xl
              ${isDrawer 
                ? 'absolute right-0 top-0 h-full w-full max-w-md rounded-l-2xl' 
                : 'w-full max-h-[90vh] sm:max-h-[85vh] sm:max-w-lg rounded-t-2xl sm:rounded-2xl'
              }
            `}
          >
            {/* Handle for mobile bottom sheet */}
            {!isDrawer && (
              <div className="flex w-full justify-center pt-2.5 pb-0.5 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-gray-200" />
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-4 border-b border-gray-100 shrink-0">
              {title && <h2 className="text-sm sm:text-lg font-semibold text-[#1E1B4B]">{title}</h2>}
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-gray-100 transition-colors ml-auto"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
