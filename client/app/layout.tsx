import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusLoop - All-in-One Campus Platform',
  description:
    'CampusLoop unites Lost & Found with auto-matching, Train Buddy Radar, Ride Splitting with fare split, and a Campus Marketplace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

