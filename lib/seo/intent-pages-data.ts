/**
 * SEO Intent Pages Data
 * 
 * Pages ciblant des requêtes intentionnelles spécifiques
 * (ex: "home staging virtuel", "simulateur déco", "logiciel home staging gratuit")
 * 
 * Ces pages convertissent mieux que les pages informationnelles
 * car l'utilisateur cherche activement une solution.
 */

export interface IntentPageData {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  hero: {
    headline: string;
    subheadline: string;
    cta: string;
    ctaLink: string;
  };
  /** Problème que la page résout */
  problem: {
    title: string;
    points: string[];
  };
  /** Notre solution */
  solution: {
    title: string;
    description: string;
    benefits: Array<{ icon: string; title: string; description: string }>;
  };
  /** Comparaison avec alternatives */
  comparison?: {
    title: string;
    alternatives: Array<{
      name: string;
      price: string;
      time: string;
      quality: string;
      isUs?: boolean;
    }>;
  };
  /** Étapes d'utilisation */
  steps: Array<{ step: number; title: string; description: string }>;
  /** FAQ */
  faq: Array<{ question: string; answer: string }>;
  /** Keywords pour le SEO */
  keywords: string[];
  /** Articles de blog liés (maillage hub-and-spoke : le pillar pointe vers ses spokes). */
  relatedArticles?: Array<{ slug: string; title: string }>;
}

export const INTENT_PAGES: IntentPageData[] = [
  {
    slug: 'home-staging-virtuel',
    title: 'Home Staging Virtuel par IA',
    metaTitle: 'Home Staging Virtuel par IA : meublez vos pièces en 30 secondes',
    metaDescription: 'Home staging virtuel par intelligence artificielle. Meublez et décorez vos pièces vides en 30 secondes. Alternative 50x moins chère au home staging physique.',
    hero: {
      headline: 'Home Staging Virtuel par IA',
      subheadline: 'Meublez et décorez n\'importe quelle pièce en 30 secondes. Résultat photoréaliste. 50x moins cher que le home staging physique.',
      cta: 'Essayer le home staging virtuel',
      ctaLink: '/generate',
    },
    problem: {
      title: 'Le home staging physique est trop cher',
      points: [
        'Un home staging physique coûte entre 2 000€ et 15 000€ par bien',
        'Les délais de mise en place prennent 2 à 4 semaines',
        'Il faut louer du mobilier, engager un stager, transporter les meubles',
        'Impossible de tester plusieurs styles avant de choisir',
      ],
    },
    solution: {
      title: 'Le home staging virtuel par IA change la donne',
      description: 'InstaDeco transforme vos photos de pièces vides en intérieurs meublés et décorés en 30 secondes grâce à l\'intelligence artificielle Flux.1.',
      benefits: [
        { icon: 'clock', title: '30 secondes', description: 'Résultat instantané, pas de délai d\'attente' },
        { icon: 'euro', title: 'Dès 1€/image', description: '50x moins cher que le staging physique' },
        { icon: 'palette', title: '12+ styles', description: 'Testez scandinave, moderne, industriel et plus' },
        { icon: 'camera', title: 'Photoréaliste', description: 'Résultats haute qualité pour vos annonces' },
      ],
    },
    comparison: {
      title: 'Comparaison des solutions de home staging',
      alternatives: [
        { name: 'Home staging physique', price: '2 000€ - 15 000€', time: '2-4 semaines', quality: 'Excellent' },
        { name: 'Photographe 3D', price: '300€ - 800€/image', time: '3-7 jours', quality: 'Très bon' },
        { name: 'InstaDeco (IA)', price: '1€ - 3€/image', time: '30 secondes', quality: 'Très bon', isUs: true },
      ],
    },
    steps: [
      { step: 1, title: 'Uploadez votre photo', description: 'Prenez une photo de votre pièce vide ou à redécorer' },
      { step: 2, title: 'Choisissez un style', description: 'Sélectionnez parmi 12 styles déco : scandinave, moderne, bohème...' },
      { step: 3, title: 'Résultat en 30 secondes', description: 'L\'IA génère un rendu photoréaliste de votre pièce meublée' },
    ],
    faq: [
      { question: 'Le home staging virtuel est-il aussi efficace que le physique ?', answer: 'Le home staging virtuel permet aux acquéreurs de se projeter dans un bien meublé, comme le staging physique, mais pour une fraction du coût et en quelques secondes seulement.' },
      { question: 'Les images sont-elles utilisables pour des annonces immobilières ?', answer: 'Oui ! Nos rendus sont en haute résolution et photoréalistes. Ils sont parfaits pour les portails immobiliers (SeLoger, Idealista, Immoweb, etc.).' },
      { question: 'Combien coûte le home staging virtuel avec InstaDeco ?', answer: 'À partir de 1€ par image avec le pack Découverte. Les professionnels bénéficient de tarifs dégressifs avec nos packs Pro.' },
      { question: 'Puis-je tester plusieurs styles pour la même pièce ?', answer: 'Absolument ! C\'est l\'un des grands avantages du virtuel : testez scandinave, moderne, industriel et choisissez celui qui plaît le plus aux acheteurs.' },
    ],
    keywords: ['home staging virtuel', 'home staging IA', 'home staging en ligne', 'meublage virtuel', 'staging virtuel immobilier', 'home staging pas cher', 'logiciel home staging'],
  },
  {
    slug: 'simulateur-decoration-interieur',
    title: 'Simulateur de Décoration Intérieure par IA',
    metaTitle: 'Simulateur Déco Intérieur Gratuit par IA : visualisez avant de décorer',
    metaDescription: 'Simulateur de décoration intérieure par IA. Uploadez une photo de votre pièce et visualisez le résultat avec différents styles déco en 30 secondes.',
    hero: {
      headline: 'Simulateur de Décoration Intérieure',
      subheadline: 'Visualisez votre future décoration avant d\'acheter quoi que ce soit. Uploadez une photo, choisissez un style, voyez le résultat en 30 secondes.',
      cta: 'Tester le simulateur',
      ctaLink: '/generate',
    },
    problem: {
      title: 'Décorer à l\'aveugle, c\'est risqué',
      points: [
        'Acheter des meubles sans visualiser le rendu = risque de déception',
        'Les échantillons de peinture ne donnent pas le résultat final',
        'Engager un décorateur coûte entre 500€ et 3 000€',
        'Les logiciels 3D sont complexes et demandent des heures d\'apprentissage',
      ],
    },
    solution: {
      title: 'Visualisez votre déco en 30 secondes avec l\'IA',
      description: 'Notre simulateur utilise l\'intelligence artificielle pour transformer vos photos de pièces réelles en propositions de décoration complètes.',
      benefits: [
        { icon: 'zap', title: 'Instantané', description: 'Pas de logiciel à installer, résultat en 30 secondes' },
        { icon: 'palette', title: '12 styles', description: 'Du scandinave au japonais, tous les styles populaires' },
        { icon: 'upload', title: 'Votre pièce', description: 'Basé sur VOS photos, pas des modèles génériques' },
        { icon: 'download', title: 'Téléchargeable', description: 'Sauvegardez et partagez vos simulations' },
      ],
    },
    steps: [
      { step: 1, title: 'Photographiez votre pièce', description: 'Prenez une photo de la pièce que vous souhaitez redécorer' },
      { step: 2, title: 'Sélectionnez un style', description: 'Choisissez parmi nos 12 styles : moderne, bohème, japandi...' },
      { step: 3, title: 'Visualisez le résultat', description: 'L\'IA génère un rendu réaliste de votre pièce redécorée' },
    ],
    faq: [
      { question: 'Le simulateur est-il gratuit ?', answer: 'Vous pouvez tester gratuitement avec vos crédits de bienvenue. Ensuite, les packs démarrent à 9,99€ pour 10 générations.' },
      { question: 'Est-ce que ça marche avec n\'importe quelle pièce ?', answer: 'Oui ! Salon, chambre, cuisine, salle de bain, bureau, entrée... le simulateur fonctionne avec tous les types de pièces.' },
      { question: 'La qualité est-elle suffisante pour prendre des décisions ?', answer: 'Nos rendus sont photoréalistes et donnent une très bonne idée du résultat final. C\'est l\'outil parfait pour valider un choix de style avant d\'investir.' },
      { question: 'Dois-je installer un logiciel ?', answer: 'Non ! Le simulateur fonctionne 100% en ligne, directement dans votre navigateur. Aucune installation requise.' },
    ],
    keywords: ['simulateur décoration intérieur', 'simulateur déco', 'visualisateur déco', 'simulateur aménagement intérieur', 'outil décoration', 'application décoration intérieur'],
  },
  {
    slug: 'logiciel-home-staging',
    title: 'Logiciel de Home Staging en Ligne',
    metaTitle: 'Logiciel de home staging à partir d\'une photo',
    metaDescription: 'Logiciel de home staging virtuel à partir d\'une photo. Aucune installation : uploadez la photo d\'une pièce, l\'IA la meuble et la décore pour vos annonces immobilières. Essai gratuit.',
    hero: {
      headline: 'Le Logiciel de Home Staging le Plus Simple',
      subheadline: 'Pas de logiciel à installer. Pas de formation nécessaire. Uploadez une photo, l\'IA fait le reste en 30 secondes.',
      cta: 'Essayer maintenant',
      ctaLink: '/generate',
    },
    problem: {
      title: 'Les logiciels de home staging traditionnels sont compliqués',
      points: [
        'Logiciels 3D complexes avec courbe d\'apprentissage de plusieurs semaines',
        'Licences coûteuses (100€ à 500€/mois)',
        'Nécessitent un ordinateur puissant',
        'Chaque image demande des heures de travail manuel',
      ],
    },
    solution: {
      title: 'InstaDeco : le home staging sans effort',
      description: 'Grâce à l\'IA, plus besoin de maîtriser un logiciel 3D. Uploadez une photo, choisissez un style, et obtenez un rendu professionnel instantanément.',
      benefits: [
        { icon: 'globe', title: '100% en ligne', description: 'Fonctionne sur mobile, tablette et ordinateur' },
        { icon: 'brain', title: 'IA intelligente', description: 'L\'IA comprend l\'espace et le décore de façon cohérente' },
        { icon: 'layers', title: 'Plusieurs styles', description: 'Générez facilement plusieurs versions pour comparer' },
        { icon: 'trending-up', title: 'ROI immédiat', description: 'Rentabilisé dès la première utilisation' },
      ],
    },
    comparison: {
      title: 'InstaDeco vs logiciels de home staging traditionnels',
      alternatives: [
        { name: 'Logiciel 3D pro', price: '100-500€/mois', time: '2-5h/image', quality: 'Excellent' },
        { name: 'App mobile staging', price: '20-50€/mois', time: '30-60 min', quality: 'Moyen' },
        { name: 'InstaDeco (IA)', price: 'Dès 1€/image', time: '30 secondes', quality: 'Très bon', isUs: true },
      ],
    },
    steps: [
      { step: 1, title: 'Uploadez', description: 'Glissez-déposez votre photo de la pièce' },
      { step: 2, title: 'Choisissez', description: 'Sélectionnez le style de décoration souhaité' },
      { step: 3, title: 'Téléchargez', description: 'Récupérez votre image de home staging en haute résolution' },
    ],
    faq: [
      { question: 'InstaDeco remplace-t-il un logiciel 3D professionnel ?', answer: 'Pour le home staging d\'annonces immobilières, oui. Pour des plans techniques d\'architecte d\'intérieur, un logiciel 3D reste nécessaire. InstaDeco excelle dans la visualisation rapide.' },
      { question: 'Quelle résolution pour les images générées ?', answer: 'Les images sont générées en résolution standard. L\'option HD est disponible pour obtenir des images en très haute résolution, parfaites pour l\'impression.' },
      { question: 'Y a-t-il un essai gratuit ?', answer: 'Oui ! Chaque nouveau compte reçoit des crédits gratuits pour tester le service. Aucune carte bancaire requise.' },
    ],
    keywords: ['logiciel home staging', 'logiciel home staging gratuit', 'application home staging', 'outil home staging virtuel', 'logiciel meublage virtuel'],
  },
  {
    slug: 'idee-amenagement-studio',
    title: 'Idées d\'Aménagement Studio & Petit Espace',
    metaTitle: 'Idées Aménagement Studio 20m² 30m² : visualisez par IA',
    metaDescription: 'Découvrez des idées d\'aménagement pour votre studio ou petit appartement. Visualisez le résultat avec l\'IA avant de commencer les travaux.',
    hero: {
      headline: 'Aménagez Votre Studio avec l\'IA',
      subheadline: 'Studio de 20m², 25m² ou 30m² ? Visualisez des dizaines d\'aménagements possibles en quelques minutes. Optimisez chaque mètre carré.',
      cta: 'Visualiser mon studio',
      ctaLink: '/generate',
    },
    problem: {
      title: 'Aménager un studio est un casse-tête',
      points: [
        'Chaque mètre carré compte, impossible de se tromper',
        'Difficile de visualiser le rendu avant d\'acheter les meubles',
        'Un architecte d\'intérieur pour un studio coûte 1 000€ minimum',
        'Les plans 2D ne donnent pas le rendu réel',
      ],
    },
    solution: {
      title: 'Testez des dizaines d\'aménagements en quelques minutes',
      description: 'Prenez votre studio en photo et testez différents styles et aménagements avec l\'IA. Trouvez LA configuration idéale avant d\'acheter quoi que ce soit.',
      benefits: [
        { icon: 'maximize', title: 'Optimisation espace', description: 'L\'IA s\'adapte à votre configuration exacte' },
        { icon: 'repeat', title: 'Itérations illimitées', description: 'Testez moderne, scandinave, japandi et plus en 1 clic' },
        { icon: 'euro', title: 'Économies', description: 'Évitez les achats inutiles en validant le style avant' },
        { icon: 'eye', title: 'Vision réaliste', description: 'Rendu photoréaliste basé sur VOS photos' },
      ],
    },
    steps: [
      { step: 1, title: 'Photographiez votre studio', description: 'Prenez des photos sous différents angles' },
      { step: 2, title: 'Testez les styles', description: 'Essayez scandinave pour agrandir visuellement, moderne pour épurer...' },
      { step: 3, title: 'Choisissez et achetez', description: 'Identifiez le style qui marche et achetez en confiance' },
    ],
    faq: [
      { question: 'Quel style pour un studio de 20m² ?', answer: 'Le scandinave et le minimaliste sont idéaux pour les petits espaces : couleurs claires, meubles fonctionnels, maximum de lumière. Testez-les avec InstaDeco !' },
      { question: 'L\'IA comprend-elle les contraintes d\'espace ?', answer: 'L\'IA analyse votre photo et propose un aménagement cohérent avec l\'espace disponible. Elle ne va pas mettre un canapé 3 places dans un recoin de 2m².' },
      { question: 'Puis-je montrer le résultat à mon propriétaire ?', answer: 'Oui ! Les rendus sont parfaits pour présenter un projet de redécoration à un propriétaire ou pour valider des idées avant de se lancer.' },
    ],
    keywords: ['idée aménagement studio', 'aménagement studio 20m2', 'aménagement studio 25m2', 'aménagement studio 30m2', 'déco petit appartement', 'optimiser studio', 'idée déco studio'],
  },
  {
    slug: 'simulateur-peinture',
    title: 'Simulateur de Peinture et Couleurs par IA',
    metaTitle: 'Simulateur Peinture Mur par IA : testez les couleurs chez vous',
    metaDescription: 'Simulateur de peinture par IA. Testez des couleurs et des ambiances sur vos murs. Visualisez le rendu en 30 secondes avant de peindre.',
    hero: {
      headline: 'Testez les Couleurs Avant de Peindre',
      subheadline: 'Fini les échantillons de peinture ! Uploadez une photo de votre pièce et visualisez instantanément le rendu avec différentes ambiances colorées.',
      cta: 'Tester les couleurs',
      ctaLink: '/generate',
    },
    problem: {
      title: 'Choisir une couleur de peinture est stressant',
      points: [
        'Les échantillons en magasin ne reflètent pas le rendu réel sur vos murs',
        'Les couleurs changent selon la luminosité de la pièce',
        'Repeindre coûte 500€ à 2 000€, impossible de se tromper',
        'Les simulateurs de peinture classiques sont limités et peu réalistes',
      ],
    },
    solution: {
      title: 'L\'IA visualise les couleurs sur VOS murs',
      description: 'Notre IA analyse votre pièce et génère des rendus photoréalistes avec différentes ambiances colorées intégrées naturellement à votre espace.',
      benefits: [
        { icon: 'palette', title: 'Toutes les ambiances', description: 'Des teintes douces aux couleurs vives, testez tout' },
        { icon: 'sun', title: 'Rendu réaliste', description: 'L\'IA prend en compte la luminosité de votre pièce' },
        { icon: 'clock', title: 'Instantané', description: '30 secondes au lieu de jours avec des échantillons' },
        { icon: 'shield', title: 'Zéro risque', description: 'Validez votre choix avant d\'acheter la peinture' },
      ],
    },
    steps: [
      { step: 1, title: 'Photographiez votre pièce', description: 'Prenez une photo de la pièce à peindre en lumière naturelle' },
      { step: 2, title: 'Choisissez une ambiance', description: 'Sélectionnez un style de couleur ou une ambiance décorative' },
      { step: 3, title: 'Visualisez et comparez', description: 'Générez plusieurs versions et comparez côte à côte' },
    ],
    faq: [
      { question: 'Le simulateur montre-t-il les couleurs exactes des marques ?', answer: 'Notre IA génère des ambiances colorées globales plutôt que des teintes RAL exactes. C\'est l\'outil idéal pour valider une direction de couleur avant d\'aller en magasin choisir la teinte exacte.' },
      { question: 'Ça marche pour le papier peint aussi ?', answer: 'Oui ! En choisissant un style avec des textures murales, l\'IA peut simuler l\'effet du papier peint, du crépi ou d\'autres revêtements muraux.' },
      { question: 'Puis-je tester sur plusieurs pièces ?', answer: 'Absolument ! Chaque photo génère un crédit. Testez salon, chambre, cuisine, et trouvez l\'harmonie parfaite entre vos pièces.' },
    ],
    keywords: ['simulateur peinture', 'simulateur peinture mur', 'simulateur couleur mur', 'tester peinture mur', 'visualiser peinture', 'simulateur peinture chambre', 'simulateur peinture salon'],
  },
  {
    slug: 'decoration-salon',
    title: 'Idées Décoration Salon - Visualisez par IA',
    metaTitle: 'Décoration Salon : 12 Styles à Visualiser par IA',
    metaDescription: 'Découvrez les meilleures idées déco pour votre salon. Visualisez 12 styles différents directement sur votre photo. Résultat en 30 secondes.',
    hero: {
      headline: 'Trouvez la Déco Parfaite pour Votre Salon',
      subheadline: 'Le salon est la pièce la plus importante de votre maison. Visualisez 12 styles disponibles directement sur votre photo en 30 secondes.',
      cta: 'Redécorer mon salon',
      ctaLink: '/generate',
    },
    problem: {
      title: 'Décorer son salon sans se tromper',
      points: [
        'Le salon est la pièce la plus vue, impossible de se tromper',
        'Les magazines montrent des intérieurs qui ne ressemblent pas au vôtre',
        'Acheter un canapé à 2 000€ sans visualiser le rendu = risque',
        'Faire appel à un décorateur pour le salon coûte 1 500€+',
      ],
    },
    solution: {
      title: 'Votre salon, 12 ambiances différentes',
      description: 'Uploadez une photo de votre salon actuel et voyez-le transformé dans 12 styles décoratifs différents. Trouvez votre coup de coeur avant d\'acheter.',
      benefits: [
        { icon: 'sofa', title: 'Salon complet', description: 'Meubles, couleurs, éclairage : tout est repensé' },
        { icon: 'palette', title: '12 styles', description: 'Du moderne au bohème, trouvez votre identité' },
        { icon: 'share', title: 'Partageable', description: 'Envoyez les rendus à votre conjoint ou ami pour avis' },
        { icon: 'heart', title: 'Inspirant', description: 'Découvrez des styles auxquels vous n\'auriez pas pensé' },
      ],
    },
    steps: [
      { step: 1, title: 'Photo de votre salon', description: 'Capturez votre salon sous son meilleur angle' },
      { step: 2, title: 'Explorez les styles', description: 'Moderne, scandinave, bohème, japandi, art déco...' },
      { step: 3, title: 'Trouvez VOTRE style', description: 'Comparez les rendus et trouvez celui qui vous fait vibrer' },
    ],
    faq: [
      { question: 'Quel style de décoration pour un salon moderne ?', answer: 'Le style moderne mise sur les lignes épurées, les couleurs neutres et les matériaux nobles. Le scandinave apporte chaleur et luminosité. Le japandi combine le meilleur des deux mondes.' },
      { question: 'Comment décorer un petit salon ?', answer: 'Privilégiez le scandinave ou le minimaliste : couleurs claires pour agrandir visuellement, meubles fonctionnels, pas de surcharge. Testez avec InstaDeco pour valider !' },
      { question: 'L\'IA peut-elle décorer un salon ouvert sur cuisine ?', answer: 'Oui ! L\'IA traite la photo telle qu\'elle est et propose une décoration cohérente pour l\'ensemble de l\'espace visible.' },
    ],
    keywords: ['décoration salon', 'idée déco salon', 'aménagement salon', 'salon moderne', 'déco salon cosy', 'relooking salon', 'décoration salon 2024'],
  },
  {
    slug: 'decoration-chambre',
    title: 'Idées Décoration Chambre - Visualisez par IA',
    metaTitle: 'Décoration Chambre : Styles Cosy, Moderne & Bohème par IA',
    metaDescription: 'Idées de décoration chambre à coucher. Visualisez le rendu de 12 styles sur votre photo. Créez un cocon de bien-être en 30 secondes.',
    hero: {
      headline: 'Créez la Chambre de Vos Rêves',
      subheadline: 'Votre chambre est votre refuge. Visualisez-la dans un style cosy, scandinave, bohème ou tout autre ambiance en 30 secondes.',
      cta: 'Redécorer ma chambre',
      ctaLink: '/generate',
    },
    problem: {
      title: 'Trouver le bon style pour sa chambre',
      points: [
        'La chambre doit être à la fois belle ET reposante',
        'Les couleurs influencent directement la qualité du sommeil',
        'Un mauvais choix de linge de lit ou de meubles gâche l\'ambiance',
        'Difficile de projeter le résultat final à partir d\'un plan',
      ],
    },
    solution: {
      title: 'Visualisez votre chambre idéale avant de changer quoi que ce soit',
      description: 'Prenez en photo votre chambre actuelle et laissez l\'IA vous montrer des propositions de décoration adaptées à votre espace.',
      benefits: [
        { icon: 'moon', title: 'Ambiance zen', description: 'L\'IA propose des ambiances propices au repos' },
        { icon: 'palette', title: 'Palettes apaisantes', description: 'Tons naturels, pastels ou earth tones' },
        { icon: 'bed', title: 'Chambre complète', description: 'Lit, tables, éclairage, textiles : tout est pensé' },
        { icon: 'sparkles', title: 'Style unique', description: 'Trouvez VOTRE ambiance, pas celle du voisin' },
      ],
    },
    steps: [
      { step: 1, title: 'Photographiez votre chambre', description: 'Capturez votre chambre avec le plus de lumière naturelle possible' },
      { step: 2, title: 'Choisissez l\'ambiance', description: 'Bohème pour le cosy, scandinave pour la lumière, japandi pour le zen' },
      { step: 3, title: 'Dormez mieux', description: 'Créez l\'environnement idéal pour des nuits reposantes' },
    ],
    faq: [
      { question: 'Quelles couleurs pour une chambre apaisante ?', answer: 'Les tons doux sont recommandés : bleu pastel, vert sauge, beige, terracotta clair. Évitez le rouge vif et les couleurs trop stimulantes. Testez avec InstaDeco !' },
      { question: 'Le bohème convient-il pour une chambre ?', answer: 'Parfaitement ! Le style bohème est l\'un des plus populaires pour les chambres : textures douces, macramé, plantes, couleurs chaudes. C\'est le cocon idéal.' },
      { question: 'Ça marche pour une chambre d\'enfant ?', answer: 'Oui ! La chambre d\'enfant fonctionne comme n\'importe quelle autre pièce. L\'IA proposera une décoration adaptée à l\'espace visible sur la photo.' },
    ],
    keywords: ['décoration chambre', 'idée déco chambre', 'chambre cosy', 'décoration chambre adulte', 'chambre scandinave', 'chambre bohème', 'relooking chambre'],
  },
  {
    slug: 'avant-apres-decoration',
    title: 'Avant/Après Décoration par IA',
    metaTitle: 'Avant Après Décoration : transformez vos pièces par IA',
    metaDescription: 'Créez des avant/après impressionnants de décoration intérieure avec l\'IA. Montrez le potentiel de vos pièces en 30 secondes.',
    hero: {
      headline: 'Avant / Après en 10 Secondes',
      subheadline: 'Transformez n\'importe quelle pièce et créez des comparaisons avant/après bluffantes. Idéal pour les pros de l\'immobilier et les passionnés de déco.',
      cta: 'Créer mon avant/après',
      ctaLink: '/generate',
    },
    problem: {
      title: 'Montrer le potentiel d\'un bien est difficile',
      points: [
        'Les pièces vides ou mal décorées ne font pas rêver les acheteurs',
        'Les vendeurs ont du mal à projeter les acheteurs dans le bien',
        'Les photos d\'annonces de pièces vides attirent moins l\'attention des acquéreurs',
        'Produire des avant/après de qualité nécessite un stager professionnel',
      ],
    },
    solution: {
      title: 'Des avant/après professionnels en 30 secondes',
      description: 'Uploadez la photo "avant" et l\'IA crée instantanément une version "après" meublée et décorée. Parfait pour les annonces immobilières.',
      benefits: [
        { icon: 'split', title: 'Comparaison directe', description: 'Avant/après côte à côte pour un impact maximal' },
        { icon: 'trending-up', title: 'Plus de visites', description: 'Les annonces meublées attirent davantage l\'attention des acquéreurs' },
        { icon: 'clock', title: 'Instantané', description: 'Pas d\'attente, rendu immédiat' },
        { icon: 'repeat', title: 'Multi-styles', description: 'Plusieurs propositions pour chaque pièce' },
      ],
    },
    steps: [
      { step: 1, title: 'Photo "Avant"', description: 'Prenez une photo de la pièce dans son état actuel' },
      { step: 2, title: 'Génération "Après"', description: 'L\'IA crée une version meublée et décorée' },
      { step: 3, title: 'Avant/Après', description: 'Téléchargez les deux versions pour comparer' },
    ],
    faq: [
      { question: 'Les avant/après sont-ils utilisables commercialement ?', answer: 'Oui ! Les images générées peuvent être utilisées dans vos annonces immobilières, présentations clients et supports marketing.' },
      { question: 'Peut-on faire un avant/après d\'une pièce déjà meublée ?', answer: 'Oui ! L\'IA peut aussi redécorer une pièce existante en changeant complètement le style. Parfait pour montrer le potentiel d\'un relooking.' },
      { question: 'Quelle qualité d\'image pour mon avant/après ?', answer: 'Les rendus sont en haute qualité, suffisante pour les portails immobiliers. L\'option HD est disponible pour des usages print ou grand format.' },
    ],
    keywords: ['avant après décoration', 'transformation pièce', 'relooking intérieur', 'avant après home staging', 'transformation décoration', 'avant après déco'],
  },
  {
    slug: 'home-staging-virtuel-agents-immobiliers',
    title: 'Home staging virtuel pour agents immobiliers',
    metaTitle: 'Home staging virtuel pour agents immobiliers',
    metaDescription: "Le home staging virtuel par IA pensé pour les agences immobilières. Transformez la photo d'un bien vide ou daté en intérieur désirable, prêt à publier, en quelques secondes. Soignez chaque annonce de votre portefeuille.",
    hero: {
      headline: 'Home staging virtuel pour agents immobiliers',
      subheadline:
        "Transformez la photo d'un bien vide ou démodé en intérieur désirable, prêt à publier dans votre annonce. Vous envoyez la photo, vous choisissez la mise en scène, le rendu revient en quelques secondes. La force d'un home staging, sans les semaines ni le budget.",
      cta: 'Voir les offres Pro',
      ctaLink: '/pro',
    },
    problem: {
      title: "Le home staging classique ne suit pas le rythme d'une agence",
      points: [
        'Un home staging physique coûte entre 2 000 et 15 000 euros par bien, impossible à engager sur chaque mandat.',
        'Comptez deux à quatre semaines entre la décision et la pièce prête à photographier.',
        'Mobilier à louer, stager à coordonner, transport à organiser pour chaque logement.',
        'Un bien vide ou daté se visite moins et tire la négociation vers le bas.',
      ],
    },
    solution: {
      title: 'Mettez chaque bien en valeur avant la première visite',
      description:
        "InstaDeco habille vos pièces par intelligence artificielle. Vous partez d'une simple photo, même brute, et vous récupérez un rendu meublé et décoré, photoréaliste, dans le style qui parle à vos acheteurs. De quoi soigner chaque annonce de votre portefeuille, pas seulement les biens de prestige.",
      benefits: [
        { icon: 'clock', title: 'En quelques secondes', description: "Le rendu revient le temps d'un café, pas en plusieurs semaines." },
        { icon: 'euro', title: 'Sans le budget staging', description: "Une fraction du coût d'un home staging physique, sur autant de biens que vous voulez." },
        { icon: 'layers', title: 'Plusieurs ambiances', description: 'Testez moderne, classique ou chaleureux pour viser le bon acheteur.' },
        { icon: 'camera', title: "Prêt pour l'annonce", description: 'Des rendus haute définition, directement publiables sur vos portails.' },
      ],
    },
    comparison: {
      title: 'Home staging virtuel ou physique : ce qui change pour une agence',
      alternatives: [
        { name: 'Home staging physique', price: '2 000 à 15 000 € par bien', time: '2 à 4 semaines', quality: 'Excellent' },
        { name: 'Shooting 3D sur mesure', price: '300 à 800 € par image', time: 'Plusieurs jours', quality: 'Très bon' },
        { name: 'InstaDeco (IA)', price: 'Abonnement dès 19 €/mois', time: 'Quelques secondes', quality: 'Professionnel', isUs: true },
      ],
    },
    steps: [
      { step: 1, title: 'Photographiez le bien', description: 'Une photo par pièce suffit, même vide ou mal éclairée.' },
      { step: 2, title: 'Choisissez la mise en scène', description: 'Sélectionnez le style et le mobilier adaptés à votre cible.' },
      { step: 3, title: "Publiez l'annonce", description: 'Récupérez le rendu en haute définition et intégrez-le à votre annonce.' },
    ],
    faq: [
      {
        question: 'Puis-je utiliser ces images dans mes annonces immobilières ?',
        answer:
          "Oui. Les rendus sont en haute définition et conviennent aux portails comme SeLoger, Immoweb ou Idealista. Indiquez simplement dans l'annonce que la pièce a fait l'objet d'un home staging virtuel, comme pour toute photo travaillée.",
      },
      {
        question: 'Faut-il savoir manier un logiciel 3D ?',
        answer:
          "Non. Vous envoyez une photo, vous choisissez un style, vous récupérez le rendu. Aucune compétence technique requise, vos négociateurs s'en servent en autonomie.",
      },
      {
        question: 'Est-ce que ça marche sur un bien déjà meublé ?',
        answer:
          "Oui. L'IA peut aussi rafraîchir une pièce occupée ou démodée pour révéler son potentiel, sans rien déplacer chez le vendeur.",
      },
      {
        question: 'Combien de biens puis-je traiter ?',
        answer:
          "L'offre Pro est pensée pour un usage quotidien en agence, avec un forfait illimité en fair-use. De quoi soigner tout votre portefeuille, pas seulement les mandats de prestige.",
      },
      {
        question: 'Est-ce honnête vis-à-vis des acheteurs ?',
        answer:
          "Oui, à condition de l'indiquer. Le home staging virtuel montre le potentiel d'aménagement d'un volume, comme un plan meublé. La transparence dans l'annonce protège votre relation de confiance.",
      },
    ],
    keywords: [
      'home staging virtuel agents immobiliers',
      'home staging virtuel professionnel',
      'home staging IA immobilier',
      'mise en scène annonce immobilière',
      'home staging virtuel agence',
      'home staging virtuel pour vendre',
      'logiciel home staging agent immobilier',
    ],
    relatedArticles: [
      { slug: 'home-staging-virtuel-ou-physique-comparatif', title: 'Home staging virtuel ou physique : lequel choisir pour vendre un bien ?' },
      { slug: 'home-staging-vend-il-plus-vite', title: 'Le home staging fait-il vraiment vendre plus vite ?' },
      { slug: 'photos-annonce-immobiliere-qui-font-visiter', title: "Les photos d'annonce qui déclenchent les visites" },
      { slug: 'vendre-bien-vide-ou-meuble-virtuellement', title: 'Vendre un bien vide ou le meubler virtuellement : que choisir ?' },
      { slug: 'home-staging-virtuel-mentions-legales', title: 'Home staging virtuel : ce que dit la loi sur les photos retouchées' },
    ],
  },
];

export function getIntentPageBySlug(slug: string): IntentPageData | undefined {
  return INTENT_PAGES.find((page) => page.slug === slug);
}
