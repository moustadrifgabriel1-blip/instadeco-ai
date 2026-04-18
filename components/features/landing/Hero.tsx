'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { fadeUpBlock, heroStaggerVariants } from '@/lib/motion/instadeco';
import { BeforeAfter } from './BeforeAfter';

// Styles disponibles pour l'animation
const styles = ['Moderne', 'Scandinave', 'Bohème', 'Japandi', 'Industrial'];

export function Hero() {
  const [currentStyle, setCurrentStyle] = useState(0);
  const reduceMotion = useReducedMotion();
  const { container: staggerContainer, item: staggerItem } =
    heroStaggerVariants(reduceMotion);
  const visualEnter = fadeUpBlock(reduceMotion, {
    delay: reduceMotion ? 0 : 0.14,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStyle((prev) => (prev + 1) % styles.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden gradient-hero">
      {/* Formes décoratives — pas d&apos;animate-float si l&apos;utilisateur réduit les mouvements */}
      <div
        className={`absolute top-20 left-[10%] w-72 h-72 rounded-full bg-[#FFE4D9] opacity-40 blur-3xl ${reduceMotion ? '' : 'animate-float'}`}
      />
      <div
        className={`absolute bottom-20 right-[15%] w-64 h-64 rounded-full bg-[#FFE4D9] opacity-30 blur-3xl ${reduceMotion ? '' : 'animate-float'}`}
        style={reduceMotion ? undefined : { animationDelay: '2s' }}
      />

      <div className="container relative z-10 px-4 md:px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Contenu texte — cascade légère (désactivée si prefers-reduced-motion) */}
          <motion.div
            className="flex flex-col gap-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={staggerItem} className="badge-primary w-fit">
              <Sparkles className="h-4 w-4" />
              <span>Votre architecte d&apos;intérieur à 0,99 €</span>
            </motion.div>

            {/* Titre principal */}
            <motion.div variants={staggerItem} className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-[#2D2D2D] leading-[1.1]">
                Redécorez votre intérieur en style
                <br />
                <span className="text-[#C95D3A] italic inline-grid overflow-visible px-4">
                  {styles.map((style, index) => (
                    <span
                      key={style}
                      className={`col-start-1 row-start-1 transition-opacity duration-500 ${index === currentStyle ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {style}
                    </span>
                  ))}
                </span>
              </h1>
            </motion.div>

            {/* Description - Price anchoring Sutherland */}
            <motion.p
              variants={staggerItem}
              className="text-lg md:text-xl text-[#6B6B6B] max-w-xl leading-relaxed"
            >
              Un décorateur coûte <span className="line-through">150 €/h</span>. InstaDeco : <span className="font-semibold text-[#E07B54]">0,99 € en 30 secondes</span>.
              Résultat de designer, sans travaux, sans rendez-vous.
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="group h-12 px-6 text-base sm:h-14 sm:px-8 sm:text-lg rounded-xl btn-primary" 
                asChild
              >
                <Link href="/essai" className="flex items-center gap-2">
                  <span>Relooker ma pièce gratuitement</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

            </motion.div>

            {/* Social Proof */}
            <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Image 
                      key={i}
                      src={`/images/avatar-${i}.webp`}
                      alt={`Utilisateur ${i}`}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-soft"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-[#2D2D2D]">10 000+ photos</p>
                  <p className="text-[#6B6B6B]">déjà transformées</p>
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#F0E6E0]">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-medium text-[#2D2D2D]">Top qualité</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Visuel interactif */}
          <motion.div
            className="relative"
            initial={visualEnter.initial}
            animate={visualEnter.animate}
            transition={visualEnter.transition}
          >
            {/* Container principal */}
            <div className="relative rounded-2xl overflow-hidden shadow-warm-lg border border-[#F0E6E0]">
              <BeforeAfter />
            </div>
            
            {/* Badge flottant */}
            <div
              className={`absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 glass rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-warm hidden sm:flex ${reduceMotion ? '' : 'animate-float'}`}
              style={reduceMotion ? undefined : { animationDelay: '0.5s' }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#E07B54] flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#2D2D2D] text-sm">IA Générative</p>
                  <p className="text-xs text-[#6B6B6B]">Résultat en 30s</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
