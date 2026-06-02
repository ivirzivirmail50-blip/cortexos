import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '../context/theme-context';
import { ProviderProvider } from '../context/provider-context';

export const metadata: Metadata = {
  title: 'CortexOS',
  description: 'Kişisel AI İşletim Sistemi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ProviderProvider>
            {children}
          </ProviderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
