'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

const STYLE_SLUGS = ['moderne', 'scandinave', 'industriel', 'boheme', 'japandi', 'minimaliste'] as const;
const ROOM_SLUGS = ['salon', 'chambre', 'cuisine', 'salle-de-bain', 'bureau', 'entree'] as const;

function getRandomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

interface SocialProofToastProps {
  interval?: number;
  initialDelay?: number;
  maxNotifications?: number;
}

export function SocialProofToast({
  interval = 25000,
  initialDelay = 8000,
  maxNotifications = 10,
}: SocialProofToastProps) {
  const tHome = useTranslations('Home');
  const tLand = useTranslations('HomeLanding');
  const templates = useMemo(() => tLand.raw('toast.templates') as string[], [tLand]);
  const tHomeRef = useRef(tHome);
  tHomeRef.current = tHome;

  const [notification, setNotification] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(0);

  const showNotification = useCallback(() => {
    setCount((prev) => {
      if (prev >= maxNotifications || templates.length === 0) return prev;

      const th = tHomeRef.current as unknown as (key: string) => string;
      const template = getRandomItem(templates);
      const styleSlug = getRandomItem(STYLE_SLUGS);
      const roomSlug = getRandomItem(ROOM_SLUGS);
      const style = th(`styleNames.${styleSlug}`);
      const room = th(`roomNames.${roomSlug}`);
      const message = fillTemplate(template, { style, room });

      setNotification({ id: Math.random().toString(36).slice(2), message });
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return prev + 1;
    });
  }, [maxNotifications, templates]);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      showNotification();
    }, initialDelay);

    return () => clearTimeout(initialTimer);
  }, [initialDelay, showNotification]);

  useEffect(() => {
    if (count === 0 || count >= maxNotifications) return;

    const timer = setTimeout(() => {
      showNotification();
    }, interval);

    return () => clearTimeout(timer);
  }, [count, interval, maxNotifications, showNotification]);

  if (!notification || !isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 max-w-sm transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border/50 p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{notification.message}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">{tLand('toast.caption')}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label={tLand('toast.closeAria')}
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
