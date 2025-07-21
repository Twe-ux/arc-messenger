import { ClientProviders } from '@/providers/ClientProviders';
import { BodyTheme } from '@/components/BodyTheme';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Arc Messenger',
  description:
    'Modern messaging app with Arc Browser design and WhatsApp functionality',
  keywords: ['messaging', 'chat', 'email', 'Arc Browser', 'WhatsApp'],
  authors: [{ name: 'Arc Messenger Team' }],
};

export const viewport = {
  height: 'device-height',
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedColor = localStorage.getItem('arc-messenger-background-color');
                  const color = savedColor || 'rgb(216, 180, 254)';
                  document.documentElement.style.backgroundColor = color;
                  if (document.body) {
                    document.body.style.backgroundColor = color;
                  }
                } catch (e) {
                  document.documentElement.style.backgroundColor = 'rgb(216, 180, 254)';
                }
              })();
            `
          }}
        />
      </head>
      <body
        className={inter.className}
        style={{ margin: 0, padding: 0, overflow: 'hidden' }}
      >
        <ClientProviders>
          <BodyTheme />
          {children}
          <div id="modal-root" />
          <div id="toast-root" />
        </ClientProviders>
      </body>
    </html>
  );
}
