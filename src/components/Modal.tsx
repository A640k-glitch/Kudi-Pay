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
              relative flex flex-col bg-white
              ${isDrawer 
                ? 'absolute right-0 top-0 h-full w-full max-w-md border-l-[4px] border-black' 
                : 'w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-lg border-0 sm:border-[4px] border-black sm:shadow-[8px_8px_0px_rgba(0,0,0,1)]'
              }
            `}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 sm:px-6 py-4 shrink-0 ${title ? 'border-b-[4px] border-black bg-[#E0FF4F]' : ''}`}>
              {title && <h2 className="text-xl sm:text-2xl font-black uppercase text-black tracking-tight">{title}</h2>}
              <button
                onClick={onClose}
                className="bg-white border-[3px] border-black p-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ml-auto"
              >
                <X className="h-5 w-5 text-black" strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 bg-[#FDFBF7]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
