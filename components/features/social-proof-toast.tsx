'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Sparkles } from 'lucide-react';
import { STYLE_SEO_DATA, ROOM_SEO_DATA } from '@/lib/seo/programmatic-data';

interface SocialProofToastProps {
  /** Intervalle entre chaque notification (ms) */
  interval?: number;
  /** Délai avant la première notification (ms) */
  initialDelay?: number;
  /** Nombre max de notifications à afficher */
  maxNotifications?: number;
}

// Messages montrant les capacités du service (pas de simulation d'activité utilisateur)
const ACTIVITY_TEMPLATES = [
  (style: string, room: string) =>
    `Découvrez : ${room.toLowerCase()} en style ${style}`,
  (style: string, room: string) =>
    `Tendance : transformez ${room === 'Entrée' || room === 'Terrasse' || room === 'Cuisine' || room === 'Salle de bain' || room === 'Salle à manger' ? 'votre' : 'votre'} ${room.toLowerCase()} en ${style}`,
  (style: string) =>
    `Le style ${style} est populaire en ce moment`,
  (_style: string, room: string) =>
    `Idée déco : ${room} à redécouvrir`,
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNotification() {
  const style = getRandomItem(STYLE_SEO_DATA);
  const room = getRandomItem(ROOM_SEO_DATA);
  const template = getRandomItem(ACTIVITY_TEMPLATES);

  return {
    id: Math.random().toString(36).slice(2),
    message: template(style.name, room.name),
    styleName: style.name,
  };
}

export function SocialProofToast({
  interval = 25000,
  initialDelay = 8000,
  maxNotifications = 10,
}: SocialProofToastProps) {
  const [notification, setNotification] = useState<ReturnType<typeof generateNotification> | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(0);

  const showNotification = useCallback(() => {
    if (count >= maxNotifications) return;
    
    const notif = generateNotification();
    setNotification(notif);
    setIsVisible(true);
    setCount(prev => prev + 1);

    // Auto-hide après 5 secondes
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, [count, maxNotifications]);

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
        {/* Icône */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">
            {notification.message}
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Activité récente</p>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
