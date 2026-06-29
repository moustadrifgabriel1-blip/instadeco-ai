// Donnees de la page /pro partagees entre le RENDU (page.tsx, client) et le SCHEMA
// JSON-LD (layout.tsx, serveur). Source unique pour garantir la parite entre le contenu
// visible et les donnees structurees (regle Google sur FAQPage et Offer).
// Les prix doivent rester identiques a PRO_PLANS de page.tsx (Solo 19, Pro 49, Agence 99).

export const PRO_FAQ = [
  {
    q: 'Que signifie « illimité » exactement ?',
    a: "Les plans Pro et Agence permettent de générer autant d'images que nécessaire pour votre activité, sans quota mensuel. Une politique d'usage équitable (fair-use) s'applique pour prévenir les abus (revente, automatisation non autorisée). Le plan Solo, lui, inclut 40 images/mois.",
  },
  {
    q: 'Les images générées sont-elles utilisables commercialement ?',
    a: 'Oui, la licence commerciale est incluse : utilisez les rendus dans vos annonces, votre site, vos présentations clients et sur les réseaux. Pensez à signaler le caractère virtuel du home staging sur vos annonces, conformément à la déontologie immobilière.',
  },
  {
    q: 'Comment ça marche concrètement ?',
    a: "1) Prenez une photo de la pièce (vide ou occupée). 2) Uploadez-la sur InstaDeco. 3) Choisissez un style. 4) En ~30 secondes, téléchargez le rendu meublé en HD. C'est tout.",
  },
  {
    q: 'Est-ce que ça remplace un vrai home staging ?',
    a: "C'est complémentaire. Le home staging virtuel est idéal pour les annonces en ligne (où la majorité des acheteurs commencent leur recherche). Pour les visites physiques, un staging réel reste pertinent.",
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: "Oui, sans engagement. Annulez en 1 clic depuis votre espace client ; vous conservez l'accès jusqu'à la fin de la période payée.",
  },
  {
    q: 'Et pour une grande agence (plus de 3 sièges) ?',
    a: 'Le plan Agence inclut 3 sièges. Au-delà, contactez-nous à contact@instadeco.app pour un tarif sur mesure avec facturation centralisée.',
  },
];

// Paliers mensuels reels, pour le schema Offer abonnement (parite avec PRO_PLANS).
export const PRO_PRICING = [
  { name: 'Solo', monthly: 19 },
  { name: 'Pro', monthly: 49 },
  { name: 'Agence', monthly: 99 },
];
