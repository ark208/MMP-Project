import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/lib/toast-context';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationsProvider } from '@/lib/notifications-context';
import { AppShell } from '@/components/layout/AppShell';
import { PwaRegister } from '@/components/pwa/PwaRegister';

export const metadata: Metadata = {
  title: 'CampusLoop - All-in-One Campus Platform',
  description:
    'CampusLoop unites Lost & Found with smart verification, Ride Splitting, Train Buddy Radar, and Campus Marketplace for verified students.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CampusLoop',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#B9573B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-[#B9573B] selection:text-white bg-[#F8F5F0] text-[#242424] dark:bg-[#171513] dark:text-[#F5F1EB]">
        <PwaRegister />
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationsProvider>
                <AppShell>{children}</AppShell>
              </NotificationsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
