/**
 * Script: backfill d'articles de blog par langue (EN/DE).
 *
 * Génère en lot N articles natifs par langue en réutilisant EXACTEMENT le pipeline
 * de la route cron (`app/api/cron/generate-articles/route.ts`) :
 *   sélection de thème (anti-cannibalisation) → Gemini → anti-AI → liens internes → save → notif SEO.
 *
 * Contrairement au cron (1 article/exécution, plafonné à 60s par Vercel), ce script tourne
 * en local sans limite de durée → idéal pour remplir /en/blog et /de/blog d'un coup.
 *
 * Pré-requis dans .env.local :
 *   - GEMINI_API_KEY (clé VALIDE, non révoquée)
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage :
 *   npx tsx scripts/backfill-blog.ts                       # 20 EN + 20 DE, publiés
 *   npx tsx scripts/backfill-blog.ts --lang=en --count=10  # 10 EN seulement
 *   npx tsx scripts/backfill-blog.ts --status=draft        # en brouillon
 *   npx tsx scripts/backfill-blog.ts --dry-run             # sélectionne les thèmes sans rien générer/écrire
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { randomUUID } from 'node:crypto';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { SupabaseBlogArticleRepository } from '@/src/infrastructure/repositories/SupabaseBlogArticleRepository';
import { GeminiAIContentService } from '@/src/infrastructure/services/GeminiAIContentService';
import { AntiAIPostProcessor } from '@/src/infrastructure/services/AntiAIPostProcessor';
import { InternalLinksService } from '@/src/infrastructure/services/InternalLinksService';
import { SEONotificationService } from '@/src/infrastructure/services/SEONotificationService';
import { selectRandomTheme, getSessionTypeFromTime, type BlogTheme } from '@/src/shared/constants/blog-themes';
import {
  createBlogArticle,
  generateSlug,
  ARTICLE_LANGUAGES,
  type ArticleLanguage,
  type ArticleStatusType,
} from '@/src/domain/entities/BlogArticle';

// ---------- Args CLI ----------
function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found?.slice(prefix.length);
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

const DRY_RUN = hasFlag('dry-run');
const COUNT = Math.max(1, parseInt(getArg('count') ?? '20', 10));
const DELAY_MS = Math.max(0, parseInt(getArg('delay') ?? '1500', 10));
const STATUS = ((getArg('status') ?? 'published') as ArticleStatusType);
const LANGS = (getArg('lang') ?? 'en,de')
  .split(',')
  .map((l) => l.trim())
  .filter((l): l is ArticleLanguage => (ARTICLE_LANGUAGES as string[]).includes(l));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildInstructions(theme: BlogTheme, titlesToAvoid: string[]): string {
  const avoid = titlesToAvoid.slice(0, 25).map((t) => `- "${t}"`).join('\n');
  return `Mots-clés secondaires à intégrer: ${theme.secondaryKeywords.join(', ')}. Type de contenu: ${theme.themeType}. Cible: ${theme.targetCountry === 'ALL' ? 'Suisse, France, Belgique' : theme.targetCountry}. IMPORTANT: Inclure des prix réels de produits (IKEA, Maisons du Monde, La Redoute — adaptés au marché de la langue cible), des dimensions concrètes, et au moins 1 tableau comparatif HTML. Le titre doit être EVERGREEN (pas de date). Chaque conseil doit être ACTIONNABLE immédiatement.

⚠️ TITRES INTERDITS — Ces titres existent déjà sur notre blog. Ton titre doit être COMPLÈTEMENT DIFFÉRENT (angle, formulation, accroche). N'en reprends AUCUN ni une formulation proche :
${avoid || '(aucun)'}

Crée un titre avec un ANGLE UNIQUE : chiffre précis, question provocante, formule originale, erreur à éviter, secret de pro, etc.`;
}

async function main() {
  console.log('🗞  Backfill blog —', { langs: LANGS, count: COUNT, status: STATUS, dryRun: DRY_RUN });

  if (LANGS.length === 0) {
    console.error('❌ Aucune langue valide (--lang=en,de). Langues supportées:', ARTICLE_LANGUAGES.join(', '));
    process.exit(1);
  }

  // ---------- Mode dry-run : sélection de thèmes uniquement ----------
  if (DRY_RUN) {
    for (const lang of LANGS) {
      const used: string[] = [];
      console.log(`\n=== [${lang}] ${COUNT} thèmes sélectionnés ===`);
      for (let i = 0; i < COUNT; i++) {
        const theme = selectRandomTheme(used);
        if (!theme) { console.warn(`  (plus de thèmes distincts après ${i})`); break; }
        used.push(theme.primaryKeyword);
        console.log(`  ${String(i + 1).padStart(2, '0')}. ${theme.primaryKeyword}  [${theme.themeType}/${theme.category}]`);
      }
    }
    console.log('\n✅ Dry-run terminé. Aucune génération, aucune écriture.');
    return;
  }

  // ---------- Garde-fous env ----------
  const missing = ['GEMINI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter(
    (v) => !process.env[v],
  );
  if (missing.length) {
    console.error('❌ Variables manquantes dans .env.local:', missing.join(', '));
    process.exit(1);
  }

  const repository = new SupabaseBlogArticleRepository();
  const aiService = new GeminiAIContentService();
  const antiAIProcessor = new AntiAIPostProcessor();
  const linksService = new InternalLinksService(repository);
  const seoService = new SEONotificationService();

  if (!(await aiService.isAvailable())) {
    console.error('❌ Service Gemini indisponible (clé manquante, invalide ou révoquée). Abandon.');
    process.exit(1);
  }

  const sessionType = getSessionTypeFromTime();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://instadeco.app';

  let totalOk = 0;
  let totalFail = 0;

  for (const language of LANGS) {
    console.log(`\n=== Langue: ${language} (objectif ${COUNT}) ===`);

    // Titres existants à éviter (toutes langues confondues, comme le cron)
    const { data: recent } = await repository.findMany(
      { status: 'published' },
      { limit: 80, sortBy: 'publishedAt', sortOrder: 'desc' },
    );
    const titlesToAvoid: string[] = recent.map((a) => a.title);
    const usedKeywords: string[] = [];

    for (let i = 0; i < COUNT; i++) {
      const theme = selectRandomTheme(usedKeywords);
      if (!theme) {
        console.warn(`  [${language}] Plus de thèmes distincts disponibles (généré ${i}/${COUNT}).`);
        break;
      }
      usedKeywords.push(theme.primaryKeyword);
      const label = `[${language} ${i + 1}/${COUNT}] "${theme.primaryKeyword}"`;

      try {
        const generated = await aiService.generateArticle({
          theme: theme.primaryKeyword,
          targetLanguage: language,
          sessionType,
          minWords: 2000,
          temperature: 0.75,
          additionalInstructions: buildInstructions(theme, titlesToAvoid),
        });

        const antiAI = await antiAIProcessor.process(generated.content);
        const linked = await linksService.addInternalLinks(antiAI.content, undefined, theme.themeType, 5);

        let slug = generateSlug(generated.title);
        if (await repository.slugExists(slug, language)) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }

        const article = createBlogArticle({
          id: randomUUID(),
          title: generated.title,
          slug,
          content: linked.content,
          metaDescription: generated.metaDescription,
          tags: generated.tags,
          status: STATUS,
          sessionType,
          antiAIScore: Math.round(antiAI.score),
          source: 'automation',
          language,
        });

        const saved = await repository.save(article);
        titlesToAvoid.unshift(saved.title);

        let seoMsg = '(brouillon — pas de notif)';
        if (STATUS === 'published') {
          const url = `${siteUrl}/${language}/blog/${saved.slug}`;
          const seo = await seoService.notifyAll(url);
          seoMsg = `SEO ${seo.filter((r) => r.success).length}/${seo.length}`;
        }

        totalOk++;
        console.log(`  ✅ ${label} → "${saved.title}" | ${saved.wordCount} mots | anti-AI ${Math.round(antiAI.score)} | +${linked.linksAdded} liens | ${seoMsg}`);
      } catch (err) {
        totalFail++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ ${label} → ÉCHEC: ${msg}`);
      }

      if (i < COUNT - 1) await sleep(DELAY_MS);
    }
  }

  console.log(`\n🏁 Terminé. ${totalOk} articles créés, ${totalFail} échecs.`);
  if (totalFail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error('💥 Erreur fatale:', e instanceof Error ? e.message : e);
  process.exit(1);
});
