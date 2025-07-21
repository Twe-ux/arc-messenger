'use client';

import { forwardRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from './Button';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
  className?: string;
}

const variantConfig = {
  default: {
    icon: null,
    className: 'border-gray-200 bg-white text-gray-900',
  },
  success: {
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-900',
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-900',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-200 bg-yellow-50 text-yellow-900',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-900',
  },
};

const Toast = forwardRef<HTMLDivElement, ToastProps>(({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  action,
  onClose,
  className,
}, ref) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 200); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'group pointer-events-auto relative flex w-full max-w-sm items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all',
        config.className,
        className
      )}
    >
      <div className="flex items-start space-x-3 flex-1">
        {IconComponent && (
          <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
        )}
        
        <div className="flex-1 space-y-1">
          {title && (
            <div className="text-sm font-semibold">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm opacity-90">
              {description}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className="h-8 px-3 text-xs"
          >
            {action.label}
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-6 w-6 opacity-60 hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
});

Toast.displayName = 'Toast';

// Toast Container Component
export interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
}) => {
  if (typeof window === 'undefined') return null;

  const toastRoot = document.getElementById('toast-root');
  if (!toastRoot) return null;

  return createPortal(
    <div className={cn('fixed z-50 flex flex-col space-y-2', positionClasses[position])}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>,
    toastRoot
  );
};

// Toast Hook for easy usage
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: () => removeToast(id),
    };
    
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (message: string, options?: Partial<ToastProps>) =>
      addToast({ title: message, variant: 'success', ...options }),
    
    error: (message: string, options?: Partial<ToastProps>) =>
      addToast({ title: message, variant: 'error', ...options }),
    
    warning: (message: string, options?: Partial<ToastProps>) =>
      addToast({ title: message, variant: 'warning', ...options }),
    
    info: (message: string, options?: Partial<ToastProps>) =>
      addToast({ title: message, variant: 'info', ...options }),
    
    default: (message: string, options?: Partial<ToastProps>) =>
      addToast({ title: message, variant: 'default', ...options }),

    custom: (options: Omit<ToastProps, 'id' | 'onClose'>) => addToast(options),
  };

  return {
    toasts,
    toast,
    removeToast,
  };
}

export { Toast };