'use client';

import { useState } from 'react';
import { Share2, Check, Copy, Twitter, Linkedin, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  title: string;
  url: string;
  variant?: 'sidebar' | 'inline';
}

export function ShareButton({ title, url, variant = 'sidebar' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleShare = async () => {
    // Si le navigateur supporte Web Share API (mobile principalement)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        return;
      } catch {
        // L'utilisateur a annulé ou erreur, on affiche le menu fallback
      }
    }

    // Fallback : afficher le menu de partage
    setShowMenu(!showMenu);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch {
      // Fallback pour les navigateurs anciens
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    }
  };

  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
  ];

  if (variant === 'sidebar') {
    return (
      <div className="relative">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full h-10 w-10 shadow-sm"
          title="Partager"
          onClick={handleShare}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </Button>

        {showMenu && (
          <div className="absolute left-12 top-0 bg-white rounded-xl shadow-xl border border-border p-2 min-w-[180px] z-50 animate-in fade-in slide-in-from-left-2 duration-200">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </a>
            ))}
            <div className="h-px bg-border my-1" />
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors w-full"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le lien
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Variant inline (pour mobile)
  return (
    <Button
      size="sm"
      variant="outline"
      className="rounded-full gap-2"
      onClick={handleShare}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          Copié !
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Partager
        </>
      )}
    </Button>
  );
}
