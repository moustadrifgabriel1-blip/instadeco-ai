'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { BeforeAfter } from './BeforeAfter';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-accent/20 rounded-full blur-[100px] -z-10" />

      <div className="container px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 w-fit">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">IA Générative Nouvelle Génération</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-heading font-bold tracking-tight text-foreground leading-[1.1]">
              Réinventez votre <span className="text-primary italic">intérieur</span> en un clic
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] leading-relaxed">
              Téléchargez une photo de votre pièce et laissez notre IA la transformer instantanément. 
              Des dizaines de styles à portée de main, sans travaux ni architecte.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105" asChild>
                <Link href="/generate">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-accent/50" asChild>
                <Link href="/pricing">
                  Voir les exemples
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted overflow-hidden relative">
                    <Image 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} 
                      alt="User" 
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <p>Déjà utilisé par +10,000 décorateurs</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <BeforeAfter />
            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 text-9xl opacity-5 pointer-events-none select-none font-heading">
              ✦
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
