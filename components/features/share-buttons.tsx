'use client';

import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, X } from 'lucide-react';

interface ShareButtonsProps {
  /** URL à partager */
  url?: string;
  /** Titre pour le partage */
  title: string;
  /** Description pour le partage */
  description?: string;
  /** URL de l'image (pour Pinterest) */
  imageUrl?: string;
  /** Code de parrainage à intégrer dans l'URL */
  referralCode?: string;
  /** Variante d'affichage */
  variant?: 'inline' | 'compact' | 'floating';
  /** Classe CSS supplémentaire */
  className?: string;
}

export function ShareButtons({
  url,
  title,
  description = '',
  imageUrl,
  referralCode,
  variant = 'inline',
  className = '',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Construire l'URL de partage avec le referral code
  const baseUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareUrl = referralCode
    ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}ref=${referralCode}`
    : baseUrl;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  // Liens de partage
  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}${imageUrl ? `&media=${encodeURIComponent(imageUrl)}` : ''}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback pour les navigateurs sans clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: shareUrl,
        });
      } catch {
        // L'utilisateur a annulé le partage
      }
    } else {
      setShowMenu(true);
    }
  };

  const openShareLink = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  // ── Variante COMPACT : Juste un bouton qui ouvre le menu ──
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#636366] hover:text-[#E07B54] bg-[#f5f5f7] hover:bg-[#FFF3ED] rounded-full transition-all duration-200"
          aria-label="Partager"
        >
          <Share2 className="w-3.5 h-3.5" />
          Partager
        </button>
        {showMenu && (
          <ShareMenu
            shareLinks={shareLinks}
            onCopy={handleCopy}
            copied={copied}
            onClose={() => setShowMenu(false)}
            openShareLink={openShareLink}
          />
        )}
      </div>
    );
  }

  // ── Variante FLOATING : Bouton circulaire flottant ──
  if (variant === 'floating') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleNativeShare}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-[#FFF3ED] hover:shadow-xl transition-all duration-200 border border-black/5"
          aria-label="Partager"
        >
          <Share2 className="w-4 h-4 text-[#E07B54]" />
        </button>
        {showMenu && (
          <ShareMenu
            shareLinks={shareLinks}
            onCopy={handleCopy}
            copied={copied}
            onClose={() => setShowMenu(false)}
            openShareLink={openShareLink}
            position="bottom-right"
          />
        )}
      </div>
    );
  }

  // ── Variante INLINE : Boutons alignés ──
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* WhatsApp */}
      <button
        onClick={() => openShareLink(shareLinks.whatsapp)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#25D366] hover:bg-[#1DA851] rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
        aria-label="Partager sur WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        WhatsApp
      </button>

      {/* Pinterest */}
      <button
        onClick={() => openShareLink(shareLinks.pinterest)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#E60023] hover:bg-[#C50020] rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
        aria-label="Partager sur Pinterest"
      >
        <PinterestIcon className="w-3.5 h-3.5" />
        Pinterest
      </button>

      {/* Twitter/X */}
      <button
        onClick={() => openShareLink(shareLinks.twitter)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#1DA1F2] hover:bg-[#0d8bd9] rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
        aria-label="Partager sur Twitter"
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>

      {/* Copier le lien */}
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md ${
          copied
            ? 'text-white bg-green-500'
            : 'text-[#636366] bg-[#f5f5f7] hover:bg-[#e8e8ed]'
        }`}
        aria-label="Copier le lien"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copié !' : 'Lien'}
      </button>
    </div>
  );
}

// ── Menu dropdown de partage ──
function ShareMenu({
  shareLinks,
  onCopy,
  copied,
  onClose,
  openShareLink,
  position = 'bottom-left',
}: {
  shareLinks: Record<string, string>;
  onCopy: () => void;
  copied: boolean;
  onClose: () => void;
  openShareLink: (url: string) => void;
  position?: 'bottom-left' | 'bottom-right';
}) {
  return (
    <>
      {/* Overlay transparent pour fermer */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`absolute z-50 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-black/5 py-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
          position === 'bottom-right' ? 'right-0' : 'left-0'
        }`}
      >
        <div className="px-3 py-2 border-b border-black/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#636366] uppercase tracking-wider">Partager</span>
            <button onClick={onClose} className="text-[#636366] hover:text-[#1d1d1f]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        <button
          onClick={() => { openShareLink(shareLinks.whatsapp); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
        >
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#25D366]">
            <MessageCircle className="w-4 h-4 text-white" />
          </span>
          WhatsApp
        </button>
        
        <button
          onClick={() => { openShareLink(shareLinks.pinterest); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
        >
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E60023]">
            <PinterestIcon className="w-4 h-4 text-white" />
          </span>
          Pinterest
        </button>
        
        <button
          onClick={() => { openShareLink(shareLinks.twitter); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
        >
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1DA1F2]">
            <XIcon className="w-4 h-4 text-white" />
          </span>
          Twitter / X
        </button>

        <button
          onClick={() => { openShareLink(shareLinks.facebook); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
        >
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1877F2]">
            <FacebookIcon className="w-4 h-4 text-white" />
          </span>
          Facebook
        </button>

        <div className="border-t border-black/5 mt-1 pt-1">
          <button
            onClick={() => { onCopy(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
          >
            <span className={`w-8 h-8 flex items-center justify-center rounded-full ${copied ? 'bg-green-500' : 'bg-[#636366]'}`}>
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
            </span>
            {copied ? 'Lien copié !' : 'Copier le lien'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Icônes SVG personnalisées ──

function PinterestIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

function XIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
