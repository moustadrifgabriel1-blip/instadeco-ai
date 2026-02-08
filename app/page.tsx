import dynamic from 'next/dynamic';
import { Hero } from '@/components/features/landing/Hero';

// Lazy load below-the-fold components
const HowItWorks = dynamic(() => import('@/components/features/landing/HowItWorks').then(mod => ({ default: mod.HowItWorks })), {
  loading: () => <div className="min-h-[400px]" />,
});

const Gallery = dynamic(() => import('@/components/features/landing/Gallery').then(mod => ({ default: mod.Gallery })), {
  loading: () => <div className="min-h-[400px]" />,
});

const Features = dynamic(() => import('@/components/features/landing/Features').then(mod => ({ default: mod.Features })), {
  loading: () => <div className="min-h-[400px]" />,
});

const Stats = dynamic(() => import('@/components/features/landing/Stats').then(mod => ({ default: mod.Stats })), {
  loading: () => <div className="min-h-[200px]" />,
});

const Testimonials = dynamic(() => import('@/components/features/landing/Testimonials').then(mod => ({ default: mod.Testimonials })), {
  loading: () => <div className="min-h-[400px]" />,
});

const FinalCTA = dynamic(() => import('@/components/features/landing/FinalCTA').then(mod => ({ default: mod.FinalCTA })), {
  loading: () => <div className="min-h-[200px]" />,
});

const LeadCaptureLazy = dynamic(() => import('@/components/features/lead-capture').then(mod => ({ default: mod.LeadCapture })), {
  ssr: false,
});

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <HowItWorks />
      <Gallery />
      <Features />
      <Stats />
      <Testimonials />
      <FinalCTA />
      <LeadCaptureLazy variant="popup" delay={12000} />
    </main>
  );
}
