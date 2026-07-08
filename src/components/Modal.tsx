import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  isDrawer?: boolean;
  theme?: string;
  headerClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, isDrawer = false, theme = 'modern', headerClassName }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      const mainEl = document.getElementById('dashboard-main');
      if (mainEl) mainEl.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const mainEl = document.getElementById('dashboard-main');
      if (mainEl) mainEl.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const mainEl = document.getElementById('dashboard-main');
      if (mainEl) mainEl.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBrutal = theme === 'brutal';

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ touchAction: 'none' }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            ref={modalRef}
            initial={isDrawer ? { x: '100%' } : { y: '100%', sm: { y: 20, scale: 0.95 } }}
            animate={isDrawer ? { x: 0 } : { y: 0, sm: { y: 0, scale: 1 } }}
            exit={isDrawer ? { x: '100%' } : { y: '100%', sm: { y: 20, scale: 0.95 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              relative flex flex-col
              ${isDrawer 
                ? `absolute right-0 top-0 h-full w-full max-w-md ${isBrutal ? 'bg-white border-l-[4px] border-black' : 'bg-white/90 backdrop-blur-2xl border-l border-slate-200 shadow-2xl'}` 
                : `w-full h-auto max-h-[90vh] sm:max-h-[85vh] sm:max-w-lg ${isBrutal ? 'bg-white border-[4px] border-black rounded-t-[24px] sm:rounded-[24px] shadow-[0px_-8px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_rgba(0,0,0,1)]' : 'bg-white/90 backdrop-blur-2xl rounded-t-[24px] sm:rounded-2xl sm:shadow-[0_8px_32px_rgba(15,23,42,0.08)] sm:border border-slate-200/60 overflow-hidden'}`
              }
            `}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 sm:px-6 py-4 shrink-0 ${title ? (isBrutal ? `border-b-[4px] border-black ${headerClassName || 'bg-[#E0FF4F]'}` : `border-b border-slate-100 ${headerClassName || 'bg-white/50'}`) : ''}`}>
              {title && <h2 className={`text-xl sm:text-2xl ${isBrutal ? 'font-black uppercase text-black tracking-tight' : 'font-display font-bold text-primary'}`}>{title}</h2>}
              <button
                onClick={onClose}
                className={isBrutal ? "bg-white border-[3px] border-black p-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ml-auto rounded-xl" : "p-2 rounded-full hover:bg-slate-100 transition-colors ml-auto text-slate-500 hover:text-primary"}
              >
                <X className={`h-5 w-5 ${isBrutal ? 'text-black' : ''}`} strokeWidth={isBrutal ? 3 : 2} />
              </button>
            </div>
            
            <div className={`flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 ${isBrutal ? 'bg-[#FDFBF7]' : 'bg-transparent'}`}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
};
