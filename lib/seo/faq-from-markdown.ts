/**
 * Extraction de FAQ depuis le contenu Markdown d'un article de blog.
 *
 * But : alimenter un schema JSON-LD `FAQPage` (citable par les moteurs et les IA)
 * à partir d'une section FAQ rédigée en Markdown, sans champ structuré dédié.
 *
 * Conservateur par conception : ne renvoie une FAQ que si le format attendu est
 * clairement reconnu (section titrée + questions en gras). En cas de doute, tableau
 * vide (donc aucun schema émis), pour ne jamais publier de FAQPage malformée.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

/** Nettoie le Markdown inline d'un fragment (liens, gras, italique, code, espaces). */
function cleanInline(input: string): string {
  return input
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [texte](url) -> texte
    .replace(/[*_`]/g, '') // gras / italique / code inline
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrait les couples question/réponse d'un contenu Markdown.
 * Cible une section titrée « Foire aux questions », « FAQ » ou « Questions fréquentes »,
 * où chaque question est une ligne en gras (`**...**`) suivie de sa réponse.
 * La réponse court jusqu'à la question suivante ou la fin de la section.
 */
export function extractFaqItems(markdown: string): FaqItem[] {
  if (!markdown) return [];

  // 1) Isole la section FAQ : du titre jusqu'au prochain titre de section (## / ###) ou la fin.
  // Pas de flag `m` : `^` = début de chaîne, `$` = fin de chaîne (on gère les débuts de ligne via `\n`).
  const section = markdown.match(
    /(?:^|\n)#{2,3}[ \t]*(?:foire aux questions|questions fréquentes|questions frequentes|faq)\b[^\n]*\n([\s\S]*?)(?=\n#{2,3}[ \t]|$)/i,
  );
  if (!section) return [];
  const body = section[1];

  // 2) Chaque question = ligne en gras ; la réponse va jusqu'à la question suivante.
  const items: FaqItem[] = [];
  const re = /(?:^|\n)[ \t]*\*\*(.+?)\*\*[ \t]*\n+([\s\S]*?)(?=\n[ \t]*\*\*.+?\*\*[ \t]*\n|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    const question = cleanInline(match[1]);
    const answer = cleanInline(match[2]);
    if (question && answer) items.push({ question, answer });
  }
  return items;
}
