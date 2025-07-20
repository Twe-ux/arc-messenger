'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ToastContainer, ToastProps as UIToastProps } from '@/components/ui/Toast';

export interface ToastProps extends UIToastProps {}

type ToastOptions = Omit<ToastProps, 'id' | 'onClose'>;

interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: ToastOptions) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, options?: Partial<ToastOptions>) => string;
    error: (message: string, options?: Partial<ToastOptions>) => string;
    warning: (message: string, options?: Partial<ToastOptions>) => string;
    info: (message: string, options?: Partial<ToastOptions>) => string;
    default: (message: string, options?: Partial<ToastOptions>) => string;
    custom: (options: ToastOptions) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = (toast: ToastOptions) => {
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
    success: (message: string, options?: Partial<ToastOptions>) =>
      addToast({ title: message, variant: 'success', ...options }),
    
    error: (message: string, options?: Partial<ToastOptions>) =>
      addToast({ title: message, variant: 'error', ...options }),
    
    warning: (message: string, options?: Partial<ToastOptions>) =>
      addToast({ title: message, variant: 'warning', ...options }),
    
    info: (message: string, options?: Partial<ToastOptions>) =>
      addToast({ title: message, variant: 'info', ...options }),
    
    default: (message: string, options?: Partial<ToastOptions>) =>
      addToast({ title: message, variant: 'default', ...options }),

    custom: (options: ToastOptions) => addToast(options),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      {mounted && <ToastContainer toasts={toasts} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}