import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  show: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export function Toast({ show, onClose, children }: ToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-2 right-2 z-10"
        >
          <div className="rounded-md bg-[#0b3b2f] border border-[#10b981]/40 text-[#d1fae5] text-xs px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div>{children}</div>
              {onClose && (
                <button
                  aria-label="Close notification"
                  onClick={onClose}
                  className="text-[#a7f3d0] hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


