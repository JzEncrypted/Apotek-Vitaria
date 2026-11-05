import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FAIcon } from '../components/common/FAIcon';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <FAIcon name="circleCheck" className="text-[#4E9B69] text-base" />;
      case 'warning':
        return <FAIcon name="alert" className="text-[#D99B42] text-base" />;
      case 'danger':
        return <FAIcon name="circleAlert" className="text-[#D96A68] text-base" />;
      case 'info':
      default:
        return <FAIcon name="info" className="text-[#648BB7] text-base" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-[#4E9B69]/30 bg-white/95 text-[#26382B]';
      case 'warning':
        return 'border-[#D99B42]/30 bg-white/95 text-[#26382B]';
      case 'danger':
        return 'border-[#D96A68]/30 bg-white/95 text-[#26382B]';
      case 'info':
      default:
        return 'border-[#648BB7]/30 bg-white/95 text-[#26382B]';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-[90%] max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-soft-lg border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${getBorderColor(
              toast.type
            )}`}
          >
            <div className="shrink-0">{getToastIcon(toast.type)}</div>
            <p className="text-xs font-semibold leading-relaxed flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#778477] hover:text-[#26382B] p-1 text-xs"
              aria-label="Tutup"
            >
              <FAIcon name="close" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
