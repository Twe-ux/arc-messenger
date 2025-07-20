import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/providers/ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Arc Messenger',
  description: 'Modern messaging app with Arc Browser design and WhatsApp functionality',
  keywords: ['messaging', 'chat', 'email', 'Arc Browser', 'WhatsApp'],
  authors: [{ name: 'Arc Messenger Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>
          <div id="root">{children}</div>
          <div id="modal-root" />
          <div id="toast-root" />
        </ClientProviders>
      </body>
    </html>
  );
}