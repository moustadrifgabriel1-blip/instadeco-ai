'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Share2, Copy, CheckCircle2, Users, Sparkles } from 'lucide-react';
import { trackReferralShared } from '@/lib/analytics/gtag';
import type { ReferralStats } from './useReferral';

interface ReferralTabProps {
  referralCode: string | null;
  referralStats: ReferralStats;
}

const HOW_IT_WORKS = [
  { step: '1', title: 'Partagez votre code', desc: 'Envoyez votre code unique à vos amis par message, email ou réseaux sociaux.' },
  { step: '2', title: 'Ils s\'inscrivent', desc: 'Vos amis créent un compte et saisissent votre code lors de l\'inscription.' },
  { step: '3', title: 'Vous gagnez tous les deux', desc: 'Vous recevez chacun 5 crédits gratuits instantanément !' },
];

export function ReferralTab({ referralCode, referralStats }: ReferralTabProps) {
  const [referralCopied, setReferralCopied] = useState(false);

  const flashCopied = () => {
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      flashCopied();
    }
  };

  const shareLink = () => {
    const text = `Essaie InstaDeco AI pour redécorer ton intérieur ! Utilise mon code ${referralCode} pour obtenir 5 crédits gratuits 🎁 https://instadeco.app/signup?ref=${referralCode}`;
    trackReferralShared();
    if (navigator.share) {
      navigator.share({ title: 'InstaDeco AI', text });
    } else {
      navigator.clipboard.writeText(text);
      flashCopied();
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Essaie InstaDeco AI pour redécorer ton intérieur ! Utilise mon code ${referralCode} pour 5 crédits gratuits 🎁`);
    const url = encodeURIComponent(`https://instadeco.app/signup?ref=${referralCode}`);
    trackReferralShared();
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  return (
    <div>
      <h1 className="prestige-display text-2xl font-semibold text-foreground mb-6">Parrainage</h1>

      {/* Referral value prop */}
      <div className="bg-card rounded-2xl p-6 border border-[var(--gold-line)] mb-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="prestige-display text-lg font-semibold text-foreground mb-1">Invitez vos amis, gagnez des crédits</h2>
            <p className="text-sm text-muted-foreground">
              Pour chaque ami qui s&apos;inscrit avec votre code, vous recevez tous les deux <span className="font-bold text-primary">5 crédits gratuits</span>.
              Plus vous parrainez, plus vous créez !
            </p>
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="prestige-display flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Votre code de parrainage
          </CardTitle>
          <CardDescription>Partagez ce code avec vos amis pour qu&apos;ils l&apos;utilisent lors de leur inscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-muted rounded-xl px-4 py-3 font-mono text-base sm:text-lg font-bold text-foreground tracking-widest text-center">
              {referralCode || '...'}
            </div>
            <Button variant="outline" onClick={copyCode} className="flex items-center gap-2">
              {referralCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier
                </>
              )}
            </Button>
          </div>

          {/* Share link */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={shareLink}>
              <Share2 className="w-4 h-4 mr-2" />
              Partager le lien
            </Button>
            <Button variant="outline" className="flex-1" onClick={shareWhatsApp}>
              💬 WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="prestige-display text-3xl font-bold text-foreground">{referralStats.totalReferred}</div>
              <p className="text-sm text-muted-foreground">Amis parrainés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="prestige-display text-3xl font-bold text-foreground">{referralStats.totalCreditsEarned}</div>
              <p className="text-sm text-muted-foreground">Crédits gagnés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="prestige-display">Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
