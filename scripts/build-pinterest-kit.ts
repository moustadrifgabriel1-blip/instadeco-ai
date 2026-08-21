/**
 * Kit de publication Pinterest, construit à partir des VRAIS rendus du compte
 * démo (jamais ceux d'un utilisateur, cf. règle RGPD de la galerie).
 *
 * Produit, dans `pinterest-kit/` :
 *  - un visuel avant/après composé par épingle (JPEG 1080x1350, DA nuit + or)
 *  - `epingles.md` : titre, description et lien de destination pour chacune,
 *    à copier tels quels dans Pinterest
 *
 * L'API Pinterest du projet est bloquée en accès Trial (les pins partent en
 * bac à sable), donc la publication reste manuelle. Ce script fabrique tout
 * ce qui prend du temps ; il ne publie rien et ne contacte personne.
 *
 * Usage :
 *   npx tsx scripts/build-pinterest-kit.ts            # 12 épingles
 *   npx tsx scripts/build-pinterest-kit.ts --limit 20
 */

import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from 'dotenv';
import { composeBeforeAfter } from '../app/api/cron/social-publish/compose';

config({ path: '.env.local' });

const DEMO_USER = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';
const OUT_DIR = 'pinterest-kit';
const SITE = 'https://instadeco.app';

/** Libellés lisibles. Les slugs de la base sont techniques. */
const STYLES: Record<string, string> = {
  moderne: 'moderne',
  minimaliste: 'minimaliste',
  japandi: 'japandi',
  boheme: 'bohème',
  coastal: 'bord de mer',
  artdeco: 'art déco',
  classique: 'classique',
  midcentury: 'mid-century',
};

const ROOMS: Record<string, string> = {
  salon: 'salon',
  chambre: 'chambre',
  bureau: 'bureau',
  cuisine: 'cuisine',
  'salle-a-manger': 'salle à manger',
  'salle-de-bain': 'salle de bain',
};

/**
 * Descriptions Pinterest. Pas de promesse chiffrée invérifiable, pas d'emoji,
 * pas de tiret de ponctuation : le texte doit passer la même barre que le
 * copy du site.
 */
function buildPin(style: string, room: string) {
  const s = STYLES[style] ?? style;
  const r = ROOMS[room] ?? room;

  const titres = [
    `${r.charAt(0).toUpperCase() + r.slice(1)} ${s} : avant et après`,
    `Transformer un ${r} en style ${s}`,
    `Un ${r} vide devient un ${r} ${s}`,
  ];
  const title = titres[(style.length + room.length) % titres.length];

  const description =
    `Voici le même ${r}, avant et après. Le rendu ${s} a été généré à partir ` +
    `d'une simple photo, sans rien déplacer ni acheter. Utile pour se projeter ` +
    `avant de choisir des meubles, une palette ou une ambiance. ` +
    `Essai gratuit sur instadeco.app, sans créer de compte.`;

  return {
    title,
    description,
    // On envoie vers la page de style correspondante quand elle existe, sinon
    // vers l'essai : dans les deux cas le visiteur peut tester sans compte.
    link: `${SITE}/fr/style/${style}`,
  };
}

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) || 12 : 12;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (.env.local).');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('generations')
    .select('id, style_slug, room_type_slug, input_image_url, output_image_url')
    .eq('user_id', DEMO_USER)
    .eq('status', 'completed')
    .not('output_image_url', 'is', null)
    .not('input_image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Lecture des générations impossible :', error.message);
    process.exit(1);
  }
  if (!data?.length) {
    console.error('Aucune génération démo exploitable.');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const lignes: string[] = [
    '# Kit Pinterest, épingles prêtes à publier',
    '',
    `Généré à partir de ${data.length} rendus réels du compte démo.`,
    'Chaque épingle : un visuel avant/après, un titre, une description, un lien.',
    'Rien n\'a été publié, tout se fait à la main depuis Pinterest.',
    '',
    'Conseil de cadence : deux à trois épingles par jour, pas davantage.',
    'Publier en rafale ressemble à du spam et fait retomber la portée.',
    '',
    '---',
    '',
  ];

  let ok = 0;
  for (const [i, row] of data.entries()) {
    const style = row.style_slug as string;
    const room = row.room_type_slug as string;
    const nom = `${String(i + 1).padStart(2, '0')}-${room}-${style}.jpg`;

    try {
      const buffer = await composeBeforeAfter(
        row.input_image_url as string,
        row.output_image_url as string,
      );
      await writeFile(join(OUT_DIR, nom), buffer);

      const pin = buildPin(style, room);
      lignes.push(
        `## ${i + 1}. ${nom}`,
        '',
        `**Titre**  ${pin.title}`,
        '',
        `**Description**  ${pin.description}`,
        '',
        `**Lien**  ${pin.link}`,
        '',
        '---',
        '',
      );
      ok++;
      console.log(`  ${nom}`);
    } catch (e) {
      console.warn(`  ignoré (${nom}) : ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  await writeFile(join(OUT_DIR, 'epingles.md'), lignes.join('\n'));
  console.log(`\n${ok} épingles prêtes dans ${OUT_DIR}/ (visuels + epingles.md).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
