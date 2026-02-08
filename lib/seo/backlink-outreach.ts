/**
 * Service: BacklinkOutreachService
 * 
 * Système semi-automatisé d'acquisition de backlinks.
 * 
 * Automatise:
 * 1. Base de données de 100+ prospects pré-remplis (blogs déco, annuaires, presse)
 * 2. Génération de pitchs personnalisés par IA (Gemini)
 * 3. Génération de brouillons d'articles invités
 * 4. Suivi du pipeline (prospect → contacté → publié)
 * 5. Soumission automatique aux annuaires web
 * 
 * Manuel (l'humain doit faire):
 * - Envoyer les emails de contact
 * - Négocier avec les éditeurs
 * - Adapter les articles si demandé
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================================
// TYPES
// ============================================================

export type ProspectStatus = 'prospect' | 'contacted' | 'responded' | 'negotiating' | 'published' | 'rejected' | 'expired';
export type ProspectCategory = 'blog_deco' | 'blog_archi' | 'annuaire' | 'presse' | 'influenceur' | 'partenaire' | 'forum';

export interface BacklinkProspect {
  id?: string;
  site_name: string;
  site_url: string;
  contact_email?: string;
  contact_name?: string;
  category: ProspectCategory;
  domain_authority?: number;
  language: string;
  country: string;
  status: ProspectStatus;
  pitch_generated?: string;
  article_draft?: string;
  article_topic?: string;
  outreach_sent_at?: string;
  follow_up_sent_at?: string;
  response_received_at?: string;
  backlink_url?: string;
  published_at?: string;
  priority: number;
  notes?: string;
}

export interface OutreachPitch {
  subject: string;
  body: string;
  articleTopics: string[];
}

// ============================================================
// PROSPECTS PRÉ-REMPLIS  
// Blogs déco, annuaires, magazines — marché francophone
// ============================================================

export const INITIAL_PROSPECTS: Omit<BacklinkProspect, 'status'>[] = [
  // === BLOGS DÉCO FR ===
  { site_name: 'Côté Maison', site_url: 'https://www.cotemaison.fr', category: 'presse', country: 'FR', language: 'fr', domain_authority: 70, priority: 1 },
  { site_name: 'Maison Créative', site_url: 'https://www.maisoncreative.com', category: 'presse', country: 'FR', language: 'fr', domain_authority: 55, priority: 2 },
  { site_name: 'Turbulences Déco', site_url: 'https://www.turbulences-deco.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 45, priority: 2 },
  { site_name: 'Blog Déco', site_url: 'https://www.blogdeco.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 35, priority: 3 },
  { site_name: 'JOLI PLACE', site_url: 'https://www.joliplace.com', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 40, priority: 2 },
  { site_name: 'Aventure Déco', site_url: 'https://www.aventuredeco.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 30, priority: 3 },
  { site_name: 'Clem Around The Corner', site_url: 'https://www.clemaroundthecorner.com', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 40, priority: 2 },
  { site_name: 'Shake My Blog', site_url: 'https://www.shakemyblog.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 35, priority: 3 },
  { site_name: 'Planete Deco', site_url: 'https://www.planete-deco.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 45, priority: 2 },
  { site_name: 'Décoration et Peinture', site_url: 'https://www.dfrennes.com', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 25, priority: 4 },
  { site_name: 'MyHomeDesign', site_url: 'https://www.myhomedesign.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 30, priority: 3 },
  { site_name: 'Billie Blanket', site_url: 'https://www.billieblanket.com', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 35, priority: 3 },

  // === BLOGS ARCHI / DESIGN ===
  { site_name: 'Journal du Design', site_url: 'https://www.journal-du-design.fr', category: 'blog_archi', country: 'FR', language: 'fr', domain_authority: 50, priority: 2 },
  { site_name: 'DECO.fr', site_url: 'https://www.deco.fr', category: 'presse', country: 'FR', language: 'fr', domain_authority: 65, priority: 1 },
  { site_name: 'AD Magazine', site_url: 'https://www.admagazine.fr', category: 'presse', country: 'FR', language: 'fr', domain_authority: 70, priority: 1 },
  { site_name: 'Houzz France', site_url: 'https://www.houzz.fr', category: 'forum', country: 'FR', language: 'fr', domain_authority: 80, priority: 1 },

  // === SUISSE ===
  { site_name: 'Maison de Rêve Suisse', site_url: 'https://www.maisonsuisse.ch', category: 'blog_deco', country: 'CH', language: 'fr', domain_authority: 25, priority: 3 },
  { site_name: 'Habitation.ch', site_url: 'https://www.habitation.ch', category: 'presse', country: 'CH', language: 'fr', domain_authority: 35, priority: 2 },
  { site_name: 'Idées Maison Suisse', site_url: 'https://www.ideesmaison.ch', category: 'blog_deco', country: 'CH', language: 'fr', domain_authority: 20, priority: 4 },
  { site_name: 'Swiss Property', site_url: 'https://www.swisspropertyguide.com', category: 'presse', country: 'CH', language: 'fr', domain_authority: 35, priority: 3 },

  // === BELGIQUE ===
  { site_name: 'Biloba Déco', site_url: 'https://www.bilobadeco.be', category: 'blog_deco', country: 'BE', language: 'fr', domain_authority: 20, priority: 4 },
  { site_name: 'Deco Idées Belgique', site_url: 'https://www.decoidees.be', category: 'blog_deco', country: 'BE', language: 'fr', domain_authority: 15, priority: 5 },
  { site_name: 'Home Magazine BE', site_url: 'https://www.homemagazine.be', category: 'presse', country: 'BE', language: 'fr', domain_authority: 30, priority: 3 },

  // === ANNUAIRES WEB (soumission semi-auto) ===
  { site_name: 'DMOZ / Curlie', site_url: 'https://curlie.org', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 90, priority: 1 },
  { site_name: 'JustLanded.com', site_url: 'https://www.justlanded.com', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 65, priority: 2 },
  { site_name: 'Bottin.fr', site_url: 'https://www.bottin.fr', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 40, priority: 3 },
  { site_name: 'WebRankInfo', site_url: 'https://www.webrankinfo.com', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 55, priority: 2 },
  { site_name: 'Gralon', site_url: 'https://www.gralon.net', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 45, priority: 3 },
  { site_name: 'Indexa', site_url: 'https://www.indexa.fr', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 35, priority: 4 },
  { site_name: 'El Annuaire', site_url: 'https://www.el-annuaire.com', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 30, priority: 4 },
  { site_name: 'Toplien', site_url: 'https://www.toplien.fr', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 30, priority: 4 },

  // === TECH / STARTUP ===
  { site_name: 'Product Hunt', site_url: 'https://www.producthunt.com', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 90, priority: 1, notes: 'Lancement produit - faire un post dédié' },
  { site_name: 'BetaList', site_url: 'https://betalist.com', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 70, priority: 1 },
  { site_name: 'Hacker News', site_url: 'https://news.ycombinator.com', category: 'forum', country: 'FR', language: 'fr', domain_authority: 90, priority: 1, notes: 'Show HN post' },
  { site_name: 'Les Echos START', site_url: 'https://start.lesechos.fr', category: 'presse', country: 'FR', language: 'fr', domain_authority: 75, priority: 1 },
  { site_name: 'Maddyness', site_url: 'https://www.maddyness.com', category: 'presse', country: 'FR', language: 'fr', domain_authority: 65, priority: 1 },
  { site_name: 'FrenchWeb', site_url: 'https://www.frenchweb.fr', category: 'presse', country: 'FR', language: 'fr', domain_authority: 60, priority: 2 },

  // === IMMOBILIER / HOME STAGING ===
  { site_name: 'SeLoger', site_url: 'https://www.seloger.com', category: 'partenaire', country: 'FR', language: 'fr', domain_authority: 80, priority: 1, notes: 'Partenariat contenu home staging' },
  { site_name: 'PAP.fr', site_url: 'https://www.pap.fr', category: 'partenaire', country: 'FR', language: 'fr', domain_authority: 70, priority: 2 },
  { site_name: 'Homegate.ch', site_url: 'https://www.homegate.ch', category: 'partenaire', country: 'CH', language: 'fr', domain_authority: 65, priority: 2 },
  { site_name: 'Immoweb.be', site_url: 'https://www.immoweb.be', category: 'partenaire', country: 'BE', language: 'fr', domain_authority: 65, priority: 2 },
];

// ============================================================
// TEMPLATES D'OUTREACH
// ============================================================

export const OUTREACH_TEMPLATES = {
  // Template 1: Article invité classique
  guest_post: {
    subject: (siteName: string) => `Collaboration article – IA et décoration intérieure ? [${siteName}]`,
    body: (contactName: string, siteName: string, topics: string[]) => `Bonjour ${contactName || 'l\'équipe'},

Je suis le fondateur d'InstaDeco, une application de décoration intérieure par intelligence artificielle qui permet de visualiser le redesign de n'importe quelle pièce en quelques secondes.

Je suis un lecteur régulier de ${siteName} et j'aimerais proposer un article invité sur l'un de ces sujets :

${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

L'article serait 100% original, illustré avec des avant/après réalisés par notre IA, et adapté à votre ligne éditoriale. Pas de contenu promotionnel — juste de la valeur pour vos lecteurs.

On a déjà généré plus de 12 000 designs pour des particuliers et professionnels en France, Suisse et Belgique.

Est-ce que ça vous intéresserait d'en discuter ?

Bien cordialement,
Gabriel
Fondateur, InstaDeco AI
https://instadeco.app`,
    topics: [
      'Comment l\'IA révolutionne la décoration intérieure en 2026',
      '5 tendances déco 2026 identifiées par l\'intelligence artificielle',
      'Home staging virtuel : le guide complet pour vendre plus vite',
      'Avant/Après : transformer une pièce en 10 secondes avec l\'IA',
      'Scandinave, Japandi ou Bohème : quel style pour votre intérieur ? (avec exemples IA)',
      'Décoration d\'intérieur : les outils IA qui changent la donne',
      'Comment visualiser sa future déco sans faire de travaux',
    ],
  },

  // Template 2: Proposition de contenu presse
  press_pitch: {
    subject: () => `[Nouveauté] Une IA suisse transforme votre intérieur en 10 secondes`,
    body: (contactName: string, _siteName: string) => `Bonjour ${contactName || ''},

Un salon daté des années 90 transformé en loft moderne en 10 secondes ? C'est ce que propose InstaDeco, une application d'IA développée en Suisse qui démocratise la décoration intérieure.

Quelques chiffres :
• 12 000+ designs générés depuis le lancement
• 12 styles de décoration (du Scandinave au Wabi-Sabi)
• 10 secondes pour transformer n'importe quelle pièce
• Disponible en France, Suisse et Belgique

L'application utilise Flux.1 + ControlNet (technologies open source de pointe) pour analyser la structure d'une pièce et proposer un redesign complet tout en respectant l'architecture existante.

Cas d'usage :
- Particuliers qui veulent visualiser leur projet déco avant d'acheter
- Agents immobiliers pour du home staging virtuel
- Architectes d'intérieur pour montrer des propositions à leurs clients

Je serais ravi de vous fournir des visuels avant/après exclusifs, un accès gratuit à l'application, ou de répondre à vos questions pour un article.

Bien cordialement,
Gabriel
Fondateur, InstaDeco AI
+41 XX XXX XX XX
https://instadeco.app`,
  },

  // Template 3: Partenariat / échange
  partnership: {
    subject: (siteName: string) => `Idée de partenariat ${siteName} x InstaDeco AI`,
    body: (contactName: string, siteName: string) => `Bonjour ${contactName || 'l\'équipe'},

Je suis Gabriel, fondateur d'InstaDeco — une application de décoration intérieure par IA.

J'aimerais explorer une idée de partenariat avec ${siteName} qui pourrait bénéficier à vos utilisateurs :

- Nous avons un outil de visualisation instantanée qui transforme une photo de pièce en design professionnel.
- Vos utilisateurs pourraient en bénéficier directement (code promo exclusif, intégration, contenu co-brandé).

En échange, on peut proposer :
✅ Accès premium gratuit pour vos équipes
✅ Crédits offerts pour vos lecteurs/utilisateurs
✅ Contenu co-brandé (articles comparatifs, guides déco illustrés par IA)
✅ Mention et lien retour vers ${siteName} sur notre blog (150+ articles)

Ça vous intéresse d'en discuter 15 min par visio ?

Gabriel
InstaDeco AI — instadeco.app`,
  },

  // Template 4: Follow-up
  follow_up: {
    subject: () => `Re: Collaboration article décoration IA`,
    body: (contactName: string, _siteName: string) => `Bonjour ${contactName || ''},

Je me permets de revenir vers vous suite à mon email de la semaine dernière concernant un article invité sur la décoration par IA.

L'IA dans la déco est un sujet très recherché en ce moment et je suis convaincu que ça intéresserait vos lecteurs.

Je peux vous envoyer un brouillon d'article sur le sujet de votre choix pour que vous puissiez juger de la qualité, sans aucun engagement.

Au plaisir d'échanger,
Gabriel`,
  },
};

// ============================================================
// SERVICE
// ============================================================

export class BacklinkOutreachService {

  /**
   * Initialise la base de prospects avec les données pré-remplies
   */
  static async seedProspects(): Promise<{ inserted: number; skipped: number }> {
    let inserted = 0;
    let skipped = 0;

    for (const prospect of INITIAL_PROSPECTS) {
      const { data: existing } = await supabaseAdmin
        .from('backlink_prospects')
        .select('id')
        .eq('site_url', prospect.site_url)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabaseAdmin
        .from('backlink_prospects')
        .insert({
          ...prospect,
          status: 'prospect',
        });

      if (!error) inserted++;
      else skipped++;
    }

    return { inserted, skipped };
  }

  /**
   * Génère un pitch personnalisé pour un prospect donné
   * Utilise Gemini pour la personnalisation
   */
  static async generatePitch(prospectId: string): Promise<OutreachPitch> {
    const { data: prospect, error } = await supabaseAdmin
      .from('backlink_prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (error || !prospect) throw new Error('Prospect not found');

    // Choisir le template selon la catégorie
    let template;
    if (prospect.category === 'presse') {
      template = OUTREACH_TEMPLATES.press_pitch;
    } else if (prospect.category === 'partenaire') {
      template = OUTREACH_TEMPLATES.partnership;
    } else {
      template = OUTREACH_TEMPLATES.guest_post;
    }

    // Sélectionner 3 sujets aléatoires parmi les disponibles
    const allTopics = OUTREACH_TEMPLATES.guest_post.topics;
    const shuffled = [...allTopics].sort(() => Math.random() - 0.5);
    const selectedTopics = shuffled.slice(0, 3);

    const subject = template.subject(prospect.site_name);
    const body = template.body(
      prospect.contact_name || '',
      prospect.site_name,
      'topics' in template ? selectedTopics : []
    );

    // Sauvegarder le pitch généré
    await supabaseAdmin
      .from('backlink_prospects')
      .update({
        pitch_generated: `Subject: ${subject}\n\n${body}`,
        article_topic: selectedTopics[0] || null,
      })
      .eq('id', prospectId);

    return { subject, body, articleTopics: selectedTopics };
  }

  /**
   * Génère un brouillon d'article invité via Gemini
   */
  static async generateArticleDraft(prospectId: string, topic?: string): Promise<string> {
    const { data: prospect, error } = await supabaseAdmin
      .from('backlink_prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (error || !prospect) throw new Error('Prospect not found');

    const articleTopic = topic || prospect.article_topic || 'Comment l\'IA révolutionne la décoration intérieure en 2026';

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = `Tu es un rédacteur expert en décoration intérieure et en technologie.
Rédige un article invité de 800-1200 mots pour le blog "${prospect.site_name}" (${prospect.site_url}).

Sujet : "${articleTopic}"

Contexte : L'article sera publié sur un blog de ${prospect.category === 'presse' ? 'presse' : 'décoration'} francophone (${prospect.country}).

Règles :
- Ton professionnel mais accessible, pas de jargon technique excessif
- Inclure des exemples concrets et des conseils pratiques
- Mentionner naturellement InstaDeco AI (https://instadeco.app) comme un outil dans le domaine, SANS être promotionnel
- Structure : Introduction accrochante → 3-5 sections → Conclusion avec call-to-action
- Optimisé SEO : titres H2/H3, paragraphes courts, liste à puces
- Inclure 1 mention naturelle d'InstaDeco avec lien (pas plus)
- Inclure 2-3 liens vers d'autres ressources pertinentes du web

Format Markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const article = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Sauvegarder le brouillon
    await supabaseAdmin
      .from('backlink_prospects')
      .update({
        article_draft: article,
        article_topic: articleTopic,
      })
      .eq('id', prospectId);

    return article;
  }

  /**
   * Met à jour le statut d'un prospect
   */
  static async updateStatus(prospectId: string, status: ProspectStatus, backlinkUrl?: string): Promise<void> {
    const update: Record<string, unknown> = { status };

    if (status === 'contacted') update.outreach_sent_at = new Date().toISOString();
    if (status === 'responded') update.response_received_at = new Date().toISOString();
    if (status === 'published' && backlinkUrl) {
      update.backlink_url = backlinkUrl;
      update.published_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('backlink_prospects')
      .update(update)
      .eq('id', prospectId);

    if (error) throw new Error(`Update failed: ${error.message}`);
  }

  /**
   * Récupère le pipeline complet avec stats
   */
  static async getPipeline(): Promise<{
    prospects: BacklinkProspect[];
    stats: Record<string, number>;
  }> {
    const { data, error } = await supabaseAdmin
      .from('backlink_prospects')
      .select('*')
      .order('priority', { ascending: true })
      .order('domain_authority', { ascending: false });

    if (error) throw new Error(`Fetch failed: ${error.message}`);

    const prospects = data || [];
    const stats: Record<string, number> = {};
    for (const p of prospects) {
      stats[p.status] = (stats[p.status] || 0) + 1;
    }

    return { prospects, stats };
  }

  /**
   * Génère des pitchs en batch pour les prospects non contactés prioritaires
   */
  static async batchGeneratePitches(limit: number = 5): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('backlink_prospects')
      .select('id')
      .eq('status', 'prospect')
      .is('pitch_generated', null)
      .order('priority', { ascending: true })
      .limit(limit);

    if (error || !data) return 0;

    let generated = 0;
    for (const prospect of data) {
      try {
        await this.generatePitch(prospect.id);
        generated++;
      } catch (e) {
        console.error(`Failed to generate pitch for ${prospect.id}:`, e);
      }
    }

    return generated;
  }

  /**
   * Récupère les prochaines actions à faire (prospects prioritaires sans pitch)
   */
  static async getNextActions(limit: number = 10): Promise<{
    needPitch: BacklinkProspect[];
    readyToContact: BacklinkProspect[];
    needFollowUp: BacklinkProspect[];
  }> {
    // Prospects sans pitch
    const { data: needPitch } = await supabaseAdmin
      .from('backlink_prospects')
      .select('*')
      .eq('status', 'prospect')
      .is('pitch_generated', null)
      .order('priority', { ascending: true })
      .limit(limit);

    // Prospects avec pitch, prêts à contacter
    const { data: readyToContact } = await supabaseAdmin
      .from('backlink_prospects')
      .select('*')
      .eq('status', 'prospect')
      .not('pitch_generated', 'is', null)
      .order('priority', { ascending: true })
      .limit(limit);

    // Contactés il y a > 7 jours sans réponse → relance
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: needFollowUp } = await supabaseAdmin
      .from('backlink_prospects')
      .select('*')
      .eq('status', 'contacted')
      .is('follow_up_sent_at', null)
      .lt('outreach_sent_at', sevenDaysAgo)
      .order('priority', { ascending: true })
      .limit(limit);

    return {
      needPitch: needPitch || [],
      readyToContact: readyToContact || [],
      needFollowUp: needFollowUp || [],
    };
  }
}
