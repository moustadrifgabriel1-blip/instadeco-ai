import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBlogTitle(title: string): string {
  if (!title) return title;
  
  // Convertir en minuscule sauf la première lettre
  let formatted = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  
  // Liste des termes à garder en majuscule (Noms propres, Acronymes, Lieux)
  const keepCapitalized = [
    'France', 'Suisse', 'Belgique', 'Europe', 'Canada',
    'Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Genève', 'Lausanne', 'Bruxelles',
    'InstaDeco', 'IA', 'AI', 'Google', 'IKEA', 'Leroy Merlin',
    'Netflix', 'Airbnb', 'Pinterest', 'Instagram', 'TikTok',
    'Stripe', 'PayPal', 'Visa', 'Mastercard',
    'SaaS', 'B2B', 'B2C', 'SEO', 'Génie Civil',
    'Noël', 'Pâques', 'Saint-Valentin', 'Black Friday'
  ];
  
  keepCapitalized.forEach(word => {
    // Remplacer les occurrences (case insensitive) par la version capitalisée
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    formatted = formatted.replace(regex, word);
  });
  
  return formatted;
}
