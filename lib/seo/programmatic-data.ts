/**
 * SEO Data: Descriptions enrichies pour les pages programmatiques
 * 
 * Contenu SEO pour les pages /style/[slug] et /piece/[slug]
 * utilisé pour le SEO programmatique à grande échelle.
 */

// ============================================
// STYLES - Descriptions SEO enrichies
// ============================================

export interface StyleSEOData {
  slug: string;
  name: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  hero: string;
  longDescription: string;
  keywords: string[];
  colors: string[];
  materials: string[];
  idealFor: string[];
  priceRange: string;
  difficulty: string;
  faq: Array<{ question: string; answer: string }>;
}

export const STYLE_SEO_DATA: StyleSEOData[] = [
  {
    slug: 'moderne',
    name: 'Moderne',
    title: 'Décoration Moderne',
    metaTitle: 'Décoration Moderne par IA - Transformez votre Intérieur | InstaDeco',
    metaDescription: 'Créez un intérieur moderne et épuré avec notre IA. Lignes nettes, couleurs neutres, matériaux contemporains. Visualisez votre pièce en style moderne en 10 secondes.',
    hero: 'Des lignes épurées, des surfaces lisses. Le style moderne transforme chaque pièce en espace de vie élégant et fonctionnel.',
    longDescription: 'Le style moderne se caractérise par des lignes épurées, des surfaces lisses et un minimalisme fonctionnel. Né au début du XXe siècle, il privilégie les formes géométriques simples, les couleurs neutres et les matériaux comme le verre, l\'acier et le béton. C\'est le style idéal pour ceux qui recherchent un intérieur ordonné et lumineux.',
    keywords: ['décoration moderne', 'intérieur moderne', 'salon moderne', 'chambre moderne', 'design contemporain', 'style épuré'],
    colors: ['Blanc', 'Gris', 'Noir', 'Beige'],
    materials: ['Verre', 'Acier', 'Béton ciré', 'Bois clair'],
    idealFor: ['Appartements citadins', 'Lofts', 'Studios'],
    priceRange: '€€',
    difficulty: 'Moyen',
    faq: [
      { question: 'Comment créer un intérieur moderne ?', answer: 'Misez sur des lignes épurées, des couleurs neutres (blanc, gris, beige), des meubles fonctionnels et un éclairage bien pensé. Évitez le surplus de décorations.' },
      { question: 'Quel budget pour décorer en style moderne ?', answer: 'Un relooking moderne peut commencer à 500€ pour des accessoires jusqu\'à 5000€+ pour un ameublement complet. Avec InstaDeco, visualisez le résultat pour seulement 1€ par génération.' },
      { question: 'Le style moderne convient-il à un petit appartement ?', answer: 'Absolument ! Le moderne est parfait pour les petits espaces car il mise sur l\'essentiel et les lignes épurées qui agrandissent visuellement les pièces.' },
    ],
  },
  {
    slug: 'scandinave',
    name: 'Scandinave',
    title: 'Décoration Scandinave',
    metaTitle: 'Décoration Scandinave (Hygge) par IA - Intérieur Nordique | InstaDeco',
    metaDescription: 'Adoptez le style scandinave et le hygge danois pour votre intérieur. Bois clair, lumière naturelle, confort. Visualisez le rendu par IA en 10 secondes.',
    hero: 'L\'art de vivre nordique : chaleur du bois, lumière naturelle et confort hygge au quotidien.',
    longDescription: 'Originaire des pays nordiques, le style scandinave mise sur la luminosité, le confort et la simplicité. Le bois clair est omniprésent, associé à des textiles douillets et des couleurs pastel. Le concept danois de "hygge" — bien-être — en est l\'essence même.',
    keywords: ['décoration scandinave', 'style nordique', 'intérieur hygge', 'salon scandinave', 'meuble scandinave', 'style suédois'],
    colors: ['Blanc cassé', 'Bois naturel', 'Bleu glacier', 'Rose poudré'],
    materials: ['Bois clair', 'Lin', 'Laine', 'Cuir'],
    idealFor: ['Petits espaces', 'Familles', 'Tous budgets'],
    priceRange: '€',
    difficulty: 'Facile',
    faq: [
      { question: 'Comment obtenir un style scandinave chez soi ?', answer: 'Privilégiez le bois clair, les textiles naturels (lin, laine), beaucoup de blanc et des touches de couleurs pastel. La lumière naturelle est essentielle.' },
      { question: 'Le scandinave est-il adapté en France, Belgique et Suisse ?', answer: 'Oui ! Ce style lumineux et chaleureux fonctionne parfaitement en Suisse romande, en Belgique et en France. Il compense parfaitement le manque de lumière hivernale.' },
      { question: 'Quelles plantes pour un intérieur scandinave ?', answer: 'Optez pour des plantes vertes simples : monstera, pothos, ficus, et des fougères. Elles apportent la touche de nature essentielle au style nordique.' },
    ],
  },
  {
    slug: 'industriel',
    name: 'Industriel',
    title: 'Décoration Industrielle',
    metaTitle: 'Décoration Industrielle & Loft par IA - Style Usine Chic | InstaDeco',
    metaDescription: 'Transformez votre pièce en loft industriel avec l\'IA. Briques apparentes, métal, béton. Obtenez un rendu professionnel en 10 secondes.',
    hero: 'L\'esprit des ateliers et usines reconvertis : briques, métal et caractère brut pour un loft unique.',
    longDescription: 'Né dans les lofts new-yorkais des années 1950, le style industriel conserve et célèbre les éléments bruts : briques apparentes, tuyaux en vue, béton et métal. Il allie robustesse et caractère.',
    keywords: ['décoration industrielle', 'style loft', 'intérieur industriel', 'meuble industriel', 'déco usine', 'brique apparente'],
    colors: ['Gris béton', 'Noir mat', 'Rouille', 'Bois foncé'],
    materials: ['Métal', 'Brique', 'Béton', 'Bois recyclé'],
    idealFor: ['Lofts', 'Grands volumes', 'Espaces ouverts'],
    priceRange: '€€',
    difficulty: 'Moyen',
    faq: [
      { question: 'Peut-on avoir un style industriel sans loft ?', answer: 'Oui ! Un mur en brique (ou papier peint imitation), des luminaires en métal et du mobilier en bois/métal suffisent à créer l\'ambiance dans n\'importe quel espace.' },
      { question: 'Le style industriel est-il chaleureux ?', answer: 'Absolument, quand il est bien dosé ! Ajoutez des textiles doux, du bois chaleureux et un bon éclairage pour éviter l\'effet "entrepôt froid".' },
    ],
  },
  {
    slug: 'boheme',
    name: 'Bohème',
    title: 'Décoration Bohème',
    metaTitle: 'Décoration Bohème (Boho Chic) par IA - Style Ethnique | InstaDeco',
    metaDescription: 'Créez un intérieur bohème et chaleureux avec l\'IA. Macramé, rotin, couleurs chaudes. Visualisez votre pièce en style boho en 10 secondes.',
    hero: 'Liberté, chaleur et personnalité : le boho-chic célèbre le mélange des cultures et des textures.',
    longDescription: 'Le style bohème célèbre le mélange des cultures, des époques et des textures. Tapis berbères, macramé, plantes vertes, coussins ethniques : tout est permis tant que l\'ensemble dégage chaleur et personnalité.',
    keywords: ['décoration bohème', 'style boho', 'intérieur bohème chic', 'déco ethnique', 'salon bohème', 'macramé déco'],
    colors: ['Terracotta', 'Ocre', 'Vert sauge', 'Ivoire'],
    materials: ['Rotin', 'Macramé', 'Kilim', 'Bois brut'],
    idealFor: ['Maisons', 'Espaces créatifs', 'Chambres'],
    priceRange: '€',
    difficulty: 'Facile',
    faq: [
      { question: 'Comment ne pas surcharger un intérieur bohème ?', answer: 'Limitez-vous à 3-4 couleurs chaudes, variez les textures plutôt que les motifs, et laissez de l\'espace entre les éléments décoratifs. Les plantes vertes unifient le tout.' },
      { question: 'Où trouver des meubles style bohème ?', answer: 'Marchés aux puces, brocantes, boutiques ethniques et artisanat en ligne sont vos meilleures sources. Le style boho valorise l\'unique et l\'artisanal.' },
    ],
  },
  {
    slug: 'minimaliste',
    name: 'Minimaliste',
    title: 'Décoration Minimaliste',
    metaTitle: 'Décoration Minimaliste par IA - Less is More | InstaDeco',
    metaDescription: 'Adoptez le minimalisme pour votre intérieur avec l\'IA. Design épuré, fonctionnel et apaisant. Visualisez le rendu en 10 secondes.',
    hero: 'L\'art de vivre avec l\'essentiel : chaque objet a sa fonction, chaque espace respire.',
    longDescription: 'Le minimalisme en décoration supprime le superflu pour ne garder que l\'essentiel. Les surfaces sont dégagées, les couleurs neutres, et chaque meuble est choisi avec intention.',
    keywords: ['décoration minimaliste', 'intérieur minimaliste', 'less is more', 'design épuré', 'salon minimaliste', 'rangement minimaliste'],
    colors: ['Blanc', 'Noir', 'Gris clair', 'Bois naturel'],
    materials: ['Pierre', 'Bois', 'Verre', 'Acier brossé'],
    idealFor: ['Studios', 'Appartements', 'Esprits organisés'],
    priceRange: '€€€',
    difficulty: 'Moyen',
    faq: [
      { question: 'Le minimalisme rend-il un intérieur froid ?', answer: 'Non, si on mise sur les bonnes textures (bois, lin) et un éclairage chaleureux. Le minimalisme bien fait est accueillant et apaisant, pas austère.' },
    ],
  },
  {
    slug: 'japandi',
    name: 'Japandi',
    title: 'Décoration Japandi',
    metaTitle: 'Décoration Japandi par IA - Wabi-Sabi & Hygge | InstaDeco',
    metaDescription: 'Fusionnez le wabi-sabi japonais et le hygge scandinave dans votre intérieur. Style japandi par IA en 10 secondes. Résultat zen et élégant.',
    hero: 'La fusion parfaite entre le wabi-sabi japonais et le hygge scandinave : élégance et sérénité.',
    longDescription: 'Le Japandi est la rencontre de deux philosophies : le wabi-sabi japonais (beauté de l\'imperfection) et le hygge scandinave (confort et bien-être). Le résultat est un intérieur apaisant et d\'une élégance subtile.',
    keywords: ['décoration japandi', 'style wabi sabi', 'intérieur zen', 'déco japonaise scandinave', 'salon japandi', 'tendance japandi 2026'],
    colors: ['Sable', 'Gris chaud', 'Noir charbon', 'Vert mousse'],
    materials: ['Céramique', 'Bois clair', 'Bambou', 'Pierre naturelle'],
    idealFor: ['Espaces zen', 'Chambres', 'Salles de bain'],
    priceRange: '€€€',
    difficulty: 'Expert',
    faq: [
      { question: 'Quelle est la différence entre japandi et minimaliste ?', answer: 'Le japandi intègre la chaleur et l\'imperfection (wabi-sabi) que le pur minimalisme rejette. Il accepte les textures organiques et les formes légèrement irrégulières.' },
    ],
  },
  {
    slug: 'art-deco',
    name: 'Art Déco',
    title: 'Décoration Art Déco',
    metaTitle: 'Décoration Art Déco par IA - Glamour Années 20 | InstaDeco',
    metaDescription: 'Recréez le glamour des années folles dans votre intérieur. Laiton, velours, motifs géométriques. Visualisation Art Déco par IA.',
    hero: 'Le glamour des années folles : formes géométriques audacieuses, laiton et velours somptueux.',
    longDescription: 'Né dans les années 1920, l\'Art Déco est synonyme de luxe et d\'élégance avec ses motifs géométriques audacieux et ses matériaux nobles.',
    keywords: ['décoration art déco', 'style années 20', 'intérieur glamour', 'salon art déco', 'haussmannien art déco'],
    colors: ['Bleu nuit', 'Or', 'Vert émeraude', 'Noir'],
    materials: ['Laiton', 'Velours', 'Marbre', 'Miroir'],
    idealFor: ['Appartements haussmanniens', 'Hôtels', 'Restaurants'],
    priceRange: '€€€',
    difficulty: 'Expert',
    faq: [
      { question: 'L\'Art Déco convient-il à un petit appartement ?', answer: 'Oui ! Quelques touches suffisent : un miroir doré, un luminaire géométrique et un fauteuil en velours peuvent transformer un petit espace.' },
    ],
  },
  {
    slug: 'contemporain',
    name: 'Contemporain',
    title: 'Décoration Contemporaine',
    metaTitle: 'Décoration Contemporaine par IA - Tendances 2026 | InstaDeco',
    metaDescription: 'Adoptez les dernières tendances déco 2026 pour votre intérieur. Design contemporain, couleurs tendance, matériaux innovants. Rendu IA en 10 secondes.',
    hero: 'Un style en mouvement qui absorbe les meilleures tendances du moment : frais, audacieux et actuel.',
    longDescription: 'Le contemporain est en constante évolution, absorbant les tendances du moment — couleurs de l\'année, matériaux innovants, formes organiques.',
    keywords: ['décoration contemporaine', 'tendances déco 2026', 'design contemporain', 'salon contemporain', 'idées déco actuelles'],
    colors: ['Nude', 'Vert olive', 'Terracotta', 'Bleu Klein'],
    materials: ['Terrazzo', 'Bouclette', 'Travertin', 'Liège'],
    idealFor: ['Tous types', 'Amateurs de tendances', 'Projets neufs'],
    priceRange: '€€',
    difficulty: 'Moyen',
    faq: [
      { question: 'Quelle est la tendance déco 2026 ?', answer: 'Le biophilic design (intégration de la nature), les couleurs terreuses, les formes organiques et les matériaux durables dominent les tendances 2026.' },
    ],
  },
  {
    slug: 'rustique',
    name: 'Rustique',
    title: 'Décoration Rustique',
    metaTitle: 'Décoration Rustique & Campagne par IA - Charme Authentique | InstaDeco',
    metaDescription: 'Créez un intérieur rustique et chaleureux. Bois massif, pierre naturelle, charme de la campagne. Visualisation par IA instantanée.',
    hero: 'La chaleur de la campagne : bois massif, pierre naturelle et authenticité pour un intérieur accueillant.',
    longDescription: 'Le style rustique puise son inspiration dans les maisons de campagne traditionnelles avec poutres apparentes, pierre naturelle et bois massif.',
    keywords: ['décoration rustique', 'intérieur campagne', 'maison campagne', 'déco chalet', 'style campagne chic', 'chalet suisse'],
    colors: ['Brun', 'Crème', 'Vert forêt', 'Rouge brique'],
    materials: ['Bois massif', 'Pierre', 'Terre cuite', 'Fer forgé'],
    idealFor: ['Chalets', 'Maisons de campagne', 'Gîtes'],
    priceRange: '€',
    difficulty: 'Facile',
    faq: [
      { question: 'Comment moderniser un intérieur rustique ?', answer: 'Gardez les éléments de caractère (poutres, pierre) et modernisez avec un éclairage contemporain, des textiles actuels et des couleurs neutres.' },
    ],
  },
  {
    slug: 'coastal',
    name: 'Coastal',
    title: 'Décoration Coastal (Bord de Mer)',
    metaTitle: 'Décoration Bord de Mer par IA - Style Coastal | InstaDeco',
    metaDescription: 'Apportez l\'esprit vacances dans votre intérieur. Bleu, blanc, matières naturelles. Décoration coastal par IA en 10 secondes.',
    hero: 'L\'esprit vacances toute l\'année : bleu océan, blanc écume et matières naturelles.',
    longDescription: 'Le style coastal transporte l\'océan dans votre intérieur, dominé par les bleus et les blancs avec du bois flotté, rotin et lin.',
    keywords: ['décoration bord de mer', 'style coastal', 'intérieur plage', 'déco maritime', 'salon bord de mer', 'chambre marine'],
    colors: ['Bleu marine', 'Blanc', 'Sable', 'Corail'],
    materials: ['Bois flotté', 'Corde', 'Lin', 'Coquillages'],
    idealFor: ['Appartements côtiers', 'Résidences secondaires', 'Chambres d\'hôtes'],
    priceRange: '€',
    difficulty: 'Facile',
    faq: [
      { question: 'Le style bord de mer fonctionne-t-il loin de la mer ?', answer: 'Absolument ! C\'est même son charme : recréer l\'ambiance vacances chez soi, que vous soyez à Paris, Genève ou Bruxelles.' },
    ],
  },
  {
    slug: 'mid-century',
    name: 'Mid-Century Modern',
    title: 'Décoration Mid-Century Modern',
    metaTitle: 'Décoration Mid-Century Modern par IA - Design Vintage 50-60 | InstaDeco',
    metaDescription: 'Adoptez le design iconique des années 50-60 pour votre intérieur. Pieds compas, formes organiques, couleurs vives. Rendu IA instantané.',
    hero: 'Le design iconique des années 50-60 : pieds compas, formes organiques et couleurs audacieuses.',
    longDescription: 'Le Mid-Century Modern fait référence au design des années 1945-1975, caractérisé par ses pieds compas, ses formes organiques et son mélange de matériaux.',
    keywords: ['décoration mid century', 'style années 50', 'meuble vintage', 'design rétro', 'salon mid century', 'chaise eames'],
    colors: ['Moutarde', 'Teal', 'Orange brûlé', 'Bois noyer'],
    materials: ['Noyer', 'Teck', 'Plastique moulé', 'Laiton'],
    idealFor: ['Appartements', 'Amateurs de design', 'Collectionneurs'],
    priceRange: '€€€',
    difficulty: 'Moyen',
    faq: [
      { question: 'Où trouver de vrais meubles mid-century ?', answer: 'Brocantes, plateformes vintage (Selency, 1stDibs), et des rééditions officielles chez des fabricants comme Vitra, Knoll ou Herman Miller.' },
    ],
  },
  {
    slug: 'luxe',
    name: 'Luxe',
    title: 'Décoration Luxe',
    metaTitle: 'Décoration Luxe & Prestige par IA - Intérieur Haut de Gamme | InstaDeco',
    metaDescription: 'Créez un intérieur luxueux avec l\'IA. Marbre, laiton, velours, cristal. Visualisez votre pièce en version prestige en 10 secondes.',
    hero: 'L\'opulence maîtrisée : marbre de Carrare, laiton poli et textiles somptueux.',
    longDescription: 'Le style luxe incarne l\'opulence et le raffinement avec marbre, laiton poli, velours soyeux et cristal.',
    keywords: ['décoration luxe', 'intérieur haut de gamme', 'déco premium', 'salon luxueux', 'chambre luxe', 'penthouse'],
    colors: ['Or', 'Noir profond', 'Crème', 'Burgundy'],
    materials: ['Marbre', 'Cristal', 'Soie', 'Laiton poli'],
    idealFor: ['Résidences de prestige', 'Penthouse', 'Suites'],
    priceRange: '€€€€',
    difficulty: 'Expert',
    faq: [
      { question: 'Comment donner un effet luxe sans gros budget ?', answer: 'Concentrez-vous sur les détails : accessoires dorés, coussins en velours, bougies parfumées, éclairage tamisé et miroirs. Le luxe est une question de finitions.' },
    ],
  },
];

// ============================================
// PIÈCES - Descriptions SEO enrichies
// ============================================

export interface RoomSEOData {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  hero: string;
  longDescription: string;
  keywords: string[];
  stylesRecommended: string[];
  tips: string[];
  faq: Array<{ question: string; answer: string }>;
}

export const ROOM_SEO_DATA: RoomSEOData[] = [
  {
    slug: 'salon',
    name: 'Salon',
    metaTitle: 'Décoration Salon par IA - Transformez votre Séjour | InstaDeco',
    metaDescription: 'Redécorez votre salon avec l\'IA en 10 secondes. 12+ styles disponibles. Visualisez le rendu avant d\'acheter. Salon moderne, scandinave, bohème...',
    hero: 'Votre salon est le cœur de votre maison. Donnez-lui le style qu\'il mérite.',
    longDescription: 'Le salon est la pièce la plus importante de votre intérieur : c\'est là que vous recevez, que vous vous détendez et que vous vivez. Un bon aménagement de salon doit être à la fois esthétique et fonctionnel.',
    keywords: ['décoration salon', 'aménagement salon', 'salon moderne', 'salon scandinave', 'relooking salon', 'idées salon', 'salon cosy'],
    stylesRecommended: ['moderne', 'scandinave', 'boheme', 'industriel', 'contemporain'],
    tips: ['Commencez par définir les zones (TV, lecture, conversation)', 'Un tapis structure visuellement l\'espace', 'Mixez les sources de lumière (suspension, lampadaire, bougie)'],
    faq: [
      { question: 'Comment agrandir un petit salon ?', answer: 'Utilisez des couleurs claires, des miroirs, un éclairage bien pensé et des meubles proportionnés. Un tapis clair au sol donne l\'illusion de grandeur.' },
      { question: 'Quel style pour un salon moderne ?', answer: 'Optez pour des lignes épurées, une palette neutre (blanc, gris, bois clair) et des meubles fonctionnels. Ajoutez une ou deux touches de couleur en accent.' },
    ],
  },
  {
    slug: 'chambre',
    name: 'Chambre',
    metaTitle: 'Décoration Chambre par IA - Créez votre Cocon | InstaDeco',
    metaDescription: 'Transformez votre chambre en un espace de repos parfait avec l\'IA. Styles cosy, zen, luxe. Visualisez le résultat en 10 secondes.',
    hero: 'Votre chambre, votre sanctuaire. Un espace de repos qui vous ressemble.',
    longDescription: 'La chambre est votre refuge personnel. Sa décoration doit favoriser le repos et le bien-être, tout en reflétant votre personnalité.',
    keywords: ['décoration chambre', 'chambre cosy', 'chambre moderne', 'tête de lit', 'amenagement chambre', 'chambre adulte'],
    stylesRecommended: ['scandinave', 'japandi', 'boheme', 'luxe', 'minimaliste'],
    tips: ['La tête de lit est le point focal : investissez dedans', 'Optez pour un éclairage tamisé et modulable', 'Les textiles (linge de lit, rideaux) font 80% de l\'ambiance'],
    faq: [
      { question: 'Comment décorer une chambre pour mieux dormir ?', answer: 'Privilégiez des couleurs apaisantes (bleu, vert, beige), éliminez les écrans, investissez dans des rideaux occultants et choisissez un linge de lit de qualité.' },
    ],
  },
  {
    slug: 'cuisine',
    name: 'Cuisine',
    metaTitle: 'Décoration Cuisine par IA - Rénovation Visuelle Instantanée | InstaDeco',
    metaDescription: 'Visualisez votre nouvelle cuisine avant de rénover. IA de décoration pour cuisine moderne, campagne chic ou contemporaine. Résultat en 10s.',
    hero: 'La cuisine est le nouveau salon. Faites-en un espace aussi beau que fonctionnel.',
    longDescription: 'La cuisine moderne est bien plus qu\'un lieu de préparation : c\'est un espace de vie, de partage et de convivialité. Sa rénovation est souvent coûteuse — visualisez avant d\'investir.',
    keywords: ['décoration cuisine', 'rénovation cuisine', 'cuisine moderne', 'cuisine ouverte', 'îlot central', 'crédence cuisine'],
    stylesRecommended: ['contemporain', 'moderne', 'rustique', 'industriel'],
    tips: ['L\'éclairage sous les meubles hauts change tout', 'Une crédence graphique peut transformer la cuisine', 'L\'îlot central est la tendance n°1 en 2026'],
    faq: [
      { question: 'Combien coûte une rénovation de cuisine ?', answer: 'Entre 5000€ et 30 000€+ selon l\'ampleur. Avec InstaDeco, visualisez le résultat final pour seulement 1€ avant de vous lancer dans les travaux.' },
    ],
  },
  {
    slug: 'salle-de-bain',
    name: 'Salle de bain',
    metaTitle: 'Décoration Salle de Bain par IA - Inspiration Spa | InstaDeco',
    metaDescription: 'Transformez votre salle de bain en spa avec l\'IA. Salle de bain moderne, zen, luxe. Visualisez le résultat avant de rénover.',
    hero: 'Transformez votre salle de bain en espace spa. Le bien-être commence chez soi.',
    longDescription: 'La salle de bain est devenue un véritable espace de bien-être. De la douche italienne au meuble vasque design, les possibilités sont infinies.',
    keywords: ['décoration salle de bain', 'salle de bain moderne', 'douche italienne', 'meuble vasque', 'carrelage salle de bain'],
    stylesRecommended: ['japandi', 'moderne', 'luxe', 'contemporain'],
    tips: ['La douche italienne apporte une sensation d\'espace', 'Un carrelage grand format agrandit visuellement', 'Pensez aux plantes d\'intérieur résistantes à l\'humidité'],
    faq: [
      { question: 'Comment moderniser une salle de bain sans gros travaux ?', answer: 'Changez les accessoires (robinets, miroir, luminaire), ajoutez des plantes, remplacez le rideau de douche par une paroi en verre et repeignez les murs.' },
    ],
  },
  {
    slug: 'bureau',
    name: 'Bureau',
    metaTitle: 'Décoration Bureau & Home Office par IA - Productivité x Design | InstaDeco',
    metaDescription: 'Aménagez un bureau productif et esthétique avec l\'IA. Home office, bureau professionnel, espace de travail. Design par IA en 10 secondes.',
    hero: 'Un bureau bien pensé booste votre productivité. Design et ergonomie, enfin réunis.',
    longDescription: 'Depuis la généralisation du télétravail, le home office est devenu essentiel. Un espace de travail bien conçu améliore la concentration, la posture et la motivation.',
    keywords: ['décoration bureau', 'home office', 'bureau à domicile', 'espace de travail', 'bureau moderne', 'aménagement bureau'],
    stylesRecommended: ['moderne', 'scandinave', 'minimaliste', 'industriel'],
    tips: ['La lumière naturelle est cruciale pour la concentration', 'Séparez visuellement le bureau du reste de la pièce', 'Investissez dans un bon éclairage de bureau'],
    faq: [
      { question: 'Comment aménager un bureau dans un petit espace ?', answer: 'Utilisez un bureau mural rabattable, des étagères murales pour le rangement vertical, et une bonne lampe de bureau. Même 2m² suffisent pour un espace de travail efficace.' },
    ],
  },
  {
    slug: 'entree',
    name: 'Entrée',
    metaTitle: 'Décoration Entrée & Hall par IA - Première Impression | InstaDeco',
    metaDescription: 'L\'entrée donne le ton de votre intérieur. Décorez-la avec l\'IA : rangement, luminaire, miroir. Visualisez instantanément.',
    hero: 'La première impression compte. Votre entrée donne le ton de tout votre intérieur.',
    longDescription: 'L\'entrée est la carte de visite de votre maison. Bien aménagée, elle accueille chaleureusement vos invités et structure votre quotidien.',
    keywords: ['décoration entrée', 'hall d\'entrée', 'meuble entrée', 'vestiaire entrée', 'aménagement entrée'],
    stylesRecommended: ['moderne', 'scandinave', 'contemporain'],
    tips: ['Un miroir agrandit visuellement l\'espace', 'Un banc avec rangement est plus pratique qu\'un simple porte-manteau', 'L\'éclairage d\'ambiance crée un accueil chaleureux'],
    faq: [
      { question: 'Comment décorer une petite entrée ?', answer: 'Misez sur un miroir pour agrandir l\'espace, des crochets muraux plutôt qu\'un meuble encombrant, et un tapis d\'accueil coloré pour donner le ton.' },
    ],
  },
  {
    slug: 'terrasse',
    name: 'Terrasse',
    metaTitle: 'Décoration Terrasse & Balcon par IA - Espace Extérieur | InstaDeco',
    metaDescription: 'Aménagez votre terrasse ou balcon avec l\'IA. Mobilier outdoor, plantes, éclairage. Visualisez votre futur espace extérieur en 10 secondes.',
    hero: 'Votre terrasse est une pièce en plus. Faites-en un havre de paix en plein air.',
    longDescription: 'La terrasse ou le balcon est devenu un prolongement essentiel de l\'habitat, surtout en ville. Son aménagement fait gagner des mètres carrés de vie.',
    keywords: ['décoration terrasse', 'aménagement balcon', 'mobilier extérieur', 'terrasse moderne', 'balcon déco'],
    stylesRecommended: ['coastal', 'boheme', 'contemporain', 'rustique'],
    tips: ['Des plantes en pot structurent l\'espace', 'Un éclairage guirlande LED crée l\'ambiance', 'Un tapis d\'extérieur délimite les zones'],
    faq: [
      { question: 'Comment aménager un petit balcon ?', answer: 'Utilisez du mobilier pliable, des jardinières porte-à-faux, et maximisez l\'espace vertical avec des étagères et des plantes suspendues.' },
    ],
  },
  {
    slug: 'salle-a-manger',
    name: 'Salle à manger',
    metaTitle: 'Décoration Salle à Manger par IA - Espace Convivial | InstaDeco',
    metaDescription: 'Redécorez votre salle à manger avec l\'IA. Table, chaises, luminaire : visualisez le résultat en 10 secondes. Styles modernes et classiques.',
    hero: 'La salle à manger, lieu de partage et de convivialité. Un espace qui rassemble.',
    longDescription: 'La salle à manger est le lieu des repas partagés, des fêtes et des moments en famille. Son aménagement doit favoriser le confort et la convivialité.',
    keywords: ['décoration salle à manger', 'table salle à manger', 'chaises design', 'luminaire salle à manger', 'aménagement séjour'],
    stylesRecommended: ['scandinave', 'contemporain', 'rustique', 'industriel'],
    tips: ['Le luminaire au-dessus de la table est le point focal', 'Choisissez des chaises confortables, pas seulement belles', 'Un banc sur un côté ajoute du caractère et de la place'],
    faq: [
      { question: 'Quelle taille de table pour ma salle à manger ?', answer: 'Comptez 60cm de largeur par convive. Une table de 160cm accueille confortablement 6 personnes. Prévoyez aussi 80cm de recul derrière les chaises.' },
    ],
  },
];

export function getStyleSEOBySlug(slug: string): StyleSEOData | undefined {
  return STYLE_SEO_DATA.find((s) => s.slug === slug);
}

export function getRoomSEOBySlug(slug: string): RoomSEOData | undefined {
  return ROOM_SEO_DATA.find((r) => r.slug === slug);
}
