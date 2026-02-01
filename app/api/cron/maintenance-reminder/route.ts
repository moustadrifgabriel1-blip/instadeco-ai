import { NextResponse } from 'next/server';

// Webhook Discord
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const CRON_SECRET = process.env.CRON_SECRET;

// Types de fréquence
type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  frequency: Frequency;
  category: 'security' | 'performance' | 'business' | 'legal' | 'infrastructure';
  priority: 'critical' | 'high' | 'medium' | 'low';
  links?: string[];
  estimatedTime: string;
}

// Checklist complète de maintenance SaaS
const MAINTENANCE_TASKS: MaintenanceTask[] = [
  // === SÉCURITÉ ===
  {
    id: 'check-npm-audit',
    title: '🔒 Audit des dépendances npm',
    description: 'Vérifier les vulnérabilités avec `npm audit` et mettre à jour les packages critiques.',
    frequency: 'weekly',
    category: 'security',
    priority: 'critical',
    links: ['https://docs.npmjs.com/cli/v8/commands/npm-audit'],
    estimatedTime: '15 min',
  },
  {
    id: 'check-supabase-logs',
    title: '🔍 Vérifier les logs Supabase',
    description: 'Analyser les logs pour détecter des tentatives d\'intrusion ou erreurs anormales.',
    frequency: 'weekly',
    category: 'security',
    priority: 'high',
    links: ['https://supabase.com/dashboard/project/_/logs/edge-logs'],
    estimatedTime: '10 min',
  },
  {
    id: 'rotate-api-keys',
    title: '🔑 Rotation des clés API',
    description: 'Régénérer les clés API sensibles (Fal.ai, Stripe, Supabase service role).',
    frequency: 'quarterly',
    category: 'security',
    priority: 'high',
    estimatedTime: '30 min',
  },
  {
    id: 'check-rls-policies',
    title: '🛡️ Vérifier les RLS Policies',
    description: 'S\'assurer que les Row Level Security policies sont correctement configurées.',
    frequency: 'monthly',
    category: 'security',
    priority: 'critical',
    estimatedTime: '20 min',
  },
  {
    id: 'backup-database',
    title: '💾 Vérifier les backups Supabase',
    description: 'Confirmer que les backups automatiques fonctionnent. Tester une restauration.',
    frequency: 'monthly',
    category: 'security',
    priority: 'critical',
    links: ['https://supabase.com/dashboard/project/_/settings/database'],
    estimatedTime: '15 min',
  },

  // === PERFORMANCE ===
  {
    id: 'check-vercel-analytics',
    title: '📊 Analyser les performances Vercel',
    description: 'Vérifier les temps de réponse, erreurs 500, et Core Web Vitals.',
    frequency: 'weekly',
    category: 'performance',
    priority: 'high',
    links: ['https://vercel.com/dashboard'],
    estimatedTime: '10 min',
  },
  {
    id: 'check-supabase-performance',
    title: '🗄️ Performance base de données',
    description: 'Vérifier les requêtes lentes, index manquants, et utilisation du pool.',
    frequency: 'biweekly',
    category: 'performance',
    priority: 'medium',
    estimatedTime: '20 min',
  },
  {
    id: 'check-storage-usage',
    title: '📦 Vérifier le stockage',
    description: 'Contrôler l\'utilisation du stockage Supabase et nettoyer les fichiers orphelins.',
    frequency: 'monthly',
    category: 'performance',
    priority: 'medium',
    estimatedTime: '15 min',
  },
  {
    id: 'lighthouse-audit',
    title: '🚀 Audit Lighthouse',
    description: 'Exécuter un audit Lighthouse sur les pages principales (Home, Generate, Blog).',
    frequency: 'monthly',
    category: 'performance',
    priority: 'medium',
    links: ['https://pagespeed.web.dev/'],
    estimatedTime: '20 min',
  },

  // === BUSINESS ===
  {
    id: 'check-stripe-dashboard',
    title: '💳 Vérifier Stripe Dashboard',
    description: 'Analyser les paiements échoués, disputes, et revenus. Vérifier les webhooks.',
    frequency: 'weekly',
    category: 'business',
    priority: 'critical',
    links: ['https://dashboard.stripe.com/'],
    estimatedTime: '15 min',
  },
  {
    id: 'check-fal-usage',
    title: '🤖 Vérifier la consommation Fal.ai',
    description: 'Surveiller les crédits API restants et le coût par génération.',
    frequency: 'weekly',
    category: 'business',
    priority: 'high',
    links: ['https://fal.ai/dashboard'],
    estimatedTime: '5 min',
  },
  {
    id: 'analyze-metrics',
    title: '📈 Analyser les métriques business',
    description: 'Revoir: taux de conversion, rétention, coût d\'acquisition, LTV.',
    frequency: 'monthly',
    category: 'business',
    priority: 'high',
    estimatedTime: '30 min',
  },
  {
    id: 'check-credits-balance',
    title: '💰 Équilibrer les prix des crédits',
    description: 'Vérifier que le prix des crédits couvre les coûts Fal.ai + marge.',
    frequency: 'quarterly',
    category: 'business',
    priority: 'high',
    estimatedTime: '20 min',
  },

  // === LÉGAL / RGPD ===
  {
    id: 'check-rgpd-compliance',
    title: '⚖️ Vérification RGPD',
    description: 'S\'assurer que les données utilisateurs sont correctement gérées et supprimables.',
    frequency: 'quarterly',
    category: 'legal',
    priority: 'critical',
    estimatedTime: '45 min',
  },
  {
    id: 'update-legal-pages',
    title: '📜 Mettre à jour les pages légales',
    description: 'Vérifier CGV, mentions légales, politique de confidentialité.',
    frequency: 'quarterly',
    category: 'legal',
    priority: 'medium',
    estimatedTime: '30 min',
  },
  {
    id: 'check-cookie-consent',
    title: '🍪 Vérifier le consentement cookies',
    description: 'S\'assurer que le banner cookie fonctionne correctement.',
    frequency: 'quarterly',
    category: 'legal',
    priority: 'medium',
    estimatedTime: '10 min',
  },

  // === INFRASTRUCTURE ===
  {
    id: 'update-dependencies',
    title: '📦 Mettre à jour les dépendances',
    description: 'Mettre à jour Next.js, React, et autres dépendances majeures.',
    frequency: 'monthly',
    category: 'infrastructure',
    priority: 'medium',
    estimatedTime: '1h',
  },
  {
    id: 'check-ssl-certificates',
    title: '🔐 Vérifier les certificats SSL',
    description: 'S\'assurer que les certificats ne vont pas expirer (Vercel gère auto mais vérifier).',
    frequency: 'monthly',
    category: 'infrastructure',
    priority: 'high',
    links: ['https://www.ssllabs.com/ssltest/'],
    estimatedTime: '5 min',
  },
  {
    id: 'check-domain-expiry',
    title: '🌐 Vérifier l\'expiration du domaine',
    description: 'S\'assurer que le domaine instadeco.app ne va pas expirer.',
    frequency: 'quarterly',
    category: 'infrastructure',
    priority: 'critical',
    estimatedTime: '5 min',
  },
  {
    id: 'review-error-tracking',
    title: '🐛 Analyser les erreurs en production',
    description: 'Vérifier les logs Vercel pour les erreurs récurrentes.',
    frequency: 'weekly',
    category: 'infrastructure',
    priority: 'high',
    links: ['https://vercel.com/dashboard'],
    estimatedTime: '15 min',
  },
  {
    id: 'test-critical-flows',
    title: '🧪 Tester les parcours critiques',
    description: 'Tester manuellement: inscription, génération, paiement, téléchargement HD.',
    frequency: 'biweekly',
    category: 'infrastructure',
    priority: 'critical',
    estimatedTime: '30 min',
  },

  // === SCALING (pour plus tard) ===
  {
    id: 'check-scaling-needs',
    title: '📈 Évaluer les besoins de scaling',
    description: 'Vérifier si les limites Supabase/Vercel approchent. Planifier les upgrades. ⚠️ Passer à Supabase Pro (25$/mois) quand: 50+ utilisateurs actifs OU 200MB+ stockage OU 500MB+ base de données.',
    frequency: 'monthly',
    category: 'infrastructure',
    priority: 'medium',
    links: ['https://supabase.com/dashboard/project/_/settings/billing/usage', 'https://vercel.com/dashboard'],
    estimatedTime: '20 min',
  },
];

// Calcul des tâches dues
function getTasksDueToday(): MaintenanceTask[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi
  const dayOfMonth = today.getDate();
  const month = today.getMonth(); // 0-11
  
  return MAINTENANCE_TASKS.filter(task => {
    switch (task.frequency) {
      case 'weekly':
        // Chaque lundi
        return dayOfWeek === 1;
      
      case 'biweekly':
        // 1er et 15 du mois
        return dayOfMonth === 1 || dayOfMonth === 15;
      
      case 'monthly':
        // 1er du mois
        return dayOfMonth === 1;
      
      case 'quarterly':
        // 1er janvier, avril, juillet, octobre
        return dayOfMonth === 1 && [0, 3, 6, 9].includes(month);
      
      case 'yearly':
        // 1er janvier
        return dayOfMonth === 1 && month === 0;
      
      default:
        return false;
    }
  });
}

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, number> = {
  security: 0xFF6B6B,      // Rouge
  performance: 0x4ECDC4,   // Turquoise
  business: 0xFFE66D,      // Jaune
  legal: 0x95E1D3,         // Vert clair
  infrastructure: 0xA78BFA, // Violet
};

// Emoji par priorité
const PRIORITY_EMOJI: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
};

// Envoyer les rappels Discord
async function sendMaintenanceReminder(tasks: MaintenanceTask[]): Promise<void> {
  if (!DISCORD_WEBHOOK_URL || tasks.length === 0) return;

  // Grouper par catégorie
  const grouped = tasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, MaintenanceTask[]>);

  // Calculer le temps total estimé
  const totalTime = tasks.reduce((sum, t) => {
    const match = t.estimatedTime.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  const embeds = Object.entries(grouped).map(([category, categoryTasks]) => ({
    title: `${getCategoryEmoji(category)} ${getCategoryName(category)}`,
    color: CATEGORY_COLORS[category] || 0x808080,
    fields: categoryTasks.map(task => ({
      name: `${PRIORITY_EMOJI[task.priority]} ${task.title}`,
      value: [
        task.description,
        `⏱️ *${task.estimatedTime}*`,
        task.links ? `🔗 ${task.links.join(' | ')}` : '',
      ].filter(Boolean).join('\n'),
      inline: false,
    })),
  }));

  // Format date suisse (DD.MM.YYYY)
  const formatDateSuisse = (date: Date): string => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${days[date.getDay()]} ${day}.${month}.${year}`;
  };

  // Message principal
  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'InstaDeco Ops',
      avatar_url: 'https://instadeco.app/images/logo.png',
      content: `## 🛠️ InstaDeco Ops - ${formatDateSuisse(new Date())}\n\n**${tasks.length} tâches** à effectuer | **~${totalTime} min** estimées`,
      embeds: embeds.slice(0, 10), // Discord limite à 10 embeds
    }),
  });
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    security: '🔒',
    performance: '⚡',
    business: '💼',
    legal: '⚖️',
    infrastructure: '🏗️',
  };
  return emojis[category] || '📋';
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    security: 'Sécurité',
    performance: 'Performance',
    business: 'Business',
    legal: 'Légal & RGPD',
    infrastructure: 'Infrastructure',
  };
  return names[category] || category;
}

export async function GET(request: Request) {
  // Vérifier le secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tasksDue = getTasksDueToday();
    
    if (tasksDue.length > 0) {
      await sendMaintenanceReminder(tasksDue);
      
      return NextResponse.json({
        success: true,
        tasksCount: tasksDue.length,
        tasks: tasksDue.map(t => ({ id: t.id, title: t.title, priority: t.priority })),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Aucune tâche de maintenance prévue aujourd\'hui',
      nextTasks: getNextScheduledTasks(),
    });

  } catch (error) {
    console.error('Erreur maintenance-reminder:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des rappels' },
      { status: 500 }
    );
  }
}

// Prévisualiser les prochaines tâches
function getNextScheduledTasks() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();
  
  // Jours jusqu'au prochain lundi
  const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  // Jours jusqu'au 1er du mois prochain
  const daysToFirstOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).getDate() - dayOfMonth;
  
  return {
    nextWeekly: `dans ${daysToMonday} jour(s)`,
    nextMonthly: `dans ${daysToFirstOfMonth} jour(s)`,
    weeklyTasksCount: MAINTENANCE_TASKS.filter(t => t.frequency === 'weekly').length,
    monthlyTasksCount: MAINTENANCE_TASKS.filter(t => t.frequency === 'monthly').length,
  };
}
