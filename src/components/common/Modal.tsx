/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#242326]/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Surface */}
      <div className="relative w-full sm:max-w-lg bg-[#F6F2EC] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#242326]/10 max-h-[90vh] overflow-hidden flex flex-col z-10 animate-slideUp">
        {/* Mobile Grab Handle */}
        <div className="sm:hidden w-12 h-1 bg-[#242326]/20 rounded-full mx-auto my-2.5" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-[#242326]/8">
          <div>
            {title && (
              <h3 className="text-lg font-serif font-medium text-[#242326] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#5C585E] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#242326]/70 hover:text-[#242326] hover:bg-[#E5CDBE]/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto no-scrollbar">{children}</div>
      </div>
    </div>
  );
};
