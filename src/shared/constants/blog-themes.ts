/**
 * Blog Themes Configuration
 * 
 * Plus de 100 thèmes d'articles pour la génération automatique.
 * Organisés par catégorie et type de session.
 * 
 * Format:
 * - primaryKeyword: Mot-clé principal ciblé (SEO)
 * - secondaryKeywords: Mots-clés secondaires à intégrer
 * - themeType: Type de thème InstaDeco (pour le contenu)
 * - targetCountry: Pays cible prioritaire (CH, FR, BE)
 * - priority: Priorité de publication (1 = haute, 3 = basse)
 */

import { ArticleSessionType } from '../../domain/entities/BlogArticle';

export type ThemeType = 'renovation' | 'interior_design' | 'staging' | 'garden' | 'color_change';

export interface BlogTheme {
  primaryKeyword: string;
  secondaryKeywords: string[];
  themeType: ThemeType;
  targetCountry: 'CH' | 'FR' | 'BE' | 'ALL';
  priority: 1 | 2 | 3;
  category: string;
}

/**
 * Mappe un type de thème vers un type de session
 * (Les sessions sont basées sur l'heure de génération)
 */
export function getSessionTypeFromTime(): ArticleSessionType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export const BLOG_THEMES: BlogTheme[] = [
  // ============================================
  // CATÉGORIE: STYLES DE DÉCORATION
  // ============================================
  {
    primaryKeyword: 'décoration scandinave salon',
    secondaryKeywords: ['style nordique', 'minimalisme', 'hygge', 'couleurs claires', 'bois naturel'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'styles',
  },
  {
    primaryKeyword: 'style industriel appartement',
    secondaryKeywords: ['loft', 'métal', 'briques apparentes', 'décoration urbaine', 'mobilier vintage'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'styles',
  },
  {
    primaryKeyword: 'décoration bohème chic',
    secondaryKeywords: ['boho', 'macramé', 'plantes vertes', 'textiles ethniques', 'couleurs chaudes'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'styles',
  },
  {
    primaryKeyword: 'intérieur japonais moderne',
    secondaryKeywords: ['zen', 'minimalisme japonais', 'wabi-sabi', 'tatami', 'shoji'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'styles',
  },
  {
    primaryKeyword: 'décoration art déco',
    secondaryKeywords: ['années 20', 'géométrique', 'velours', 'or', 'luxe'],
    themeType: 'interior_design',
    targetCountry: 'FR',
    priority: 2,
    category: 'styles',
  },
  {
    primaryKeyword: 'style contemporain épuré',
    secondaryKeywords: ['moderne', 'lignes pures', 'design actuel', 'neutre', 'élégant'],
    themeType: 'interior_design',
    targetCountry: 'CH',
    priority: 1,
    category: 'styles',
  },
  {
    primaryKeyword: 'décoration provençale',
    secondaryKeywords: ['sud de la France', 'lavande', 'terres cuites', 'fer forgé', 'campagne chic'],
    themeType: 'interior_design',
    targetCountry: 'FR',
    priority: 2,
    category: 'styles',
  },
  {
    primaryKeyword: 'style chalet montagne',
    secondaryKeywords: ['bois', 'cocooning', 'alpin', 'ski', 'cheminée'],
    themeType: 'interior_design',
    targetCountry: 'CH',
    priority: 1,
    category: 'styles',
  },
  {
    primaryKeyword: 'décoration méditerranéenne',
    secondaryKeywords: ['bleu', 'blanc', 'terre cuite', 'Grèce', 'voyage'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'styles',
  },
  {
    primaryKeyword: 'style farmhouse moderne',
    secondaryKeywords: ['ferme moderne', 'rustique chic', 'shiplap', 'vintage', 'campagne'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 3,
    category: 'styles',
  },

  // ============================================
  // CATÉGORIE: PIÈCES
  // ============================================
  {
    primaryKeyword: 'aménager un petit salon',
    secondaryKeywords: ['petit espace', 'optimisation', 'rangement', 'multifonction', 'illusion espace'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'pieces',
  },
  {
    primaryKeyword: 'décoration chambre parentale',
    secondaryKeywords: ['cosy', 'romantique', 'tête de lit', 'suite parentale', 'dressing'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'pieces',
  },
  {
    primaryKeyword: 'cuisine ouverte sur salon',
    secondaryKeywords: ['îlot central', 'cuisine américaine', 'open space', 'convivialité'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 1,
    category: 'pieces',
  },
  {
    primaryKeyword: 'salle de bain moderne',
    secondaryKeywords: ['douche italienne', 'carrelage', 'robinetterie', 'vasque', 'miroir'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 1,
    category: 'pieces',
  },
  {
    primaryKeyword: 'bureau à domicile',
    secondaryKeywords: ['télétravail', 'home office', 'productivité', 'ergonomie', 'concentration'],
    themeType: 'interior_design',
    targetCountry: 'CH',
    priority: 1,
    category: 'pieces',
  },
  {
    primaryKeyword: 'chambre enfant créative',
    secondaryKeywords: ['couleurs vives', 'rangement jouets', 'coin lecture', 'évolutif', 'ludique'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'pieces',
  },
  {
    primaryKeyword: 'entrée accueillante',
    secondaryKeywords: ['hall', 'vestiaire', 'première impression', 'miroir', 'rangement chaussures'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'pieces',
  },
  {
    primaryKeyword: 'buanderie fonctionnelle',
    secondaryKeywords: ['organisation', 'rangement', 'lessive', 'espace compact', 'pratique'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 3,
    category: 'pieces',
  },
  {
    primaryKeyword: 'dressing sur mesure',
    secondaryKeywords: ['rangement vêtements', 'organisation', 'walk-in closet', 'éclairage', 'miroir'],
    themeType: 'renovation',
    targetCountry: 'CH',
    priority: 2,
    category: 'pieces',
  },
  {
    primaryKeyword: 'aménager ses combles',
    secondaryKeywords: ['sous-pente', 'isolation', 'lumière naturelle', 'espace perdu', 'chambre mansardée'],
    themeType: 'renovation',
    targetCountry: 'FR',
    priority: 2,
    category: 'pieces',
  },

  // ============================================
  // CATÉGORIE: COULEURS
  // ============================================
  {
    primaryKeyword: 'couleur tendance 2024 décoration',
    secondaryKeywords: ['pantone', 'murs', 'peinture', 'association couleurs', 'nuancier'],
    themeType: 'color_change',
    targetCountry: 'ALL',
    priority: 1,
    category: 'couleurs',
  },
  {
    primaryKeyword: 'peindre un mur en bleu',
    secondaryKeywords: ['bleu canard', 'bleu nuit', 'bleu pastel', 'sérénité', 'pièce fraîche'],
    themeType: 'color_change',
    targetCountry: 'ALL',
    priority: 2,
    category: 'couleurs',
  },
  {
    primaryKeyword: 'salon terracotta',
    secondaryKeywords: ['terre cuite', 'couleur chaude', 'tendance', 'ocre', 'ambiance chaleureuse'],
    themeType: 'color_change',
    targetCountry: 'ALL',
    priority: 2,
    category: 'couleurs',
  },
  {
    primaryKeyword: 'décoration vert sauge',
    secondaryKeywords: ['vert de gris', 'nature', 'apaisant', 'végétal', 'bien-être'],
    themeType: 'color_change',
    targetCountry: 'ALL',
    priority: 1,
    category: 'couleurs',
  },
  {
    primaryKeyword: 'murs noirs intérieur',
    secondaryKeywords: ['noir mat', 'élégance', 'contraste', 'audacieux', 'luxe'],
    themeType: 'color_change',
    targetCountry: 'ALL',
    priority: 3,
    category: 'couleurs',
  },
  {
    primaryKeyword: 'palette de couleurs neutres',
    secondaryKeywords: ['beige', 'greige', 'blanc cassé', 'intemporel', 'apaisant'],
    themeType: 'color_change',
    targetCountry: 'CH',
    priority: 1,
    category: 'couleurs',
  },
  {
    primaryKeyword: 'association rose et vert',
    secondaryKeywords: ['complémentaires', 'tendance', 'audacieux', 'nature', 'fraîcheur'],
    themeType: 'color_change',
    targetCountry: 'ALL',
    priority: 3,
    category: 'couleurs',
  },
  {
    primaryKeyword: 'peinture bicolore mur',
    secondaryKeywords: ['deux tons', 'soubassement', 'moderniser', 'dynamiser', 'technique'],
    themeType: 'color_change',
    targetCountry: 'FR',
    priority: 2,
    category: 'couleurs',
  },

  // ============================================
  // CATÉGORIE: RÉNOVATION
  // ============================================
  {
    primaryKeyword: 'rénover appartement haussmannien',
    secondaryKeywords: ['Paris', 'parquet', 'moulures', 'cheminée', 'hauteur sous plafond'],
    themeType: 'renovation',
    targetCountry: 'FR',
    priority: 1,
    category: 'renovation',
  },
  {
    primaryKeyword: 'rénovation énergétique maison',
    secondaryKeywords: ['isolation', 'chauffage', 'économies', 'écologique', 'aides financières'],
    themeType: 'renovation',
    targetCountry: 'CH',
    priority: 1,
    category: 'renovation',
  },
  {
    primaryKeyword: 'agrandir visuellement une pièce',
    secondaryKeywords: ['illusion optique', 'miroirs', 'couleurs claires', 'meubles bas', 'lumière'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 1,
    category: 'renovation',
  },
  {
    primaryKeyword: 'transformer un garage en pièce',
    secondaryKeywords: ['extension', 'aménagement', 'permis', 'isolation', 'luminosité'],
    themeType: 'renovation',
    targetCountry: 'FR',
    priority: 2,
    category: 'renovation',
  },
  {
    primaryKeyword: 'moderniser une maison des années 80',
    secondaryKeywords: ['rénovation', 'rafraîchir', 'contemporain', 'démodé', 'budget'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 2,
    category: 'renovation',
  },
  {
    primaryKeyword: 'ouvrir une cloison',
    secondaryKeywords: ['mur porteur', 'ouverture', 'luminosité', 'espace', 'verrière'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 2,
    category: 'renovation',
  },
  {
    primaryKeyword: 'refaire son sol appartement',
    secondaryKeywords: ['parquet', 'carrelage', 'vinyle', 'béton ciré', 'pose'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 2,
    category: 'renovation',
  },

  // ============================================
  // CATÉGORIE: HOME STAGING
  // ============================================
  {
    primaryKeyword: 'home staging avant vente',
    secondaryKeywords: ['valorisation', 'immobilier', 'vendre plus vite', 'investissement', 'neutre'],
    themeType: 'staging',
    targetCountry: 'ALL',
    priority: 1,
    category: 'staging',
  },
  {
    primaryKeyword: 'dépersonnaliser son intérieur',
    secondaryKeywords: ['vente immobilière', 'neutre', 'désencombrer', 'objectif', 'acheteurs'],
    themeType: 'staging',
    targetCountry: 'ALL',
    priority: 1,
    category: 'staging',
  },
  {
    primaryKeyword: 'home staging virtuel',
    secondaryKeywords: ['IA', 'photos', 'avant-après', 'immobilier', 'rentable'],
    themeType: 'staging',
    targetCountry: 'CH',
    priority: 1,
    category: 'staging',
  },
  {
    primaryKeyword: 'valoriser un bien locatif',
    secondaryKeywords: ['investissement', 'louer', 'rentabilité', 'attractif', 'locataires'],
    themeType: 'staging',
    targetCountry: 'CH',
    priority: 2,
    category: 'staging',
  },
  {
    primaryKeyword: 'photos immobilières réussies',
    secondaryKeywords: ['lumière', 'cadrage', 'vendre', 'annonce', 'attractivité'],
    themeType: 'staging',
    targetCountry: 'ALL',
    priority: 2,
    category: 'staging',
  },
  {
    primaryKeyword: 'ranger avant visite immobilière',
    secondaryKeywords: ['désencombrer', 'première impression', 'propreté', 'espace', 'astuces'],
    themeType: 'staging',
    targetCountry: 'FR',
    priority: 2,
    category: 'staging',
  },

  // ============================================
  // CATÉGORIE: EXTÉRIEUR & JARDIN
  // ============================================
  {
    primaryKeyword: 'aménager une terrasse urbaine',
    secondaryKeywords: ['balcon', 'ville', 'petit espace', 'plantes', 'détente'],
    themeType: 'garden',
    targetCountry: 'ALL',
    priority: 1,
    category: 'jardin',
  },
  {
    primaryKeyword: 'jardin paysager contemporain',
    secondaryKeywords: ['design', 'architecture', 'épuré', 'gazon', 'massifs'],
    themeType: 'garden',
    targetCountry: 'CH',
    priority: 1,
    category: 'jardin',
  },
  {
    primaryKeyword: 'créer un coin repas extérieur',
    secondaryKeywords: ['pergola', 'barbecue', 'été', 'convivialité', 'ombre'],
    themeType: 'garden',
    targetCountry: 'ALL',
    priority: 2,
    category: 'jardin',
  },
  {
    primaryKeyword: 'piscine naturelle maison',
    secondaryKeywords: ['baignade écologique', 'plantes filtrantes', 'bio-piscine', 'entretien'],
    themeType: 'garden',
    targetCountry: 'FR',
    priority: 2,
    category: 'jardin',
  },
  {
    primaryKeyword: 'éclairage jardin extérieur',
    secondaryKeywords: ['LED', 'solaire', 'ambiance', 'sécurité', 'spots'],
    themeType: 'garden',
    targetCountry: 'ALL',
    priority: 2,
    category: 'jardin',
  },
  {
    primaryKeyword: 'potager urbain balcon',
    secondaryKeywords: ['herbes aromatiques', 'légumes', 'bacs', 'permaculture', 'bio'],
    themeType: 'garden',
    targetCountry: 'BE',
    priority: 2,
    category: 'jardin',
  },

  // ============================================
  // CATÉGORIE: TENDANCES & INNOVATIONS
  // ============================================
  {
    primaryKeyword: 'décoration écologique',
    secondaryKeywords: ['durable', 'recyclé', 'seconde main', 'naturel', 'éco-responsable'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'tendances',
  },
  {
    primaryKeyword: 'maison connectée décoration',
    secondaryKeywords: ['domotique', 'éclairage intelligent', 'assistant vocal', 'confort', 'technologie'],
    themeType: 'interior_design',
    targetCountry: 'CH',
    priority: 2,
    category: 'tendances',
  },
  {
    primaryKeyword: 'décoration avec plantes vertes',
    secondaryKeywords: ['urban jungle', 'purifier air', 'biophilie', 'bien-être', 'entretien'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'tendances',
  },
  {
    primaryKeyword: 'meubles multifonctions petit espace',
    secondaryKeywords: ['gain de place', 'modulable', 'studio', 'rangement', 'innovation'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'tendances',
  },
  {
    primaryKeyword: 'décoration vintage chinée',
    secondaryKeywords: ['brocante', 'seconde main', 'unique', 'caractère', 'durable'],
    themeType: 'interior_design',
    targetCountry: 'FR',
    priority: 2,
    category: 'tendances',
  },
  {
    primaryKeyword: 'matériaux naturels décoration',
    secondaryKeywords: ['bois', 'pierre', 'lin', 'rotin', 'authenticité'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'tendances',
  },
  {
    primaryKeyword: 'décoration IA intelligence artificielle',
    secondaryKeywords: ['technologie', 'visualisation', 'avant-après', 'innovation', 'pratique'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'tendances',
  },

  // ============================================
  // CATÉGORIE: CONSEILS PRATIQUES
  // ============================================
  {
    primaryKeyword: 'choisir son canapé',
    secondaryKeywords: ['taille', 'matière', 'couleur', 'confort', 'durabilité'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'conseils',
  },
  {
    primaryKeyword: 'éclairage intérieur conseils',
    secondaryKeywords: ['luminaires', 'ambiance', 'LED', 'température couleur', 'variateur'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'conseils',
  },
  {
    primaryKeyword: 'choisir ses rideaux',
    secondaryKeywords: ['voilages', 'occultant', 'mesures', 'style', 'lumière'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'conseils',
  },
  {
    primaryKeyword: 'accrocher ses tableaux',
    secondaryKeywords: ['composition', 'hauteur', 'alignement', 'gallery wall', 'outils'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'conseils',
  },
  {
    primaryKeyword: 'budget décoration appartement',
    secondaryKeywords: ['économiser', 'priorités', 'DIY', 'astuces', 'investir'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'conseils',
  },
  {
    primaryKeyword: 'erreurs décoration éviter',
    secondaryKeywords: ['faux-pas', 'conseils pro', 'harmonie', 'proportions', 'tendances'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'conseils',
  },
  {
    primaryKeyword: 'décorer un appartement en location',
    secondaryKeywords: ['temporaire', 'sans percer', 'réversible', 'locataire', 'astuces'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'conseils',
  },

  // ============================================
  // CATÉGORIE: SPÉCIAL SUISSE
  // ============================================
  {
    primaryKeyword: 'décoration appartement suisse',
    secondaryKeywords: ['Genève', 'Lausanne', 'Zurich', 'qualité', 'design'],
    themeType: 'interior_design',
    targetCountry: 'CH',
    priority: 1,
    category: 'suisse',
  },
  {
    primaryKeyword: 'rénovation maison suisse romande',
    secondaryKeywords: ['Vaud', 'Valais', 'Fribourg', 'autorisation', 'architecte'],
    themeType: 'renovation',
    targetCountry: 'CH',
    priority: 1,
    category: 'suisse',
  },
  {
    primaryKeyword: 'décoration chalet suisse moderne',
    secondaryKeywords: ['Alpes', 'montagne', 'cosy', 'bois', 'tradition'],
    themeType: 'interior_design',
    targetCountry: 'CH',
    priority: 1,
    category: 'suisse',
  },
  {
    primaryKeyword: 'home staging Genève',
    secondaryKeywords: ['immobilier', 'vente rapide', 'valorisation', 'prix', 'marché'],
    themeType: 'staging',
    targetCountry: 'CH',
    priority: 1,
    category: 'suisse',
  },
  {
    primaryKeyword: 'aménager un studio Lausanne',
    secondaryKeywords: ['étudiant', 'petit budget', 'fonctionnel', 'EPFL', 'centre-ville'],
    themeType: 'interior_design',
    targetCountry: 'CH',
    priority: 2,
    category: 'suisse',
  },

  // ============================================
  // CATÉGORIE: SPÉCIAL FRANCE
  // ============================================
  {
    primaryKeyword: 'décoration appartement parisien',
    secondaryKeywords: ['Paris', 'haussmannien', 'petit espace', 'charme', 'lumineux'],
    themeType: 'interior_design',
    targetCountry: 'FR',
    priority: 1,
    category: 'france',
  },
  {
    primaryKeyword: 'maison de campagne française',
    secondaryKeywords: ['charme', 'authentique', 'poutres', 'tomettes', 'rustique'],
    themeType: 'renovation',
    targetCountry: 'FR',
    priority: 1,
    category: 'france',
  },
  {
    primaryKeyword: 'décoration maison basque',
    secondaryKeywords: ['rouge basque', 'tradition', 'Biarritz', 'colombages', 'sud-ouest'],
    themeType: 'interior_design',
    targetCountry: 'FR',
    priority: 2,
    category: 'france',
  },
  {
    primaryKeyword: 'rénovation longère bretonne',
    secondaryKeywords: ['Bretagne', 'granit', 'pierres', 'authenticité', 'moderne'],
    themeType: 'renovation',
    targetCountry: 'FR',
    priority: 2,
    category: 'france',
  },

  // ============================================
  // CATÉGORIE: SPÉCIAL BELGIQUE
  // ============================================
  {
    primaryKeyword: 'décoration maison bruxelloise',
    secondaryKeywords: ['Bruxelles', 'art nouveau', 'maison de maître', 'haut plafond'],
    themeType: 'interior_design',
    targetCountry: 'BE',
    priority: 1,
    category: 'belgique',
  },
  {
    primaryKeyword: 'rénovation maison bourgeoise Belgique',
    secondaryKeywords: ['patrimoine', 'charme', 'moulures', 'cheminée', 'parquet'],
    themeType: 'renovation',
    targetCountry: 'BE',
    priority: 1,
    category: 'belgique',
  },
  {
    primaryKeyword: 'home staging Belgique',
    secondaryKeywords: ['immobilier belge', 'vendre', 'valoriser', 'Wallonie', 'Flandre'],
    themeType: 'staging',
    targetCountry: 'BE',
    priority: 2,
    category: 'belgique',
  },

  // ============================================
  // CATÉGORIE: SAISONNIER
  // ============================================
  {
    primaryKeyword: 'décoration automne maison',
    secondaryKeywords: ['couleurs chaudes', 'cosy', 'citrouilles', 'bougies', 'plaid'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'saisonnier',
  },
  {
    primaryKeyword: 'décoration Noël scandinave',
    secondaryKeywords: ['hygge', 'naturel', 'blanc', 'sapin', 'lumières'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'saisonnier',
  },
  {
    primaryKeyword: 'rafraîchir sa déco été',
    secondaryKeywords: ['légèreté', 'couleurs vives', 'lin', 'ventilation', 'plantes'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 3,
    category: 'saisonnier',
  },
  {
    primaryKeyword: 'décoration printemps maison',
    secondaryKeywords: ['fleurs', 'fraîcheur', 'pastel', 'renouveau', 'lumineux'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 3,
    category: 'saisonnier',
  },
  
  // ============================================
  // CATÉGORIE: NOUVEAUX THÈMES AVANCÉS (21)
  // ============================================
  {
    primaryKeyword: 'aménager petit espace fonctionnel',
    secondaryKeywords: ['optimisation', 'gain de place', 'rangement intelligent', 'multifonction'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'petits-espaces',
  },
  {
    primaryKeyword: 'décoration biophilique intérieur',
    secondaryKeywords: ['plantes', 'nature', 'bien-être', 'air pur', 'connexion nature'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'tendances',
  },
  {
    primaryKeyword: 'home office ergonomique design',
    secondaryKeywords: ['télétravail', 'productivité', 'confort', 'organisation', 'éclairage'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'espaces-travail',
  },
  {
    primaryKeyword: 'décoration maximaliste colorée',
    secondaryKeywords: ['couleurs vives', 'motifs', 'accumulation', 'personnalité', 'audace'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'styles',
  },
  {
    primaryKeyword: 'aménager dressing sur mesure',
    secondaryKeywords: ['rangement vêtements', 'organisation', 'penderie', 'accessoires', 'optimal'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 2,
    category: 'rangement',
  },
  {
    primaryKeyword: 'décoration wabi-sabi imperfection',
    secondaryKeywords: ['japonais', 'authenticité', 'naturel', 'simplicité', 'beauté imparfaite'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'styles',
  },
  {
    primaryKeyword: 'aménager salle de bain spa',
    secondaryKeywords: ['détente', 'luxe', 'relaxation', 'wellness', 'baignoire'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 1,
    category: 'pieces',
  },
  {
    primaryKeyword: 'décoration mur accent statement',
    secondaryKeywords: ['point focal', 'papier peint', 'couleur forte', 'texture', 'impact'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'murs',
  },
  {
    primaryKeyword: 'aménager coin lecture cosy',
    secondaryKeywords: ['bibliothèque', 'confort', 'lumière', 'fauteuil', 'intimité'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'espaces-detente',
  },
  {
    primaryKeyword: 'décoration art déco moderne',
    secondaryKeywords: ['géométrique', 'luxe', 'doré', 'velours', 'élégance'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'styles',
  },
  {
    primaryKeyword: 'aménager cuisine ouverte conviviale',
    secondaryKeywords: ['îlot central', 'flux', 'espace repas', 'luminosité', 'rangement'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 1,
    category: 'pieces',
  },
  {
    primaryKeyword: 'décoration minimaliste japonaise',
    secondaryKeywords: ['zen', 'épuré', 'fonctionnel', 'harmonie', 'simplicité'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'styles',
  },
  {
    primaryKeyword: 'aménager buanderie pratique organisée',
    secondaryKeywords: ['rangement', 'efficacité', 'machines', 'séchage', 'repassage'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 3,
    category: 'pieces',
  },
  {
    primaryKeyword: 'décoration cottagecore champêtre',
    secondaryKeywords: ['rustique', 'fleurs', 'vintage', 'campagne', 'douceur'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'styles',
  },
  {
    primaryKeyword: 'aménager véranda quatre saisons',
    secondaryKeywords: ['extension', 'lumière naturelle', 'isolation', 'vitrée', 'jardin dhiver'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 2,
    category: 'extensions',
  },
  {
    primaryKeyword: 'décoration tons neutres chaleureux',
    secondaryKeywords: ['beige', 'taupe', 'crème', 'naturel', 'apaisant'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 1,
    category: 'couleurs',
  },
  {
    primaryKeyword: 'aménager chambre parentale suite',
    secondaryKeywords: ['dressing', 'salle de bain', 'intimité', 'luxe', 'confort'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 2,
    category: 'pieces',
  },
  {
    primaryKeyword: 'décoration murale galerie art',
    secondaryKeywords: ['cadres', 'photos', 'tableaux', 'disposition', 'accrochage'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'decoration',
  },
  {
    primaryKeyword: 'aménager cave vin élégante',
    secondaryKeywords: ['rangement bouteilles', 'température', 'lumière', 'dégustation', 'conservation'],
    themeType: 'interior_design',
    targetCountry: 'CH',
    priority: 3,
    category: 'espaces-speciaux',
  },
  {
    primaryKeyword: 'décoration feng shui harmonieux',
    secondaryKeywords: ['énergie', 'circulation chi', 'équilibre', 'bien-être', 'positionnement'],
    themeType: 'interior_design',
    targetCountry: 'ALL',
    priority: 2,
    category: 'philosophies',
  },
  {
    primaryKeyword: 'aménager sous-sol habitable lumineux',
    secondaryKeywords: ['soupiraux', 'puits de lumière', 'isolation', 'humidité', 'transformation'],
    themeType: 'renovation',
    targetCountry: 'ALL',
    priority: 2,
    category: 'pieces',
  },
];

// ============================================
// HELPERS
// ============================================

/**
 * Récupère les thèmes par priorité
 */
export function getThemesByPriority(priority: 1 | 2 | 3): BlogTheme[] {
  return BLOG_THEMES.filter((theme) => theme.priority === priority);
}

/**
 * Récupère les thèmes par catégorie
 */
export function getThemesByCategory(category: string): BlogTheme[] {
  return BLOG_THEMES.filter((theme) => theme.category === category);
}

/**
 * Récupère les thèmes pour un pays spécifique
 */
export function getThemesForCountry(country: 'CH' | 'FR' | 'BE'): BlogTheme[] {
  return BLOG_THEMES.filter(
    (theme) => theme.targetCountry === country || theme.targetCountry === 'ALL'
  );
}

/**
 * Récupère les thèmes par type de thème
 */
export function getThemesByThemeType(type: ThemeType): BlogTheme[] {
  return BLOG_THEMES.filter((theme) => theme.themeType === type);
}

/**
 * Sélectionne un thème aléatoire non utilisé récemment
 */
export function selectRandomTheme(usedKeywords: string[] = []): BlogTheme | null {
  const availableThemes = BLOG_THEMES.filter(
    (theme) => !usedKeywords.includes(theme.primaryKeyword)
  );

  if (availableThemes.length === 0) return null;

  // Pondérer par priorité (priorité 1 = 3x plus de chances)
  const weighted: BlogTheme[] = [];
  for (const theme of availableThemes) {
    const weight = 4 - theme.priority; // 1 -> 3, 2 -> 2, 3 -> 1
    for (let i = 0; i < weight; i++) {
      weighted.push(theme);
    }
  }

  return weighted[Math.floor(Math.random() * weighted.length)];
}

/**
 * Statistiques sur les thèmes
 */
export function getThemeStats(): {
  total: number;
  byCategory: Record<string, number>;
  byCountry: Record<string, number>;
  byPriority: Record<number, number>;
} {
  const stats = {
    total: BLOG_THEMES.length,
    byCategory: {} as Record<string, number>,
    byCountry: {} as Record<string, number>,
    byPriority: {} as Record<number, number>,
  };

  for (const theme of BLOG_THEMES) {
    stats.byCategory[theme.category] = (stats.byCategory[theme.category] || 0) + 1;
    stats.byCountry[theme.targetCountry] = (stats.byCountry[theme.targetCountry] || 0) + 1;
    stats.byPriority[theme.priority] = (stats.byPriority[theme.priority] || 0) + 1;
  }

  return stats;
}
