'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function ToastProvider() {
  const { toasts } = useToast();
  return <ToastContainer toasts={toasts} />;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastProvider />
      </QueryClientProvider>
    </SessionProvider>
  );
}