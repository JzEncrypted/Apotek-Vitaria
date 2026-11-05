import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FAIcon } from './FAIcon';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[88vh]'
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  // Prevent background page from scrolling when bottom sheet is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    } else {
      setDragOffset(0);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Touch drag handlers on the top handle only
  const handleHandleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };

  const handleHandleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || startYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    // Only allow downward drag
    if (diff > 0) {
      if (e.cancelable) e.preventDefault(); // Stop native page rubberbanding
      setDragOffset(diff);
    }
  };

  const handleHandleTouchEnd = () => {
    if (dragOffset > 75) {
      onClose();
    }
    setDragOffset(0);
    isDraggingRef.current = false;
    startYRef.current = null;
  };

  const sheetContent = (
    <div
      className="fixed inset-0 z-[999] flex flex-col justify-end overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Backdrop with touchmove prevention */}
      <div
        onClick={onClose}
        onTouchMove={(e) => {
          if (e.cancelable) e.preventDefault();
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in cursor-pointer"
      />

      {/* Sheet Modal Container */}
      <div
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDraggingRef.current
            ? 'none'
            : 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)',
          touchAction: 'pan-y'
        }}
        className={`relative z-10 w-full max-w-md mx-auto bg-white rounded-t-[32px] shadow-2xl border-t border-[#E7EBE4] flex flex-col ${maxHeight} overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out`}
      >
        {/* iOS / Android Drag Handle - Strictly controls downward pull without scrolling the page */}
        <div
          onTouchStart={handleHandleTouchStart}
          onTouchMove={handleHandleTouchMove}
          onTouchEnd={handleHandleTouchEnd}
          style={{ touchAction: 'none' }}
          className="w-full pt-3.5 pb-2.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none group shrink-0"
        >
          <div className="w-12 h-1.5 bg-[#CBD5C8] group-hover:bg-[#84A282] rounded-full transition-colors pointer-events-none" />
          <span className="text-[10px] text-[#778477]/70 group-hover:text-[#587A58] mt-1 font-semibold transition-colors pointer-events-none">
            Tarik ke bawah untuk menutup
          </span>
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="px-5 py-2.5 border-b border-[#E7EBE4]/80 flex items-center justify-between shrink-0 bg-white">
            <div className="pr-4">
              {title && (
                <h3 className="font-extrabold text-[#26382B] text-base leading-snug">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] text-[#778477] mt-0.5 line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F0F5ED] hover:bg-[#E6EEE3] text-[#778477] hover:text-[#26382B] flex items-center justify-center transition-colors shrink-0 btn-press"
              aria-label="Tutup"
            >
              <FAIcon name="close" className="text-xs" />
            </button>
          </div>
        )}

        {/* Sheet Content Scroll Area - Strictly contained with overscroll-contain & touch-action pan-y */}
        <div
          className="p-5 overflow-y-auto flex-1 min-h-0 overscroll-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            overscrollBehaviorY: 'contain'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(sheetContent, document.body)
    : sheetContent;
};

export default BottomSheet;
