import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'F1 Race Analysis Dashboard',
  description: 'Formula 1 lap-by-lap position chart, tyre strategy, and race analysis powered by FastF1',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}