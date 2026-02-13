import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight, Sparkles, Palette, Home, Star, ChevronRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LeadCaptureLazy } from '@/components/features/lead-capture-lazy';
import { STYLE_SEO_DATA, ROOM_SEO_DATA, getStyleSEOBySlug, getRoomSEOBySlug } from '@/lib/seo/programmatic-data';
import { getCanonicalUrl } from '@/lib/seo/config';
import { sanitizeJsonLd } from '@/lib/security/sanitize';

interface PageProps {
  params: Promise<{ style: string; piece: string }>;
}

// ============================================
// ANTI-SPAM : seules les combinaisons à fort volume
// de recherche sont marquées indexables. Les autres
// existent pour le maillage interne mais sont noindex.
// ============================================
const PRIORITY_COMBOS = new Set([
  // Top salon (volume de recherche le plus élevé)
  'moderne/salon', 'scandinave/salon', 'industriel/salon', 'boheme/salon', 'japandi/salon',
  // Top chambre
  'scandinave/chambre', 'boheme/chambre', 'japandi/chambre', 'minimaliste/chambre',
  // Top cuisine
  'moderne/cuisine', 'industriel/cuisine', 'contemporain/cuisine',
  // Top bureau
  'scandinave/bureau', 'industriel/bureau', 'minimaliste/bureau',
  // Top salle de bain
  'japandi/salle-de-bain', 'moderne/salle-de-bain',
  // Top salle à manger  
  'scandinave/salle-a-manger', 'rustique/salle-a-manger',
]);

function isIndexable(styleSlug: string, pieceSlug: string): boolean {
  return PRIORITY_COMBOS.has(`${styleSlug}/${pieceSlug}`);
}

// Générer les 96 combinaisons style × pièce
export async function generateStaticParams() {
  const params: { style: string; piece: string }[] = [];
  for (const style of STYLE_SEO_DATA) {
    for (const room of ROOM_SEO_DATA) {
      params.push({ style: style.slug, piece: room.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { style: styleSlug, piece: pieceSlug } = await params;
  const style = getStyleSEOBySlug(styleSlug);
  const room = getRoomSEOBySlug(pieceSlug);

  if (!style || !room) {
    return { title: 'Page introuvable' };
  }

  const indexable = isIndexable(styleSlug, pieceSlug);
  const title = `${room.name} ${style.name} : Idées Déco, Couleurs & Conseils | InstaDeco`;
  const description = `Guide complet : comment créer ${room.name === 'Entrée' || room.name === 'Terrasse' || room.name === 'Chambre' ? 'une' : 'un'} ${room.name.toLowerCase()} en style ${style.name}. Palette ${style.colors.slice(0, 2).join('/')}, matériaux ${style.materials[0]}, budget ${style.priceRange}. Visualisez le résultat sur votre photo.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(`/deco/${styleSlug}/${pieceSlug}`),
      type: 'article',
      siteName: 'InstaDeco AI',
    },
    alternates: {
      canonical: getCanonicalUrl(`/deco/${styleSlug}/${pieceSlug}`),
    },
    // Pages non-prioritaires = noindex (maillage interne uniquement)
    ...(!indexable && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };
}

// Images par combinaison — indexées par style_piece pour plus de diversité
const STYLE_IMAGES: Record<string, string> = {
  'moderne': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace',
  'scandinave': 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
  'industriel': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
  'boheme': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
  'minimaliste': 'https://images.unsplash.com/photo-1615873968403-89e068629265',
  'japandi': 'https://images.unsplash.com/photo-1615529328331-f8917597711f',
  'art-deco': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0',
  'contemporain': 'https://images.unsplash.com/photo-1617806118233-18e1de247200',
  'rustique': 'https://images.unsplash.com/photo-1600566753376-12c8ab7a06fd',
  'coastal': 'https://images.unsplash.com/photo-1616137466211-f939a420be84',
  'mid-century': 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e',
  'luxe': 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4',
};

// ============================================
// CONTENU UNIQUE par combinaison style × pièce
// Textes éditoriaux spécifiques, PAS de template
// avec substitution de variables
// ============================================
type ComboKey = string;
const UNIQUE_CONTENT: Record<ComboKey, {
  intro: string;
  why: string;
  steps: string[];
  proTip: string;
}> = {
  'moderne/salon': {
    intro: 'Le salon moderne est un classique indémodable de l\'architecture d\'intérieur. Caractérisé par ses lignes droites, son mobilier bas et ses grandes ouvertures, il mise sur l\'espace et la lumière pour créer une atmosphère à la fois élégante et détendue.',
    why: 'Dans un salon, le style moderne prend tout son sens : c\'est la pièce où l\'on reçoit, où l\'on passe le plus de temps. Les lignes épurées agrandissent visuellement l\'espace, les couleurs neutres apaisent, et le mobilier fonctionnel rend la vie quotidienne plus fluide. Un canapé droit en tissu beige, une table basse en marbre ou verre, et un tapis uni suffisent à poser l\'ambiance.',
    steps: [
      'Commencez par un canapé aux lignes droites dans un tissu neutre (lin grège, bouclette ivoire). C\'est l\'ancrage de votre salon.',
      'Ajoutez une table basse géométrique en marbre, verre fumé ou bois laqué. Évitez les formes organiques trop arrondies.',
      'Optez pour un éclairage architectural : un lampadaire arc, une suspension design et des spots encastrés remplacent le plafonnier central.',
      'Gardez les murs épurés avec maximum un ou deux tableaux abstraits grand format ou un miroir rectangle surdimensionné.',
      'Intégrez du rangement invisible : media units fermés, étagères encastrées, pas de bibelots en vue.',
    ],
    proTip: 'Le secret d\'un salon moderne réussi : la règle des 60-30-10 pour les couleurs. 60% de couleur dominante (murs, sol), 30% de secondaire (canapé, rideaux), 10% d\'accent (coussins, objets). Chez les pros, le moderne n\'est jamais froid quand on dose bien les textures.',
  },
  'scandinave/salon': {
    intro: 'Le salon scandinave incarne l\'art de vivre nordique : lumineux, chaleureux, sans superflu. Inspiré du concept danois de hygge, il transforme votre espace de vie en cocon douillet où chaque élément a sa place et sa raison d\'être.',
    why: 'Le salon est le cœur de la vie familiale — exactement ce que le hygge scandinave célèbre. Ce style fonctionne particulièrement bien en France, Suisse et Belgique où les hivers longs appellent un intérieur lumineux et réconfortant. Le bois clair réchauffe, les textiles en laine et lin invitent au confort, et la palette douce (blanc, beige, bleu glacier) maintient la luminosité même les jours gris.',
    steps: [
      'Installez un sol en bois clair (chêne blanchi ou pin naturel) ou un parquet stratifié dans les mêmes tons — c\'est la base scandinave.',
      'Choisissez un canapé confortable en tissu texturé (bouclette, lin) dans des tons neutres, avec des coussins en laine tricotée.',
      'Ajoutez un tapis en laine naturelle ou jute pour délimiter l\'espace salon et apporter de la chaleur sous les pieds.',
      'Multipliez les sources d\'éclairage douce : bougies (indispensables !), lampe de table avec abat-jour en papier, guirlande LED.',
      'Intégrez des plantes vertes : un monstera ou un ficus pour la touche de nature qui complète le style nordique.',
    ],
    proTip: 'Le scandinave ne veut pas dire \"tout blanc et froid\". En Scandinavie, on utilise des couleurs terreuses et des tons pastel pour réchauffer. Un plaid en mohair sur le canapé et quelques bougies changent tout. La vraie clé : chaque objet doit être à la fois beau ET utile.',
  },
  'industriel/salon': {
    intro: 'Le salon industriel transforme votre espace en un loft urbain au caractère affirmé. Né dans les anciennes usines new-yorkaises reconverties en habitations dans les années 50-60, ce style célèbre les matériaux bruts et l\'architecture visible.',
    why: 'Le salon est la pièce idéale pour le style industriel car il nécessite de l\'espace et du volume. Les plafonds hauts, les murs non traités et l\'éclairage de type atelier excellent dans les grands espaces de vie. Même sans loft, quelques éléments clés suffisent : un mur en brique (ou parement), des meubles métal/bois, et une verrière d\'atelier créent immédiatement l\'ambiance.',
    steps: [
      'Créez un mur d\'accent en brique (parement de brique réelle ou papier peint trompe-l\'œil haute qualité) sur le mur principal.',
      'Optez pour un canapé en cuir patiné (marron tabac ou cognac) — c\'est la signature du salon industriel.',
      'Ajoutez des meubles en métal et bois recyclé : table basse avec pieds en fonte, étagère en tubes de plomberie, console en acier.',
      'Installez des luminaires de type atelier : suspensions en métal, appliques à bras articulé, ampoules filament Edison apparentes.',
      'Laissez les câbles et tuyaux visibles si possible, ou créez un cheminement apparent décoratif. Le "brut" est le luxe du style industriel.',
    ],
    proTip: 'L\'erreur N°1 : aller trop loin dans le brut et obtenir un salon froid comme un garage. La parade : équilibrez chaque élément métallique avec un textile doux (plaid en laine sur le canapé cuir, tapis berbère au sol, coussins en velours). Le ratio parfait : 60% brut, 40% chaleureux.',
  },
  'boheme/chambre': {
    intro: 'La chambre bohème est un sanctuaire de liberté et de créativité. Contrairement au minimalisme rigide, le style boho célèbre le mélange des textures, les voyages et l\'éclectisme assumé pour créer un espace de repos profondément personnel.',
    why: 'La chambre est un espace intime qui se prête parfaitement au style bohème : ici, on peut superposer les textiles, accumuler les souvenirs de voyage et créer un nid douillet sans se soucier des conventions. Les couleurs chaudes (terracotta, ocre, vert sauge) favorisent le repos, tandis que les textures diverses (macramé, lin froissé, kilim) apportent une richesse sensorielle apaisante.',
    steps: [
      'La tête de lit est le point focal : optez pour du macramé mural, du rotin tressé ou un tissage artisanal plutôt qu\'une tête de lit classique.',
      'Superposez les textiles sur le lit : couette en lin froissé, jeté de lit en coton gaufré, coussins mix&match (brodé, kilim, velours).',
      'Au sol, empilez deux tapis de styles différents (jute + kilim berbère) pour créer cette sensation de nid layéré.',
      'Ajoutez des plantes suspendues (pothos, lierre) et en pot (fougère, calathea) — le végétal est l\'âme du bohème.',
      'Éclairage : guirlande LED derrière la tête de lit, bougies, lampe en bambou. Pas de plafonnier agressif.',
    ],
    proTip: 'Le piège du bohème : le bazar. Pour éviter l\'effet \"brocante désordonnée\", gardez une palette de 3-4 couleurs max (terracotta, crème, vert, doré) et un seul mur chargé. Les deux autres restent sobres. Le bohème réussi est un chaos organisé.',
  },
  'scandinave/chambre': {
    intro: 'La chambre scandinave est un havre de paix conçu pour le repos ultime. Lignes douces, matières naturelles et palette apaisante créent un cocon qui invite au sommeil réparateur et aux matinées paresseuses.',
    why: 'Les études scandinaves sur le sommeil montrent que les chambres les plus reposantes combinent lumière naturelle le jour, obscurité totale la nuit, et absence de stimuli visuels excessifs. Le style nordique appliquer instinctivement ces principes : tons doux, rangement invisible, textiles naturels qui régulent température et humidité.',
    steps: [
      'Peignez les murs en blanc cassé chaud ou greige (gris-beige) — jamais un blanc pur qui fatigue les yeux.',
      'Investissez dans du linge de lit en lin lavé naturel ou en coton haute qualité (200 fils minimum) dans des tons neutres.',
      'Choisissez une table de nuit en bois clair (bouleau, frêne) avec des lignes simples et un éclairage tamisé intégré.',
      'Ajoutez un plaid en laine mérinos au pied du lit et un tapis bouclé devant pour le confort du réveil.',
      'Rideaux occultants doublés mais à l\'aspect léger (lin, coton lavé) pour le contrôle lumineux sans l\'effet bunker.',
    ],
    proTip: 'En chambres scandinaves, la règle d\'or est : rien qui ne serve pas au repos. Pas de bureau, pas de TV si possible. Si la pièce est mixte, créez une séparation visuelle nette (claustra en bois, rideau). Un diffuseur d\'huiles essentielles (lavande, cèdre) complète l\'expérience nordique.',
  },
  'japandi/salle-de-bain': {
    intro: 'La salle de bain Japandi fusionne la sérénité du zen japonais avec la fonctionnalité nordique. Le résultat : un espace de bien-être épuré où chaque détail est pensé pour la relaxation et la beauté du geste quotidien.',
    why: 'Au Japon, le bain est un rituel sacré. En Scandinavie, l\'hygiène est un moment de reconnexion avec soi. Le Japandi dans la salle de bain combine ces deux philosophies : matériaux nobles (teck, pierre naturelle), formes organiques douces, et une absence totale de superflu. C\'est l\'espace spa accessible à tous les budgets.',
    steps: [
      'Optez pour un meuble vasque en bois (teck ou chêne huilé, résistant à l\'humidité) avec des lignes simples et basses.',
      'Carrelage grand format en teintes de pierre naturelle (grès cérame effet pierre) ou béton ciré pour un rendu monolithique et serein.',
      'Robinetterie minimaliste en noir mat ou laiton brossé — pas de chrome brillant, le Japandi préfère les finitions mates.',
      'Rangement invisible : niche encastrée dans la douche, miroir avec rangement intégré, panier en bambou pour le linge.',
      'Touche végétale : une plante de type bambou, un bonsaï ou un kokedama. Le vert est la seule couleur d\'accent autorisée.',
    ],
    proTip: 'Le détail qui fait tout en salle de bain Japandi : remplacez les flacons de shampooing plastique par des distributeurs en grès ou en verre ambré. Ce simple geste transforme la salle de bain de \"fonctionnelle\" à \"spa\". Pensez aussi à un tabouret en teck comme assise de douche — typiquement japonais.',
  },
  'moderne/cuisine': {
    intro: 'La cuisine moderne est le laboratoire de la vie contemporaine : aussi esthétique qu\'un showroom, aussi performante qu\'un restaurant. Surfaces sans poignée, électroménager intégré et plan de travail épuré sont la signature de ce style qui met la fonctionnalité au premier plan.',
    why: 'La cuisine est devenue la pièce la plus rénovée en 2025, avec un budget moyen de 12 000€ en France. Le style moderne domine les recherches car il maximise l\'espace de travail, facilite le nettoyage (surfaces lisses, pas de moulures) et vieillit bien dans le temps. C\'est aussi le style le plus valorisant pour la revente immobilière.',
    steps: [
      'Façades sans poignée (push-to-open ou gorge intégrée) dans un coloris mat : blanc, anthracite ou vert kaki foncé.',
      'Plan de travail en quartz composite, céramique ou Dekton — les surfaces ultra-résistantes et sans joint remplacent le granit.',
      'Crédence en verre laqué ou céramique grand format (le carrelage mosaïque est trop chargé pour le moderne).',
      'Électroménager totalement intégré et de la même ligne : four colonne, hotte plafond ou intégrée, réfrigérateur habillé.',
      'Éclairage sous meuble haut en LED (température 3000K) et suspension design au-dessus de l\'îlot ou du bar.',
    ],
    proTip: 'L\'erreur fréquente : une cuisine moderne trop froide et clinique. La solution : un îlot central avec un plan de snack en bois massif qui réchauffe l\'ensemble. Le contraste chaud/froid (bois + laque mate) est la recette des cuisinistes haut de gamme à 5000€ près.',
  },
  'industriel/cuisine': {
    intro: 'La cuisine industrielle marie l\'esprit de la cantine d\'artiste au fonctionnalisme de la cuisine professionnelle. Îlot en acier inoxydable, étagères ouvertes en tube et hotte restaurant : le style qui fait de votre cuisine un vrai atelier culinaire.',
    why: 'L\'industriel en cuisine est plus qu\'esthétique : c\'est pratique. Les chefs cuisiniers travaillent sur de l\'inox pour sa résistance et son hygiène. Les étagères ouvertes rendent tout accessible. Le sol en béton ciré ou carreaux de ciment est indestructible. C\'est le style qui supporte le mieux l\'usage intensif.',
    steps: [
      'Installez un plan de travail en inox ou en béton ciré — les deux matériaux les plus durables et les plus faciles à nettoyer.',
      'Remplacez les meubles hauts fermés par des étagères ouvertes en métal noir ou brut, fixées avec des équerres industrielles.',
      'Optez pour un îlot sur roulettes en acier, type desserte de cuisine professionnelle, pour la mobilité et l\'authenticité.',
      'Hotte aspirante : modèle professionnel apparent en inox brossé, pas un modèle intégré. C\'est la pièce maîtresse industrielle.',
      'Sol en carreaux de ciment géométriques ou béton ciré, complété par un tapis kilim devant l\'évier pour la chaleur.',
    ],
    proTip: 'Pour éviter l\'effet \"restaurant\", gardez la vaisselle visible artisanale : bols en grès, tasses en céramique faites main, bocaux en verre. L\'industriel domestique se distingue du professionnel par ces touches d\'imperfection qui humanisent l\'espace.',
  },
  'minimaliste/bureau': {
    intro: 'Le bureau minimaliste est une arme anti-distraction. Chaque objet sur le plan de travail a une raison d\'être, le câble management est invisible, et l\'espace de pensée est aussi dégagé que le desk. Productivité par le design.',
    why: 'Les études en psychologie du travail démontrent qu\'un environnement encombré réduit la capacité de concentration de 40%. Le bureau minimaliste applique ce principe : surface de travail vide (sauf écran, clavier, une plante), rangement fermé, palette neutre. Moins il y a à regarder, plus on se concentre sur l\'essentiel.',
    steps: [
      'Un desk en bois clair (chêne ou noyer) avec plateau flottant et pieds fins en métal — pas de caisson intégré qui alourdit.',
      'Investissez dans un cable management complet : gouttière sous-bureau, passe-câbles intégrés, chargeur sans fil encastré.',
      'Siège ergonomique en mesh respirant, coloris neutre (gris, noir). La forme prime sur le style — le dos ne négocie pas.',
      'Une seule étagère murale suffisamment haute pour ne pas être dans le champ de vision direct pendant le travail.',
      'Éclairage de task : une lampe de bureau à bras articulé (Artemide, Anglepoise) en température 4000K. Rien d\'autre.',
    ],
    proTip: 'La règle minimaliste du bureau : si ce n\'est pas utilisé quotidiennement, ça ne reste pas sur le desk. Un plateau de rangement dans un tiroir reçoit téléphone, carnets et câbles à la fin de journée. Le rituel \"clean desk\" chaque soir est le secret de la vraie productivité.',
  },
  'scandinave/bureau': {
    intro: 'Le bureau scandinave crée un espace de travail lumineux et inspirant qui refuse le cliché du bureau gris et triste. Bois naturel, plantes et lumière douce forment un environnement de travail où l\'on a envie de passer du temps.',
    why: 'En Suède et au Danemark, le concept de \"lagom\" (juste ce qu\'il faut) s\'applique parfaitement au bureau : assez de rangement sans surplus, assez de décoration sans distraction, assez de confort sans mollesse. Le résultat est un espace équilibré qui favorise à la fois la concentration et le bien-être.',
    steps: [
      'Desk en bouleau ou en pin naturel, avec rangement intégré discret (un tiroir, pas plus). Format 120×60cm minimum.',
      'Chaise de bureau en bois et textile (pas de plastique brillant) — le tissu est plus chaud que le mesh pour un home office.',
      'Étagère en chêne clair avec des livres, une plante et un objet personnel maximum. Le reste est rangé.',
      'Un tapis en laine sous le bureau pour le confort acoustique et le confort des pieds (crucial en hiver).',
      'Lampe de bureau en bois avec abat-jour en lin ou papier — la lumière nordique est toujours filtrée, jamais directe.',
    ],
    proTip: 'L\'astuce scandinave pour le home office : positionnez le bureau perpendiculairement à la fenêtre (jamais en face, jamais dos à elle). Cela évite les reflets sur l\'écran tout en bénéficiant de la lumière naturelle latérale, la configuration optimale pour les yeux.',
  },
  'boheme/salon': {
    intro: 'Le salon bohème est une invitation au voyage et à la liberté. Loin des règles strictes, ce style célèbre l\'éclectisme, les couleurs terracotta et les textures multiples pour créer un espace de vie chaleureux et profondément personnel.',
    why: 'Le salon est la pièce sociale par excellence — c\'est là que le bohème prend tout son sens. Ce style encourage l\'accumulation d\'objets aimés, de souvenirs de voyage et de textiles du monde entier. Contrairement au minimalisme qui peut paraître froid pour recevoir des invités, le boho crée immédiatement une ambiance conviviale et accueillante. Les couleurs chaudes (ocre, terracotta, rouille, vert sauge) enveloppent et invitent à s\'installer.',
    steps: [
      'Base neutre : un grand canapé confortable en lin naturel ou coton lavé. Le boho part d\'une toile neutre pour mieux accumuler les couleurs.',
      'Superposez les tapis : un grand tapis de base en jute ou sisal, avec un kilim berbère ou un tapis persan vintage par-dessus. Le layering au sol est la signature boho.',
      'Multipliez les coussins dans des textures variées : velours, lin froissé, broderie, kilim. 3-4 couleurs max pour garder une cohérence (terracotta, crème, vert sauge, moutarde).',
      'Décor mural éclectique : macramé, miroir en rotin, galerie de cadres dépareillés, attrape-rêves. Un seul mur chargé, les autres restent sobres.',
      'Plantes, plantes, plantes : monstera, pothos en suspension, ficus lyrata. Le végétal est l\'âme vivante du salon bohème.',
    ],
    proTip: 'Le secret du bohème réussi vs le bohème bazar ? La palette de couleurs. Choisissez 3-4 couleurs et tenez-vous-y pour TOUS vos achats déco. Terracotta + crème + vert sauge + doré est la combinaison la plus sûre. Le bohème est un chaos maîtrisé : 80% de neutre, 20% d\'éclat.',
  },
  'japandi/salon': {
    intro: 'Le salon Japandi allie la sérénité du zen japonais à la fonctionnalité chaleureuse du design scandinave. Le résultat est un espace à la fois minimaliste et accueillant, où chaque objet est choisi avec intention et où le vide est considéré comme un élément de décoration à part entière.',
    why: 'Le salon Japandi monte en puissance car il résout un dilemme courant : on veut de l\'épure sans la froideur du minimalisme strict, de la chaleur sans l\'accumulation du bohème. Ce style excelle dans les espaces de vie car il crée une atmosphère propice au repos ET à la sociabilité. Le bois naturel, les textiles doux et les tons de terre apportent le confort, tandis que l\'absence de superflu apporte la sérénité.',
    steps: [
      'Choisissez un canapé bas aux lignes droites en tissu texturé naturel (lin, bouclette). Les pieds fuselés en bois clair sont la signature Japandi.',
      'Table basse en bois massif non verni (chêne, noyer), de préférence avec des formes organiques douces — le wabi-sabi privilégie l\'imperfection.',
      'Maximum 2-3 objets déco : un vase en grès, une branche séchée, un livre. Le Japandi trouve la beauté dans le peu.',
      'Au sol, un tapis en laine naturelle ou en coton tissé main. Pas de motifs géométriques : tons unis ou légèrement chinés.',
      'Éclairage : suspension en papier washi ou en bambou. Exit les spots encastrés — le Japandi préfère la lumière douce et diffuse.',
    ],
    proTip: 'Le concept clé du Japandi est le "ma" japonais : l\'espace entre les choses a autant de valeur que les choses elles-mêmes. Dans votre salon, laissez au moins 30% des surfaces vides. Un mur sans cadre, une étagère avec des espaces libres, un coin sans meuble. Ce "vide actif" est ce qui rend le Japandi si apaisant.',
  },
  'japandi/chambre': {
    intro: 'La chambre Japandi est un sanctuaire de repos conçu autour du concept japonais d\'ichigo ichie — apprécier chaque moment présent. Lignes épurées, matières naturelles et palette terreuse créent un espace qui invite au lâcher-prise et au sommeil profond.',
    why: 'Le Japandi est peut-être le style le plus adapté à la chambre à coucher. La philosophie japonaise place le repos au centre de la vie quotidienne, tandis que l\'approche scandinave apporte le confort textile indispensable sous nos latitudes. Cette fusion crée une chambre qui minimise les stimuli visuels (favorable au sommeil) tout en restant chaleureuse et enveloppante (favorable au bien-être).',
    steps: [
      'Le lit : cadre en bois massif bas (inspiration futon surélevé), avec une tête de lit simple en chêne ou en noyer. Pas d\'ornements, la beauté est dans le grain du bois.',
      'Linge de lit : lin lavé naturel dans les tons de terre (beige, taupe, terracotta doux). Superposez couette et plaid en laine fine pour le côté hygge.',
      'Tables de chevet asymétriques : une en bois, une en pierre ou béton. L\'imperfection délibérée (wabi-sabi) apporte du caractère sans excès.',
      'Rangement : une penderie fermée type armoire japonaise (portes coulissantes en bois), rien de visible. Le dressing ouvert est l\'ennemi du Japandi.',
      'Un seul élément déco : un ikebana (arrangement floral japonais minimaliste) ou un kokedama sur la table de chevet. Rien d\'autre.',
    ],
    proTip: 'La chambre Japandi parfaite suit la règle des 5 sens : le bois pour le toucher, le lin lavé pour la texture, une bougie au cèdre pour l\'odorat, des tons de terre pour la vue, et le silence (pas de réveil digital lumineux). Remplacez le réveil par un sunrise simulator — très nordique, très zen.',
  },
  'minimaliste/chambre': {
    intro: 'La chambre minimaliste pousse le concept de repos à son essence pure : un espace où il n\'y a rien de plus que le nécessaire au sommeil et à la tranquillité. Chaque objet qui entre dans cette pièce doit gagner sa place, et le résultat est une oasis de calme dans un monde de surcharge sensorielle.',
    why: 'Nous passons un tiers de notre vie dans la chambre. La science du sommeil est formelle : un environnement encombré perturbe l\'endormissement et la qualité du sommeil. La chambre minimaliste répond à ce besoin fondamental en éliminant tout stimulus visuel non essentiel. Pas de pile de livres qui culpabilise, pas de vêtements sur la chaise, pas de notifications lumineuses — juste l\'espace nécessaire au repos.',
    steps: [
      'Le lit est le seul meuble imposant : cadre simple, pas de tête de lit surdimensionnée. Un sommier tapissé en tissu uni suffit.',
      'Linge de lit monochrome : choisissez une seule teinte (blanc, gris perle, ou bleu très pâle) et tenez-vous-y. Pas de motifs, pas de contrastes.',
      'Tables de chevet : le plus petit modèle possible, ou une simple tablette murale flottante. Elle ne supporte qu\'une lampe et un verre d\'eau.',
      'Zéro décoration murale. Si le mur paraît trop nu, un seul cadre fin avec une œuvre abstraite monochromatique à hauteur des yeux depuis le lit.',
      'Rangement 100% fermé et invisible : dressing intégré avec portes à fleur du mur, tiroirs sous le lit si nécessaire.',
    ],
    proTip: 'L\'exercice radical mais efficace : videz votre chambre entièrement, puis ne remettez que ce que vous utilisez pour dormir. En général, il reste le lit, deux oreillers, une couette, une lampe. Tout le reste est du bruit visuel. Partez de ce « zéro » et n\'ajoutez que le strict minimum. Le minimalisme en chambre n\'est pas une contrainte, c\'est une libération.',
  },
  'contemporain/cuisine': {
    intro: 'La cuisine contemporaine capture les tendances du moment pour créer un espace de cuisson à la pointe du design. Contrairement au style moderne qui suit des codes établis, le contemporain est en mouvement permanent : il intègre les dernières innovations en matière de matériaux, de couleurs et d\'ergonomie.',
    why: 'La cuisine est la pièce où les tendances évoluent le plus vite. Il y a 5 ans, le total white dominait. Aujourd\'hui, les tons verts, les façades cannelées et les matériaux texturés prennent le dessus. Le style contemporain assume cette évolution constante : il est conçu pour être modifié, mis à jour, repensé. C\'est la cuisine qui ne se démode pas parce qu\'elle est toujours en avance.',
    steps: [
      'Façades en coloris tendance : vert sauge, bleu sourd, terracotta mat ou noir ultra-mat. Exit le blanc intégral.',
      'Plan de travail en céramique fine (12mm max) ou Dekton — les surfaces ultra-minces donnent un look contemporain impossible avec le granit.',
      'Poignées intégrées de type rainurage vertical (cannelage) sur les façades — c\'est LA signature contemporaine du moment.',
      'Électroménager connecté et encastré : four avec caméra intégrée, hotte induction 2-en-1, robinet eau bouillante instantanée.',
      'Éclairage scénarisé : LED sous meubles hauts (3000K cuisine, 2700K ambiance dîner) pilotable par smartphone ou interrupteur variateur.',
    ],
    proTip: 'Le contemporain est le style le plus risqué pour la revente car les tendances changent. La parade : gardez les éléments structurels (caissons, plan de travail) dans des matériaux neutres et investissez la tendance uniquement sur les façades. Les façades sont remplaçables chez la plupart des cuisinistes pour 30% du prix d\'une cuisine neuve.',
  },
  'industriel/bureau': {
    intro: 'Le bureau industriel transforme votre espace de travail en un atelier créatif au caractère brut. Inspiré des ateliers d\'artistes et des usines reconverties, ce style crée un environnement où la productivité s\'allie à l\'authenticité des matériaux.',
    why: 'Le style industriel convient particulièrement au bureau car il valorise le côté "atelier" du travail. Les créatifs, freelances et entrepreneurs y retrouvent l\'énergie des espaces de coworking industriels sans le bruit. Le métal et le bois brut sont aussi des matériaux qui vieillissent bien et supportent l\'usage intensif — pas de souci de traces de tasses ou de rayures, elles ajoutent du caractère.',
    steps: [
      'Un grand desk en bois massif avec des pieds en acier tubulaire ou en fonte. Le plateau doit être épais (4-5cm min) et brut pour l\'authenticité.',
      'Étagère murale en tube de plomberie (DIY possible) ou en métal noir avec tablettes en bois recyclé. Livres, objets et outils en vue.',
      'Chaise de bureau vintage type "atelier" en cuir patiné et métal, ou une chaise industrielle modernisée avec roulettes.',
      'Éclairage d\'atelier : lampe à bras articulé type Jieldé ou Anglepoise, applique murale en métal, ampoule filament Edison pour l\'ambiance.',
      'Accessoires en métal et cuir : porte-crayon en acier, sous-main en cuir vieilli, horloge murale de gare. Pas de plastique.',
    ],
    proTip: 'L\'erreur du bureau industriel : aller full métal et se retrouver dans un garage sans âme. L\'astuce : ajoutez un tapis kilim sous le bureau (absorbe le son et adoucit l\'ambiance), un plaid en laine sur le dossier de la chaise, et une plante robuste type sansevieria dans un pot en cuivre. Le ratio 60% brut / 40% cosy est la clé.',
  },
  'moderne/salle-de-bain': {
    intro: 'La salle de bain moderne est un concentré de technologie et d\'élégance minimaliste. Douche italienne XXL, vasque à poser sculpturale et robinetterie encastrée : chaque détail est pensé pour allier esthétique et fonctionnalité au quotidien.',
    why: 'La salle de bain moderne est le deuxième poste de rénovation après la cuisine, avec un budget moyen de 8 000€. Ce style domine les demandes car il est intemporel, facile d\'entretien (surfaces lisses, pas de joints superflus) et valorise fortement un bien immobilier. Les acheteurs plébiscitent les salles de bain modernes — c\'est souvent la pièce qui fait basculer une décision d\'achat.',
    steps: [
      'Douche italienne grande surface (120×90cm min) avec paroi vitrée fixe et receveur extra-plat affleurant le sol. Exit le bac à douche surélevé.',
      'Meuble vasque suspendu (gain de place et facilité de nettoyage) en laque mate, avec vasque à poser en céramique ou pierre.',
      'Robinetterie encastrée murale en finition noir mat, bronze brossé ou nickel — les robinets sur colonne allourdissent visuellement.',
      'Carrelage grand format (60×120 ou 120×120) en grès cérame, le moins de joints possible. Murs et sol dans des tons coordonnés.',
      'Miroir rétro-éclairé LED (pas de spot au-dessus) avec désembuage intégré. C\'est le détail qui fait passer la salle de bain de "propre" à "hôtel".',
    ],
    proTip: 'Le détail haut de gamme qui ne coûte pas cher : une niche de douche encastrée dans le mur (au lieu d\'une étagère rapportée). Elle coûte ~200€ à créer lors d\'une rénovation mais donne un rendu de salle de bain à 15 000€. Autre astuce : le même carrelage au sol et aux murs crée un effet monolithique très contemporain.',
  },
  'scandinave/salle-a-manger': {
    intro: 'La salle à manger scandinave est une célébration du repas partagé, pilier de la culture nordique. Table en bois clair, chaises emblématiques et luminaire suspendu sculptural créent un espace chaleureux où manger devient un moment de connexion et de convivialité.',
    why: 'En Scandinavie, le repas en famille est sacré — c\'est le moment de la journée où l\'on se retrouve. Le design de la salle à manger reflète cette philosophie : la table est généreuse et accueillante, les chaises sont confortables (pas juste jolies), et l\'éclairage crée une ambiance intime. Ce style fonctionne remarquablement en France, Suisse et Belgique où la culture du repas partagé est tout aussi forte.',
    steps: [
      'Table en chêne clair ou en frêne, avec rallonges intégrées si possible. Format rectangulaire 180×90cm pour 6 personnes, ovale pour les petits espaces.',
      'Chaises iconiques : les classiques scandinaves (CH24 Wishbone, Series 7, J77) sont reconnaissables et intemporelles. Mixez 2 modèles max pour du caractère.',
      'Suspension design basse au-dessus de la table (60-70cm au-dessus du plateau) — c\'est LE point focal. PH 5, Flowerpot, ou un modèle en bois/papier.',
      'Buffet ou enfilade en bois clair pour le rangement de la vaisselle. Pieds fuselés, pas de poignées apparentes.',
      'Décor de table minimaliste : un chemin de table en lin, un vase avec des branches fraîches, des bougies. Pas de centre de table permanent.',
    ],
    proTip: 'L\'astuce des designers danois pour une salle à manger réussie : la suspension doit être dimensionnée au tiers du diamètre de la table. Table de 180cm = suspension de 60cm. Et surtout, un variateur d\'intensité sur la suspension permet de passer de l\'éclairage repas (100%) au mode "dîner aux chandelles" (30%) en un geste.',
  },
  'rustique/salle-a-manger': {
    intro: 'La salle à manger rustique est un hommage à l\'art de vivre campagnard. Grande table de ferme en bois massif, banc convivial et vaisselle artisanale composent un décor généreux où les repas deviennent des fêtes et où chaque imperfection du bois raconte une histoire.',
    why: 'Le rustique en salle à manger n\'a jamais été aussi populaire, porté par la tendance du "retour à l\'authentique". Après des années de design épuré et de surfaces lisses, les Français redécouvrent le charme du bois massif, de la pierre et des matériaux qui ont une vie. La salle à manger rustique crée cette atmosphère de tablée généreuse — celle des maisons de campagne, des gîtes de charme et des restaurants de terroir.',
    steps: [
      'La pièce maîtresse : une table de ferme en chêne, noyer ou orme massif. Plus elle est ancienne et patinée, mieux c\'est. Format 200×100cm minimum pour de vraies tablées.',
      'Assises mixtes : un banc en bois d\'un côté de la table (convivial et gain de place), des chaises dépareillées de l\'autre (charme de la récup).',
      'Éclairage chaleureux : suspension en fer forgé avec bougies LED ou lustre en bois de cerf. Température 2700K maximum — le blanc froid tue le rustique.',
      'Vaisselier ou buffet ancien : en chêne ciré ou peint en blanc patiné. Il expose fièrement la vaisselle en grès, les verres à vin et les carafes.',
      'Linge de table en lin naturel non repassé (froissé = charme), serviettes assorties et un centre de table naturel : branche de romarin, bougies, petits pots d\'herbes.',
    ],
    proTip: 'Le rustique moderne évite le piège "musée de campagne". La clé : mélangez 70% d\'éléments rustiques anciens avec 30% de touches contemporaines. Par exemple, une suspension design en métal noir au-dessus d\'une table de ferme centenaire, ou des chaises Tolix en acier brut autour d\'une table en chêne massif. Ce décalage crée la tension esthétique qui empêche le rustique de basculer dans le kitsch.',
  },
};

// Contenu de fallback pour les combinaisons sans contenu unique
function generateFallbackContent(style: typeof STYLE_SEO_DATA[0], room: typeof ROOM_SEO_DATA[0]) {
  const isFeminine = ['Entrée', 'Terrasse', 'Cuisine', 'Salle de bain', 'Salle à manger', 'Chambre'].includes(room.name);
  const article = isFeminine ? 'une' : 'un';
  const articleDef = isFeminine ? 'la' : 'le';

  return {
    intro: `Le style ${style.name} offre une approche unique pour ${articleDef} ${room.name.toLowerCase()}. ${style.longDescription}`,
    why: `${room.longDescription} Le style ${style.name}, avec sa palette de ${style.colors.slice(0, 3).join(', ')} et ses matériaux signature (${style.materials.join(', ')}), apporte une identité forte. ${style.idealFor.length > 0 ? `Particulièrement adapté aux ${style.idealFor.join(', ').toLowerCase()}.` : ''}`,
    steps: [
      `Définissez la palette : ${style.colors.join(', ')} en proportions 60/30/10 (dominant/secondaire/accent).`,
      `Sélectionnez les matériaux de base : ${style.materials.slice(0, 2).join(' et ')} pour le mobilier principal.`,
      ...room.tips,
      `Visualisez le résultat avant d'investir avec une simulation IA (gain moyen : 2 000€ d'erreurs évitées).`,
    ],
    proTip: `Le style ${style.name} (budget ${style.priceRange}, difficulté ${style.difficulty}) fonctionne ${isFeminine ? 'dans la' : 'dans le'} ${room.name.toLowerCase()} à condition de respecter ses codes fondamentaux : ${style.hero.toLowerCase()} L'erreur la plus courante est de mélanger trop de styles dans ${article} même pièce.`,
  };
}

function getContent(styleSlug: string, roomSlug: string, style: typeof STYLE_SEO_DATA[0], room: typeof ROOM_SEO_DATA[0]) {
  const key = `${styleSlug}/${roomSlug}`;
  const unique = UNIQUE_CONTENT[key];
  if (unique) return unique;
  return generateFallbackContent(style, room);
}

// FAQ spécifiques par pièce (reprend les FAQ déjà écrites dans programmatic-data)
function getFaq(style: typeof STYLE_SEO_DATA[0], room: typeof ROOM_SEO_DATA[0]) {
  const isFeminine = ['Entrée', 'Terrasse', 'Cuisine', 'Salle de bain', 'Salle à manger', 'Chambre'].includes(room.name);
  const article = isFeminine ? 'une' : 'un';

  // Combiner les FAQ uniques du style + de la pièce (pas de template)
  const faqs = [
    // FAQ de la pièce (existante, riche)
    ...room.faq,
    // FAQ du style (existante, riche)
    ...style.faq.slice(0, 1),
    // 1 FAQ croisée — mais avec une réponse développée
    {
      question: `Peut-on mixer le style ${style.name} avec un autre style dans ${article} ${room.name.toLowerCase()} ?`,
      answer: `Oui, le ${style.name} se marie bien avec certains styles complémentaires. La règle : choisir un style dominant (80%) et un style accent (20%). ${style.idealFor.length > 0 ? `Le ${style.name} est particulièrement adapté aux ${style.idealFor[0].toLowerCase()}.` : ''} Pour visualiser le mélange avant de vous lancer, testez sur votre propre photo avec InstaDeco AI.`,
    },
  ];

  return faqs;
}

export default async function DecoStylePiecePage({ params }: PageProps) {
  const { style: styleSlug, piece: pieceSlug } = await params;
  const style = getStyleSEOBySlug(styleSlug);
  const room = getRoomSEOBySlug(pieceSlug);

  if (!style || !room) {
    notFound();
  }

  const content = getContent(styleSlug, pieceSlug, style, room);
  const faq = getFaq(style, room);
  const imageUrl = `${STYLE_IMAGES[style.slug] || STYLE_IMAGES['moderne']}?w=1200&h=600&fit=crop`;

  // Styles connexes (même pièce, autre style)
  const otherStylesForRoom = STYLE_SEO_DATA
    .filter(s => s.slug !== style.slug && room.stylesRecommended.includes(s.slug))
    .slice(0, 4);

  // Pièces connexes (même style, autre pièce)  
  const otherRoomsForStyle = ROOM_SEO_DATA
    .filter(r => r.slug !== room.slug)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[350px] md:h-[450px] overflow-hidden">
        <Image
          src={imageUrl}
          alt={`${room.name} style ${style.name} — Décoration intérieure par IA`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-black/40" />
        
        <div className="absolute bottom-0 left-0 w-full z-10">
          <div className="container mx-auto px-4 pb-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-white/80 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/style/${style.slug}`} className="hover:text-white transition-colors">{style.name}</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/piece/${room.slug}`} className="hover:text-white transition-colors">{room.name}</Link>
            </nav>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-primary/90 text-white border-none">
                <Palette className="h-3 w-3 mr-1" />
                {style.name}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Home className="h-3 w-3 mr-1" />
                {room.name}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {style.difficulty} • {style.priceRange}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight [text-shadow:_0_2px_10px_rgb(0_0_0_/_40%)]">
              {room.name} style {style.name}
            </h1>
            <p className="text-white/80 text-lg mt-3 max-w-2xl">
              {content.intro}
            </p>
          </div>
        </div>
      </section>

      {/* CTA rapide */}
      <section className="py-8 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="font-medium">
              Visualisez votre {room.name.toLowerCase()} en style {style.name} en 30 secondes
            </p>
          </div>
          <Link href="/essai">
            <Button className="rounded-full px-6 shadow-md shadow-primary/20">
              Essayer gratuitement
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Pourquoi ce style pour cette pièce */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">
              Pourquoi le style {style.name} pour {room.name === 'Entrée' || room.name === 'Terrasse' || room.name === 'Cuisine' || room.name === 'Salle de bain' || room.name === 'Salle à manger' || room.name === 'Chambre' ? 'la' : 'le'} {room.name.toLowerCase()} ?
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {content.why}
            </p>

            {/* Palette & Matériaux */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Palette de couleurs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {style.colors.map(color => (
                      <span key={color} className="bg-background px-3 py-1.5 rounded-full text-sm border">
                        {color}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Matériaux recommandés
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {style.materials.map(mat => (
                      <span key={mat} className="bg-background px-3 py-1.5 rounded-full text-sm border">
                        {mat}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Comment faire */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">
              Comment décorer {room.name === 'Entrée' || room.name === 'Terrasse' || room.name === 'Chambre' ? 'une' : 'un'} {room.name.toLowerCase()} en style {style.name}
            </h2>
            <div className="space-y-4">
              {content.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/20 border">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    {i + 1}
                  </div>
                  <p className="text-muted-foreground pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conseil de pro */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Conseil de pro
            </h2>
            <div className="flex items-start gap-3 p-5 rounded-xl bg-amber-50 border border-amber-200">
              <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">{content.proTip}</p>
            </div>
          </div>

          {/* CTA central */}
          <div className="mb-16 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-10 text-center border border-primary/10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              Essai gratuit
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Voyez le résultat avant d&apos;acheter
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Uploadez une photo de votre {room.name.toLowerCase()} et découvrez-{room.name === 'Entrée' || room.name === 'Terrasse' || room.name === 'Cuisine' || room.name === 'Salle de bain' || room.name === 'Salle à manger' || room.name === 'Chambre' ? 'la' : 'le'} transformé{room.name === 'Entrée' || room.name === 'Terrasse' || room.name === 'Cuisine' || room.name === 'Salle de bain' || room.name === 'Salle à manger' || room.name === 'Chambre' ? 'e' : ''} en style {style.name} en 30 secondes.
            </p>
            <Link href="/essai">
              <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                Transformer ma pièce maintenant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Questions fréquentes</h2>
            <div className="space-y-4">
              {faq.map((item, i) => (
                <details key={i} className="group border rounded-xl bg-background p-6">
                  <summary className="flex cursor-pointer items-center justify-between font-medium">
                    {item.question}
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="pt-4 text-muted-foreground">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Maillage interne */}
      <section className="py-12 border-t bg-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Autres styles pour cette pièce */}
          {otherStylesForRoom.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xl font-bold mb-4">
                Autres styles pour votre {room.name.toLowerCase()}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {otherStylesForRoom.map(s => (
                  <Link
                    key={s.slug}
                    href={`/deco/${s.slug}/${room.slug}`}
                    className="block p-4 border rounded-xl bg-background hover:border-primary/40 transition-all hover:shadow-md"
                  >
                    <p className="font-semibold text-sm">{room.name} {s.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.difficulty} • {s.priceRange}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Autres pièces pour ce style */}
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-4">
              Le style {style.name} dans d&apos;autres pièces
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherRoomsForStyle.map(r => (
                <Link
                  key={r.slug}
                  href={`/deco/${style.slug}/${r.slug}`}
                  className="block p-4 border rounded-xl bg-background hover:border-primary/40 transition-all hover:shadow-md"
                >
                  <p className="font-semibold text-sm">{r.name} {style.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Voir le guide</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Liens principaux */}
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href={`/style/${style.slug}`} className="text-primary hover:underline">
              Guide complet : Style {style.name} →
            </Link>
            <Link href={`/piece/${room.slug}`} className="text-primary hover:underline">
              Guide complet : {room.name} →
            </Link>
            <Link href="/galerie" className="text-primary hover:underline">
              Voir la galerie →
            </Link>
          </div>
        </div>
      </section>

      {/* Lead Capture */}
      <LeadCaptureLazy variant="banner" delay={6000} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `${room.name} style ${style.name} : Guide Complet de Décoration`,
            description: `Comment décorer ${room.name === 'Entrée' || room.name === 'Terrasse' || room.name === 'Chambre' ? 'une' : 'un'} ${room.name.toLowerCase()} en style ${style.name}. Couleurs, matériaux, conseils.`,
            url: getCanonicalUrl(`/deco/${style.slug}/${room.slug}`),
            isPartOf: {
              '@id': 'https://instadeco.app/#website',
            },
            keywords: `${room.name.toLowerCase()} ${style.name.toLowerCase()}, décoration ${room.name.toLowerCase()}, style ${style.name.toLowerCase()}`,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://instadeco.app' },
              { '@type': 'ListItem', position: 2, name: `Style ${style.name}`, item: getCanonicalUrl(`/style/${style.slug}`) },
              { '@type': 'ListItem', position: 3, name: room.name, item: getCanonicalUrl(`/piece/${room.slug}`) },
              { '@type': 'ListItem', position: 4, name: `${room.name} ${style.name}`, item: getCanonicalUrl(`/deco/${style.slug}/${room.slug}`) },
            ],
          }),
        }}
      />
    </div>
  );
}
