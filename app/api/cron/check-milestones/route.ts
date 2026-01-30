import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vérification cron secret
const CRON_SECRET = process.env.CRON_SECRET;

// Webhook Discord (gratuit!)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Seuils de notification
const MILESTONES = [
  { users: 100, message: "🎉 100 utilisateurs inscrits !", action: null },
  { users: 500, message: "🚀 500 utilisateurs ! La croissance continue.", action: null },
  { users: 1000, message: "⚠️ 1000 UTILISATEURS ATTEINTS !", action: "🔧 **ACTION REQUISE**: Migrer le rate-limiter vers Upstash Redis pour supporter le trafic." },
  { users: 2500, message: "🔥 2500 utilisateurs !", action: "📊 Considérer un upgrade Vercel Pro si pas déjà fait." },
  { users: 5000, message: "💎 5000 utilisateurs !", action: "🗄️ Vérifier les performances Supabase, considérer un upgrade." },
  { users: 10000, message: "🏆 10 000 UTILISATEURS !", action: "🎊 Tu as réussi ! Temps de scaler l'infrastructure sérieusement." },
];

// Métriques à surveiller
interface Metrics {
  totalUsers: number;
  activeUsersLast7Days: number;
  totalGenerations: number;
  generationsToday: number;
  totalRevenue: number;
}

async function getMetrics(): Promise<Metrics> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Requêtes parallèles pour les métriques
  const [
    { count: totalUsers },
    { count: activeUsersLast7Days },
    { count: totalGenerations },
    { count: generationsToday },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', sevenDaysAgo),
    supabase.from('generations').select('*', { count: 'exact', head: true }),
    supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('credit_transactions').select('amount_paid').eq('type', 'purchase'),
  ]);

  const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount_paid || 0), 0) || 0;

  return {
    totalUsers: totalUsers || 0,
    activeUsersLast7Days: activeUsersLast7Days || 0,
    totalGenerations: totalGenerations || 0,
    generationsToday: generationsToday || 0,
    totalRevenue: totalRevenue / 100, // Convertir centimes en euros
  };
}

async function getLastNotifiedMilestone(): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'last_notified_milestone')
    .single();

  return data?.value ? parseInt(data.value) : 0;
}

async function setLastNotifiedMilestone(milestone: number): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from('app_settings')
    .upsert({ 
      key: 'last_notified_milestone', 
      value: milestone.toString(),
      updated_at: new Date().toISOString()
    });
}

async function sendDiscordNotification(
  milestone: typeof MILESTONES[0],
  metrics: Metrics
): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook non configuré, notification ignorée');
    return;
  }

  const embed = {
    title: milestone.message,
    color: milestone.users >= 1000 ? 0xFF6B6B : 0x4ECDC4, // Rouge si action requise, sinon vert
    fields: [
      {
        name: "📊 Métriques Actuelles",
        value: [
          `👥 **Utilisateurs totaux**: ${metrics.totalUsers.toLocaleString('fr-FR')}`,
          `🟢 **Actifs (7 jours)**: ${metrics.activeUsersLast7Days.toLocaleString('fr-FR')}`,
          `🎨 **Générations totales**: ${metrics.totalGenerations.toLocaleString('fr-FR')}`,
          `📅 **Générations aujourd'hui**: ${metrics.generationsToday.toLocaleString('fr-FR')}`,
          `💰 **Revenus totaux**: ${metrics.totalRevenue.toLocaleString('fr-FR')}€`,
        ].join('\n'),
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "InstaDeco Analytics",
    },
  };

  // Ajouter l'action requise si présente
  if (milestone.action) {
    embed.fields.push({
      name: "⚡ Action Requise",
      value: milestone.action,
      inline: false,
    });
  }

  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: "InstaDeco Bot",
      avatar_url: "https://instadeco.app/images/logo.png",
      embeds: [embed],
    }),
  });
}

export async function GET(request: Request) {
  // Vérifier le secret cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const metrics = await getMetrics();
    const lastNotified = await getLastNotifiedMilestone();

    // Trouver le prochain milestone atteint mais pas encore notifié
    const nextMilestone = MILESTONES.find(
      m => metrics.totalUsers >= m.users && m.users > lastNotified
    );

    if (nextMilestone) {
      await sendDiscordNotification(nextMilestone, metrics);
      await setLastNotifiedMilestone(nextMilestone.users);

      return NextResponse.json({
        success: true,
        milestone: nextMilestone.users,
        message: nextMilestone.message,
        metrics,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pas de nouveau milestone atteint',
      currentUsers: metrics.totalUsers,
      nextMilestone: MILESTONES.find(m => m.users > metrics.totalUsers)?.users || 'Tous atteints!',
      metrics,
    });

  } catch (error) {
    console.error('Erreur check-milestones:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification des milestones' },
      { status: 500 }
    );
  }
}
