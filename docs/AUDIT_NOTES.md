# Notes d'Audit & Améliorations — InstaDeco AI

**Date :** 11 février 2026  
**Production :** https://instadeco.app  
**Statut :** Déployé ✅

---

## 1. Audit Sécurité

**21 vulnérabilités identifiées → 7 corrections immédiates appliquées**

### Points revus

| # | Vulnérabilité | Sévérité | Action |
|---|--------------|----------|--------|
| 1 | CRON_SECRET non vérifié sur certains endpoints cron | Critique | Vérification obligatoire `Bearer ${CRON_SECRET}` ajoutée sur tous les endpoints `/api/cron/*` |
| 1b | Endpoints cron accessibles depuis l'extérieur | Haute | Double protection : middleware Next.js (`middleware.ts`) bloque `/api/cron/*` sans CRON_SECRET valide + vérification dans chaque handler |
| 1c | `backlink-outreach` bypasse le CRON_SECRET si non défini | Haute | Condition `cronSecret &&` remplacée par `!cronSecret \|\|` (bloque si absent) |
| 2 | SSRF possible via URLs utilisateur | Haute | Validation des URLs : blocage des IP privées (127.0.0.1, 10.x, 192.168.x), protocoles restreints à http/https/mailto |
| 3 | Webhook Stripe sans vérification de signature | Critique | Signature webhook Stripe vérifiée via `stripe.webhooks.constructEvent()` obligatoire |
| 4 | Fonctions SQL `increment_credits` / `deduct_credits` accessibles publiquement | Critique | Accès révoqué pour PUBLIC, anon et authenticated. Seul le service_role peut les appeler |
| 5 | Page `/seed` exposée en production | Haute | Page supprimée du code source |
| 6 | Pas de rate limiting sur les endpoints sensibles | Moyenne | Rate limiting implémenté sur les endpoints de génération et d'authentification |
| 7 | Headers de sécurité manquants | Moyenne | CSP, X-Frame-Options, X-Content-Type-Options configurés via `vercel.json` et `next.config.js` |

### Points vérifiés (déjà conformes)

- Row Level Security (RLS) Supabase activé sur toutes les tables
- Clés API secrètes (FAL_API_KEY, STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY) jamais exposées côté client
- Validation Zod sur les entrées utilisateur
- JWT Supabase vérifié dans les API Routes protégées

---

## 2. Audit RGPD

**7 fonctionnalités de conformité implémentées**

| # | Exigence RGPD | Implémentation | Fichier |
|---|--------------|----------------|---------|
| 1 | Droit à l'effacement (Art. 17) | API de suppression de compte qui supprime profil, générations, images Storage et désactive l'auth | `app/api/v2/user/delete/route.ts` |
| 2 | Droit à la portabilité (Art. 20) | API d'export des données au format JSON (profil, générations, transactions) | `app/api/v2/user/export/route.ts` |
| 3 | Consentement marketing explicite | Checkbox opt-in à l'inscription avec date de consentement stockée en metadata | `app/(auth)/signup/page.tsx` |
| 4 | Désinscription emails | Lien de désinscription dans tous les emails marketing (nurturing, post-génération) | `app/api/cron/email-nurturing/route.ts` |
| 5 | Bandeau cookies | Composant CookieBanner avec consentement granulaire (nécessaires / analytics / marketing) | `components/features/cookie-banner.tsx` |
| 6 | Acceptation CGV sur OAuth | Redirection vers page d'acceptation CGV obligatoire après inscription Google | `app/auth/callback/route.ts` |
| 7 | Mise à jour framework | Migration Next.js 14.2.35 → 15.5.12 pour bénéficier des correctifs de sécurité | `package.json` |

### Changements Next.js 15 associés

- `params` devenu `Promise<>` dans les pages dynamiques (4 pages corrigées)
- `ssr: false` impossible dans les Server Components → créé `lead-capture-lazy.tsx`
- `serverComponentsExternalPackages` → `serverExternalPackages`
- Export de route invalide supprimé

---

## 3. Audit Code / Dead Code

**12 items de dette technique nettoyés**

| # | Problème | Action | Impact |
|---|----------|--------|--------|
| 1 | Fonction `addWatermarkToImage` inutilisée (~90 lignes) | Supprimée | -90 lignes de code mort |
| 2 | Import `@supabase/ssr` non utilisé | Supprimé | Bundle size réduit |
| 3 | Variables d'état jamais lues | Supprimées | Clarté du code |
| 4 | Fonctions helper non appelées | Supprimées | Maintenabilité |
| 5 | Import `useEffect` superflu | Supprimé | Propreté |
| 6 | Requêtes N+1 dans email nurturing | Optimisé : 1 requête batch au lieu de N requêtes individuelles | Performance DB |
| 7 | Table `leads` sans gestion d'erreur | Wrappée en try/catch | Résilience (la table peut ne pas exister) |
| 8-12 | Divers imports/exports inutilisés | Supprimés | Propreté générale |

**Résultat :** 44 fichiers modifiés, 888 insertions, 516 suppressions.

---

## 4. Audit UX/UI

**Score initial : 52/100 → 10 quick wins implémentés**

### Quick Win 1 — Page "Mot de passe oublié"
- **Problème :** Aucun moyen de récupérer son mot de passe → perte d'utilisateurs
- **Solution :** Création de la page `/reset-password` avec formulaire email + email de réinitialisation via Supabase
- **Fichiers :** `app/(auth)/reset-password/page.tsx`, `app/(auth)/login/page.tsx` (ajout du lien)

### Quick Win 2 — Devise CHF → €
- **Problème :** Prix affichés en CHF alors que le marché cible est principalement la France
- **Solution :** Remplacement de toutes les occurrences CHF → € sur le site, les emails, et le contenu Pinterest
- **Exception :** CGV (document légal garde la double devise EUR/CHF) et pages villes suisses (affichage conditionnel correct)
- **Fichiers :** Hero, Stats, Features, FinalCTA, galerie, essai, email-nurturing, pinterest-post (10+ fichiers)

### Quick Win 3 — Incohérence "2 crédits" → "3 crédits"
- **Problème :** La page essai mentionnait "2 crédits offerts" alors que le système en donne 3
- **Solution :** Correction de 5 occurrences dans la page essai
- **Fichier :** `app/(marketing)/essai/page.tsx`

### Quick Win 4 — Labels accessibles (htmlFor/id)
- **Problème :** Les `<label>` n'étaient pas associés aux `<input>` → inaccessible pour les lecteurs d'écran
- **Solution :** Ajout de `htmlFor` sur chaque label + `id` correspondant sur chaque input
- **Fichiers :** `login/page.tsx` (2 paires), `signup/page.tsx` (4 paires), `dashboard/page.tsx` (2 paires)

### Quick Win 5 — `role="alert"` sur les messages d'erreur
- **Problème :** Les messages d'erreur n'étaient pas annoncés automatiquement aux technologies d'assistance
- **Solution :** Ajout de `role="alert"` sur toutes les div d'erreur
- **Fichiers :** login, signup, essai, generate, dashboard

### Quick Win 6 — Barres de progression accessibles
- **Problème :** Les barres de progression (génération IA) étaient muettes pour les lecteurs d'écran
- **Solution :** Ajout de `role="progressbar"` + `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`
- **Fichiers :** `essai/page.tsx`, `generate/page.tsx`

### Quick Win 7 — Skip-to-content
- **Problème :** Navigation clavier impossible sans passer par tous les éléments du header
- **Solution :** Lien "Aller au contenu principal" invisible sauf au focus clavier + `id="main-content"` sur le `<main>`
- **Fichier :** `app/layout.tsx`

### Quick Win 8 — Modales accessibles
- **Problème :** Les modales (suppression de compte, lead capture) ne se fermaient pas avec Escape, pas de rôle ARIA
- **Solution :** Ajout de `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, fermeture Escape + clic overlay
- **Fichiers :** `dashboard/page.tsx` (modale suppression), `lead-capture.tsx` (popup)

### Quick Win 9 — Rebranding purple → orange
- **Problème :** Pages de succès (HD, crédits) utilisaient un gradient violet incohérent avec la charte graphique orange
- **Solution :** `from-purple-50 to-blue-50` → `from-orange-50 to-amber-50`, `text-purple-600` → `text-[#E07B54]`, bouton de téléchargement recoloré
- **Fichiers :** `app/hd-success/page.tsx`, `app/(dashboard)/credits/success/page.tsx`

### Quick Win 10 — Contraste texte
- **Problème :** La couleur `#86868b` avait un ratio de contraste de 3.5:1 (sous le minimum WCAG AA de 4.5:1)
- **Solution :** Remplacement par `#636366` (ratio 4.58:1) sur 84 occurrences dans 11 fichiers
- **Fichiers :** login, signup, dashboard, essai, generate, galerie, email-nurturing, credit-badge, protected-route, marketing-emails, CreditsDisplayV2

---

## 5. Configuration Email

- **Envoi :** Resend (transactionnel + marketing) via `contact@instadeco.app`
- **Réception :** Forwarding MX configuré vers Gmail (11 février 2026)
- **Lien contact :** `mailto:contact@instadeco.app` fonctionnel sur `/pricing` et `/pro`

---

## Déploiements

| Date | Commit | Contenu | Fichiers |
|------|--------|---------|----------|
| Session précédente | Sécurité + RGPD + Code cleanup | 44 fichiers, 888+, 516- |
| 11 février 2026 | `9753f4d` — feat(ux): 10 quick wins | 21 fichiers, 295+, 129- |
| 11 février 2026 | fix(security+ux): cron middleware + pricing | 3 fichiers |

**Production :** https://instadeco.app ✅

---

## 5. Audit Performance (Lighthouse)

**Date :** 11 février 2026 — Post-déploiement UX fixes

### Scores

| Catégorie | Desktop | Mobile |
|-----------|---------|--------|
| **Performance** | 89/100 | 72/100 |
| **Accessibilité** | 94/100 | 90/100 |
| **Bonnes pratiques** | 100/100 | 100/100 |
| **SEO** | 92/100 | 92/100 |

### Métriques Core Web Vitals (Mobile)

| Métrique | Valeur | Seuil Google | Statut |
|----------|--------|-------------|--------|
| FCP (First Contentful Paint) | 1.0s | < 1.8s | ✅ Bon |
| LCP (Largest Contentful Paint) | 6.7s | < 2.5s | ⚠️ À améliorer |
| TBT (Total Blocking Time) | 20ms | < 200ms | ✅ Excellent |
| CLS (Cumulative Layout Shift) | 0 | < 0.1 | ✅ Parfait |
| Speed Index | 5.7s | < 3.4s | ⚠️ À améliorer |
| TTI (Time to Interactive) | 6.9s | < 3.8s | ⚠️ À améliorer |

### Opportunités d'amélioration

- **JS inutilisé :** ~43 KiB à réduire (économie ~150ms) — envisager du lazy loading ou du code splitting
- **CSS inutilisé :** ~16 KiB — purger les classes Tailwind non utilisées
- **LCP élevé (6.7s)** — causes probables : images hero volumineuses, composants client-side qui bloquent le rendu
- **Réponse serveur :** ✅ Rapide (pas de problème TTFB)
- **Redirections :** ✅ Aucune

### Recommandations prioritaires

1. Optimiser les images hero (format WebP, compression, `priority` Next.js)
2. Code-split les composants lourds (BeforeAfter, cartes de style)
3. Précharger le LCP element via `<link rel="preload">`
4. Lazy-load les sections below-the-fold (Stats, Features, FinalCTA)

---

## 6. Corrections complémentaires (11 février 2026 - 2ème passe)

| # | Problème | Fichier | Action |
|---|----------|---------|--------|
| 1 | Page pricing affichait "1 crédit offert" au lieu de 3 | `pricing/page.tsx` | Corrigé → "3 crédits offerts à l'inscription" |
| 2 | `backlink-outreach` ignorait l'absence de CRON_SECRET | `backlink-outreach/route.ts` | `cronSecret &&` → `!cronSecret \|\|` |
| 3 | Endpoints cron sans protection middleware | `middleware.ts` | Ajout vérification CRON_SECRET pour tout `/api/cron/*` |

---

*Document généré le 11 février 2026*
