import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { Navigation } from '@/components/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PHANTOM | Confidential DeFi Intelligence',
  description: 'Privacy-preserving portfolio analysis and strategy execution powered by iExec TEE',
  keywords: ['DeFi', 'Privacy', 'Portfolio', 'iExec', 'TEE', 'Confidential Computing'],
  authors: [{ name: 'PHANTOM Team' }],
  openGraph: {
    title: 'PHANTOM | Confidential DeFi Intelligence',
    description: 'Privacy-preserving portfolio analysis and strategy execution powered by iExec TEE',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-phantom-darker min-h-screen`}>
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            {/* Background effects */}
            <div className="fixed inset-0 bg-gradient-radial from-phantom-purple/10 via-transparent to-transparent pointer-events-none" />
            <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />
            
            <Navigation />
            <main className="flex-1 relative z-10">
              {children}
            </main>
            
            <footer className="border-t border-white/10 py-6 px-4 text-center text-sm text-gray-500">
              <p>Built with iExec TEE for Hack4Privacy 2026</p>
            </footer>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
