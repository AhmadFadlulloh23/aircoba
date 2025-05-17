import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { GenkitClientProvider } from '@/components/GenkitClientProvider';

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'AquaGuard - Water Quality Monitoring',
  description: 'Monitor water quality parameters and get AI-powered insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GenkitClientProvider>
          {children}
          <Toaster />
        </GenkitClientProvider>
      </body>
    </html>
  );
}
