/**
 * Moteur de génération vidéo Avant/Après pour TikTok/Reels
 * 
 * Utilise Canvas 2D + MediaRecorder pour créer des vidéos
 * avec des transitions virales directement dans le navigateur.
 * 
 * Format: 1080x1920 (9:16 vertical TikTok/Reels/Shorts)
 */

// ============================================
// TYPES
// ============================================

export type TransitionType = 
  | 'swipe'       // Balayage latéral avec reveal
  | 'zoom'        // Zoom avant puis reveal
  | 'flash'       // Flash blanc cinématique
  | 'circle'      // Cercle qui s'ouvre depuis le centre
  | 'glitch'      // Effet glitch RGB split
  | 'shake';      // Shake + flash dramatique

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  /** Durée de l'intro "AVANT" en secondes */
  introDuration: number;
  /** Durée de la transition en secondes */
  transitionDuration: number;
  /** Durée de l'outro "APRÈS" en secondes */
  outroDuration: number;
  /** Type de transition */
  transition: TransitionType;
  /** Texte watermark en bas */
  watermark: string;
  /** Couleur d'accent pour les textes */
  accentColor: string;
}

export const DEFAULT_CONFIG: VideoConfig = {
  width: 1080,
  height: 1920,
  fps: 30,
  introDuration: 2.0,
  transitionDuration: 1.0,
  outroDuration: 2.5,
  transition: 'swipe',
  watermark: 'instadeco.app',
  accentColor: '#E07B54',
};

export const TRANSITIONS: Record<TransitionType, { name: string; emoji: string; description: string }> = {
  swipe:  { name: 'Swipe Reveal', emoji: '👆', description: 'Balayage latéral ultra fluide' },
  zoom:   { name: 'Zoom Burst',  emoji: '🔍', description: 'Zoom dramatique puis reveal' },
  flash:  { name: 'Flash Cut',   emoji: '⚡', description: 'Flash blanc cinématique' },
  circle: { name: 'Circle Open', emoji: '⭕', description: 'Cercle qui s\'ouvre au centre' },
  glitch: { name: 'Glitch RGB',  emoji: '📺', description: 'Effet glitch + RGB split' },
  shake:  { name: 'Shake Drop',  emoji: '💥', description: 'Secousse + drop dramatique' },
};

// ============================================
// EASING FUNCTIONS
// ============================================

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
}

function easeInBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

// ============================================
// IMAGE HELPERS
// ============================================

/**
 * Dessine une image en mode "cover" (remplit le canvas en gardant le ratio)
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = w / h;
  let sw: number, sh: number, sx: number, sy: number;

  if (imgRatio > canvasRatio) {
    sh = img.naturalHeight;
    sw = sh * canvasRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// ============================================
// TEXT DRAWING
// ============================================

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  config: VideoConfig,
  opacity: number = 1,
  scale: number = 1
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const fontSize = 72;
  ctx.font = `900 ${fontSize}px "Inter", "SF Pro Display", system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const padding = 28;
  const boxW = metrics.width + padding * 2;
  const boxH = fontSize + padding * 1.4;

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;

  // Background pill
  const radius = boxH / 2;
  ctx.beginPath();
  ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, radius);
  ctx.fillStyle = config.accentColor;
  ctx.fill();

  // Text
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 2);

  ctx.restore();
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  config: VideoConfig,
  opacity: number = 0.7
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = '600 36px "Inter", system-ui, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText(`@${config.watermark}`, config.width / 2, config.height - 60);
  ctx.restore();
}

// ============================================
// SUBTLE ANIMATIONS
// ============================================

/** Léger zoom de Ken Burns pendant les phases intro/outro */
function applyKenBurns(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  config: VideoConfig,
  progress: number,
  zoomStart: number = 1.0,
  zoomEnd: number = 1.05
) {
  const scale = zoomStart + (zoomEnd - zoomStart) * progress;
  const dx = (config.width * (scale - 1)) / 2;
  const dy = (config.height * (scale - 1)) / 2;
  
  ctx.save();
  drawImageCover(ctx, img, -dx, -dy, config.width * scale, config.height * scale);
  ctx.restore();
}

/** Vignette cinématique */
function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number = 0.3) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.9);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

// ============================================
// TRANSITIONS
// ============================================

function renderSwipe(
  ctx: CanvasRenderingContext2D,
  before: HTMLImageElement,
  after: HTMLImageElement,
  progress: number,
  config: VideoConfig
) {
  const p = easeInOutCubic(progress);
  const splitX = config.width * (1 - p);

  // Image "après" en fond
  drawImageCover(ctx, after, 0, 0, config.width, config.height);

  // Image "avant" clippée
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitX, config.height);
  ctx.clip();
  drawImageCover(ctx, before, 0, 0, config.width, config.height);
  ctx.restore();

  // Ligne de séparation + glow
  ctx.save();
  ctx.shadowColor = config.accentColor;
  ctx.shadowBlur = 30;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, config.height);
  ctx.stroke();
  ctx.restore();

  // Indicateur de direction
  if (progress > 0.1 && progress < 0.9) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◀', splitX - 30, config.height / 2);
    ctx.fillText('▶', splitX + 30, config.height / 2);
    ctx.restore();
  }
}

function renderZoom(
  ctx: CanvasRenderingContext2D,
  before: HTMLImageElement,
  after: HTMLImageElement,
  progress: number,
  config: VideoConfig
) {
  const { width: w, height: h } = config;

  if (progress < 0.5) {
    // Phase 1 : zoom sur "before"
    const zoomP = easeInBack(progress * 2);
    const scale = 1 + zoomP * 2.5;
    const dx = (w * (scale - 1)) / 2;
    const dy = (h * (scale - 1)) / 2;
    
    drawImageCover(ctx, before, -dx, -dy, w * scale, h * scale);
    
    // Blur overlay progressif 
    ctx.fillStyle = `rgba(255,255,255,${zoomP * 0.8})`;
    ctx.fillRect(0, 0, w, h);
  } else {
    // Phase 2 : zoom out sur "after" avec bounce
    const revealP = easeOutBounce((progress - 0.5) * 2);
    const scale = 1.3 - 0.3 * revealP;
    const dx = (w * (scale - 1)) / 2;
    const dy = (h * (scale - 1)) / 2;
    
    drawImageCover(ctx, after, -dx, -dy, w * scale, h * scale);
  }
}

function renderFlash(
  ctx: CanvasRenderingContext2D,
  before: HTMLImageElement,
  after: HTMLImageElement,
  progress: number,
  config: VideoConfig
) {
  const { width: w, height: h } = config;

  if (progress < 0.3) {
    // Before avec build-up
    const intensity = easeInOutCubic(progress / 0.3);
    drawImageCover(ctx, before, 0, 0, w, h);
    ctx.fillStyle = `rgba(255,255,255,${intensity * 0.6})`;
    ctx.fillRect(0, 0, w, h);
  } else if (progress < 0.5) {
    // Flash blanc total
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
  } else {
    // After reveal
    const afterP = easeOutElastic((progress - 0.5) / 0.5);
    const scale = 0.8 + 0.2 * afterP;
    const dx = (w * (1 - scale)) / 2;
    const dy = (h * (1 - scale)) / 2;
    
    drawImageCover(ctx, after, dx, dy, w * scale, h * scale);
    
    // Flash résiduel
    const flashFade = Math.max(0, 1 - (progress - 0.5) * 4);
    ctx.fillStyle = `rgba(255,255,255,${flashFade})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function renderCircle(
  ctx: CanvasRenderingContext2D,
  before: HTMLImageElement,
  after: HTMLImageElement,
  progress: number,
  config: VideoConfig
) {
  const { width: w, height: h } = config;
  const p = easeInOutCubic(progress);
  const maxRadius = Math.sqrt(w * w + h * h) / 2;
  const radius = maxRadius * p;

  // Before en fond
  drawImageCover(ctx, before, 0, 0, w, h);

  // After dans le cercle
  ctx.save();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
  ctx.clip();
  drawImageCover(ctx, after, 0, 0, w, h);
  ctx.restore();

  // Bordure lumineuse du cercle
  if (progress > 0.05 && progress < 0.95) {
    ctx.save();
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 6;
    ctx.shadowColor = config.accentColor;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function renderGlitch(
  ctx: CanvasRenderingContext2D,
  before: HTMLImageElement,
  after: HTMLImageElement,
  progress: number,
  config: VideoConfig
) {
  const { width: w, height: h } = config;

  if (progress < 0.4) {
    // Glitch sur "before"
    drawImageCover(ctx, before, 0, 0, w, h);

    const intensity = Math.sin(progress * Math.PI * 8) * progress * 2;
    const slices = 12;
    for (let i = 0; i < slices; i++) {
      if (Math.random() > 0.5) continue;
      const sliceY = (h / slices) * i;
      const sliceH = h / slices;
      const offset = (Math.random() - 0.5) * intensity * 60;
      
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.rect(0, sliceY, w, sliceH);
      ctx.clip();
      drawImageCover(ctx, before, offset, 0, w, h);
      ctx.restore();
    }

    // RGB split
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = intensity * 0.3;
    drawImageCover(ctx, before, -intensity * 15, 0, w, h);
    ctx.globalAlpha = intensity * 0.2;
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (progress < 0.6) {
    // Black flash
    const flashP = (progress - 0.4) / 0.2;
    ctx.fillStyle = `rgba(0,0,0,${1 - Math.abs(flashP - 0.5) * 2})`;
    ctx.fillRect(0, 0, w, h);
    if (flashP > 0.5) {
      ctx.globalAlpha = (flashP - 0.5) * 2;
      drawImageCover(ctx, after, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  } else {
    // After clean reveal
    drawImageCover(ctx, after, 0, 0, w, h);
    const fadeGlitch = Math.max(0, 1 - (progress - 0.6) * 3);
    if (fadeGlitch > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = fadeGlitch * 0.15;
      drawImageCover(ctx, after, 8, 0, w, h);
      ctx.restore();
    }
  }
}

function renderShake(
  ctx: CanvasRenderingContext2D,
  before: HTMLImageElement,
  after: HTMLImageElement,
  progress: number,
  config: VideoConfig
) {
  const { width: w, height: h } = config;

  if (progress < 0.4) {
    // Shake progressif sur "before"
    const intensity = easeInOutCubic(progress / 0.4);
    const shakeX = Math.sin(progress * 60) * intensity * 25;
    const shakeY = Math.cos(progress * 45) * intensity * 15;
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawImageCover(ctx, before, 0, 0, w, h);
    ctx.restore();

    // Build-up blanc
    ctx.fillStyle = `rgba(255,255,255,${intensity * 0.4})`;
    ctx.fillRect(0, 0, w, h);
  } else if (progress < 0.55) {
    // Impact flash
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
  } else {
    // "After" drop with bounce
    const dropP = easeOutBounce((progress - 0.55) / 0.45);
    const offsetY = (1 - dropP) * -h * 0.3;
    const scale = 0.9 + 0.1 * dropP;
    
    ctx.save();
    const dx = (w * (1 - scale)) / 2;
    ctx.translate(dx, offsetY);
    drawImageCover(ctx, after, 0, 0, w * scale, h * scale);
    ctx.restore();
  }
}

// ============================================
// RENDER DISPATCHER
// ============================================

const TRANSITION_RENDERERS: Record<TransitionType, typeof renderSwipe> = {
  swipe: renderSwipe,
  zoom: renderZoom,
  flash: renderFlash,
  circle: renderCircle,
  glitch: renderGlitch,
  shake: renderShake,
};

// ============================================
// MAIN RENDER LOOP
// ============================================

export interface RenderCallbacks {
  onProgress: (progress: number) => void;
  onComplete: (blob: Blob) => void;
  onError: (error: Error) => void;
}

/**
 * Génère une vidéo avant/après avec une transition virale
 * 
 * @returns Function to cancel the generation
 */
export function generateVideo(
  canvas: HTMLCanvasElement,
  beforeImg: HTMLImageElement,
  afterImg: HTMLImageElement,
  config: VideoConfig = DEFAULT_CONFIG,
  callbacks: RenderCallbacks
): () => void {
  const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
  canvas.width = config.width;
  canvas.height = config.height;

  let cancelled = false;

  // Déterminer le meilleur format supporté
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm';

  const stream = canvas.captureStream(config.fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000, // 8 Mbps pour une qualité élevée
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    if (cancelled) return;
    const blob = new Blob(chunks, { type: mimeType });
    callbacks.onComplete(blob);
  };

  recorder.onerror = () => {
    callbacks.onError(new Error('Erreur lors de l\'enregistrement vidéo'));
  };

  const totalDuration = config.introDuration + config.transitionDuration + config.outroDuration;
  const totalFrames = Math.ceil(totalDuration * config.fps);
  let currentFrame = 0;

  const transitionRenderer = TRANSITION_RENDERERS[config.transition];

  function renderFrame() {
    if (cancelled) {
      recorder.stop();
      return;
    }

    const time = currentFrame / config.fps;
    const { width: w, height: h } = config;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // ── Phase INTRO (before + label "AVANT") ──
    if (time < config.introDuration) {
      const introP = time / config.introDuration;
      
      // Ken Burns sur l'image "avant"
      applyKenBurns(ctx, beforeImg, config, introP, 1.0, 1.04);
      drawVignette(ctx, w, h, 0.25);

      // Label "AVANT" avec animation d'entrée
      const labelP = Math.min(1, introP * 3);
      const labelScale = easeOutElastic(labelP);
      const labelOpacity = Math.min(1, introP * 4);
      drawLabel(ctx, 'AVANT', w / 2, h * 0.15, config, labelOpacity, labelScale);
    }
    // ── Phase TRANSITION ──
    else if (time < config.introDuration + config.transitionDuration) {
      const transP = (time - config.introDuration) / config.transitionDuration;
      transitionRenderer(ctx, beforeImg, afterImg, transP, config);
      drawVignette(ctx, w, h, 0.15);
    }
    // ── Phase OUTRO (after + label "APRÈS") ──
    else {
      const outroP = (time - config.introDuration - config.transitionDuration) / config.outroDuration;
      
      // Ken Burns inverse sur l'image "après"
      applyKenBurns(ctx, afterImg, config, outroP, 1.04, 1.0);
      drawVignette(ctx, w, h, 0.2);

      // Label "APRÈS" avec animation
      const labelP = Math.min(1, outroP * 3);
      const labelScale = easeOutElastic(labelP);
      const labelOpacity = Math.min(1, outroP * 4);
      drawLabel(ctx, 'APRÈS', w / 2, h * 0.15, config, labelOpacity, labelScale);

      // Watermark avec fade in
      const watermarkOpacity = Math.min(0.7, outroP * 2);
      drawWatermark(ctx, config, watermarkOpacity);

      // CTA final
      if (outroP > 0.5) {
        const ctaP = easeInOutCubic((outroP - 0.5) * 2);
        ctx.save();
        ctx.globalAlpha = ctaP * 0.9;
        ctx.font = '600 42px "Inter", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 12;
        ctx.fillText('Essayez gratuitement ✨', w / 2, h - 140);
        ctx.restore();
      }
    }

    // Progress callback
    callbacks.onProgress(currentFrame / totalFrames);

    currentFrame++;
    if (currentFrame <= totalFrames) {
      requestAnimationFrame(renderFrame);
    } else {
      // Fin — on laisse un petit délai pour le dernier frame
      setTimeout(() => {
        if (!cancelled) recorder.stop();
      }, 100);
    }
  }

  // Démarrer
  recorder.start();
  renderFrame();

  // Return cancel function
  return () => {
    cancelled = true;
  };
}

/**
 * Charge une image depuis un File ou URL et retourne un HTMLImageElement
 */
export function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Impossible de charger l\'image'));

    if (source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
}
