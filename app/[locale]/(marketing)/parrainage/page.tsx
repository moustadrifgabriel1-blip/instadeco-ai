import type { Metadata } from 'next';
import Link from 'next/link';
import { Gift, Users, Sparkles, ArrowRight, Heart, Infinity, Zap, Wallet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Parrainage : gagnez 5 crédits gratuits | InstaDeco AI',
  description: 'Parrainez vos amis sur InstaDeco AI et recevez 5 crédits gratuits chacun. Partagez votre code de parrainage et transformez vos pièces gratuitement.',
  openGraph: {
    title: 'Parrainage InstaDeco AI : 5 crédits offerts',
    description: 'Invitez vos amis et gagnez 5 crédits gratuits chacun pour redécorer vos intérieurs par IA.',
    url: 'https://instadeco.app/parrainage',
  },
};

export default function ParrainagePage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] text-[var(--gold)] px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Gift className="w-4 h-4" />
          <span className="prestige-eyebrow">Programme de parrainage</span>
        </div>

        <h1 className="prestige-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.025em] text-foreground leading-[1.1] mb-6">
          Parrainez un ami,{' '}
          <span className="text-[var(--gold)]">gagnez 5 crédits</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Invitez vos proches à découvrir InstaDeco AI. Pour chaque ami qui s&apos;inscrit,
          vous recevez <strong className="text-foreground">5 crédits gratuits chacun</strong>.
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] px-8 py-4 rounded-full font-semibold text-lg hover:bg-transparent hover:text-[var(--gold)] transition-all"
        >
          Créer mon compte et obtenir mon code
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-sm text-muted-foreground mt-3">
          Déjà inscrit ? <Link href="/dashboard" className="text-[var(--gold)] font-medium hover:underline">Accédez à votre code dans le dashboard</Link>
        </p>
      </div>

      {/* Comment ça marche */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="prestige-display text-2xl sm:text-3xl font-semibold text-center text-foreground mb-12">
          Comment ça marche ?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              icon: Gift,
              title: 'Partagez votre code',
              desc: 'Après inscription, trouvez votre code unique dans votre dashboard. Partagez-le par message, email ou réseaux sociaux.',
            },
            {
              step: '2',
              icon: Users,
              title: 'Votre ami s\'inscrit',
              desc: 'Votre ami crée un compte gratuit sur InstaDeco AI et saisit votre code lors de l\'inscription.',
            },
            {
              step: '3',
              icon: Sparkles,
              title: 'Vous gagnez tous les deux',
              desc: '5 crédits gratuits sont ajoutés instantanément à vos deux comptes. Illimité !',
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-7 h-7 text-[var(--gold)]" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] text-[var(--gold)] font-bold text-sm mb-3">
                {item.step}
              </div>
              <h3 className="prestige-display text-lg font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Avantages */}
      <div className="bg-card border-y border-[var(--gold-line)] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="prestige-display text-2xl sm:text-3xl font-semibold text-center text-foreground mb-10">
            Pourquoi parrainer ?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Gift, title: '5 crédits gratuits', desc: 'À chaque parrainage réussi, pour vous ET votre ami.' },
              { icon: Infinity, title: 'Aucune limite', desc: 'Parrainez autant d\'amis que vous voulez. Plus vous parrainez, plus vous créez.' },
              { icon: Zap, title: 'Crédits instantanés', desc: 'Les crédits sont ajoutés dès l\'inscription de votre ami. Pas d\'attente.' },
              { icon: Wallet, title: 'Crédits à vie', desc: 'Vos crédits gagnés n\'expirent jamais. Utilisez-les quand vous voulez.' },
            ].map((item) => (
              <div key={item.title} className="bg-background rounded-2xl p-6 border border-[var(--gold-line)]">
                <item.icon className="w-6 h-6 text-[var(--gold)] mb-3" />
                <h3 className="prestige-display text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA final */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-card border border-[var(--gold-line)] rounded-3xl p-8 sm:p-12 text-foreground">
          <Heart className="w-10 h-10 text-[var(--gold)] mx-auto mb-4" />
          <h2 className="prestige-display text-2xl sm:text-3xl font-semibold mb-4">
            Prêt à gagner des crédits gratuits ?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Créez votre compte, obtenez votre code de parrainage unique,
            et partagez-le avec vos proches.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] px-8 py-3 rounded-full font-semibold hover:bg-transparent hover:text-[var(--gold)] transition-colors"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/essai"
              className="inline-flex items-center justify-center gap-2 bg-transparent text-foreground border border-border px-8 py-3 rounded-full font-semibold hover:border-[var(--gold-line)] hover:text-[var(--gold)] transition-colors"
            >
              Essayer d&apos;abord gratuitement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
