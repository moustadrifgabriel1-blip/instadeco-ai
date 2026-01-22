'use client';

import { motion } from 'framer-motion';
import { Zap, LayoutTemplate, Wallet, Palette, MousePointerClick, Download } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: "Ultra Rapide",
    description: "Obtenez un rendu photoréaliste en moins de 15 secondes grâce à nos serveurs GPU haute performance."
  },
  {
    icon: LayoutTemplate,
    title: "Respect de l'Architecture",
    description: "Notre IA analyse la structure de votre pièce (murs, fenêtres) pour préserver les volumes existants."
  },
  {
    icon: Wallet,
    title: "Économique",
    description: "Une fraction du prix d'un décorateur d'intérieur ou d'un logiciel de home staging 3D classique."
  },
  {
    icon: Palette,
    title: "+50 Styles Déco",
    description: "Scandinave, Japandi, Industriel, Bohème... Explorez une infinité de combinaisons stylistiques."
  },
  {
    icon: MousePointerClick,
    title: "Simplicité Extrême",
    description: "Aucune compétence technique requise. Prenez une photo, choisissez un style, et c'est tout."
  },
  {
    icon: Download,
    title: "Qualité HD",
    description: "Téléchargez vos rendus en haute définition, prêts à être partagés sur les réseaux ou avec vos clients."
  }
];

export function Features() {
  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">Pourquoi choisir InstaDeco ?</h2>
          <p className="text-lg text-muted-foreground">Une technologie de pointe au service de votre créativité.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-background p-8 rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all group"
            >
              <div className="h-12 w-12 bg-primary/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
