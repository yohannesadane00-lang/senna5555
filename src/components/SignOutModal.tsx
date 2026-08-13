import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, X, AlertTriangle, Loader2 } from 'lucide-react';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disable background scrolling when modal is open & handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  const handleConfirmSignOut = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop with dark semi-transparent tint & backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card with scale-in animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.25, bounce: 0.05 }}
            className="relative w-full max-w-md bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 z-10 text-gray-900 dark:text-gray-100 overflow-hidden"
          >
            {/* Top Close Button */}
            <button
              onClick={() => {
                if (!isSubmitting) onClose();
              }}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-900 p-1.5 rounded-xl transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 w-full">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  Sign Out
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Are you sure you want to sign out? Any unsaved changes will be lost.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-black hover:bg-gray-200 dark:hover:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all shadow-xs border border-rose-700 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
