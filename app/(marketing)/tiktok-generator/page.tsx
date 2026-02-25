import { TikTokGenerator } from '@/components/features/tiktok-generator';
import { Badge } from '@/components/ui/badge';
import { Film, Zap, Share2, Sparkles } from 'lucide-react';

export default function TikTokGeneratorPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-background -z-10" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full -z-10" />

        <div className="container px-4 md:px-6 text-center space-y-6">
          <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary">
            <Film className="w-3 h-3 mr-2" />
            100% gratuit — aucun compte requis
          </Badge>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Générateur Vidéo{' '}
            <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              Avant / Après
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Créez des vidéos TikTok, Reels et Shorts virales en 1 clic. 
            Transitions professionnelles, format 9:16, export instantané.
          </p>

          {/* Features pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 text-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
              Export en 10 secondes
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              6 transitions virales
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 text-sm">
              <Share2 className="w-4 h-4 text-blue-500" />
              TikTok · Reels · Shorts
            </div>
          </div>
        </div>
      </section>

      {/* Generator */}
      <section className="container px-4 md:px-6 pb-20">
        <TikTokGenerator />
      </section>

      {/* SEO Content */}
      <section className="border-t bg-muted/20 py-16">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-center">
            Comment créer une vidéo avant/après virale ?
          </h2>
          
          <div className="prose prose-gray max-w-none">
            <p>
              Les vidéos avant/après sont le format le plus viral sur TikTok et Instagram Reels 
              pour la décoration d&apos;intérieur. Notre générateur gratuit vous permet de créer 
              des transitions professionnelles en quelques secondes, sans logiciel de montage.
            </p>

            <h3>Pourquoi les avant/après fonctionnent sur TikTok ?</h3>
            <p>
              Le format avant/après crée un &quot;pattern interrupt&quot; — le spectateur est captivé 
              par la transformation et reste jusqu&apos;au bout. C&apos;est le format qui génère 
              le plus d&apos;engagement et de partages dans la niche déco/rénovation.
            </p>

            <h3>6 transitions dignes d&apos;une agence</h3>
            <ul>
              <li><strong>Swipe Reveal</strong> — Le classique ultra satisfaisant du balayage latéral</li>
              <li><strong>Zoom Burst</strong> — Zoom dramatique puis reveal avec bounce</li>
              <li><strong>Flash Cut</strong> — Flash blanc cinématique entre les deux images</li>
              <li><strong>Circle Open</strong> — Cercle lumineux qui s&apos;ouvre depuis le centre</li>
              <li><strong>Glitch RGB</strong> — Effet glitch + séparation RGB virale</li>
              <li><strong>Shake Drop</strong> — Secousse puis drop dramatique du résultat</li>
            </ul>

            <h3>Format optimisé pour les réseaux sociaux</h3>
            <p>
              Toutes les vidéos sont générées en format vertical 9:16 (1080×1920), 
              le format natif de TikTok, Instagram Reels et YouTube Shorts. 
              Le rendu se fait directement dans votre navigateur — aucune donnée 
              n&apos;est envoyée sur un serveur.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
