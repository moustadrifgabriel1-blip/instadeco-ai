import type { Metadata } from 'next';
import { cormorant, josefin } from '@/lib/fonts';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${cormorant.variable} ${josefin.variable} prestige-app min-h-[100dvh]`}>
      {children}
    </div>
  );
}
