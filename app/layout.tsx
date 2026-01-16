import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InstantDecor AI - Décoration d\'intérieur par IA',
  description: 'Transformez vos pièces en rendus décorés professionnels grâce à l\'IA générative Flux.1 + ControlNet',
  keywords: ['décoration intérieur', 'IA', 'design', 'home staging', 'Flux.1'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
