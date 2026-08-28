import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'GetCloser',
  description: 'WhatsApp AI lead qualification dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="bg-gray-950 text-white flex h-screen">
        <Providers>
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
