# Crons sur le VPS Hetzner (au lieu de Vercel Cron)

> **But** : faire tourner les crons depuis le VPS Hetzner (déjà payé ~12 CHF/mois, sous-utilisé) au lieu de Vercel Cron. Ça **retire la pression « Vercel Pro forcé par les crons »** et **évite la migration Cloudflare**. Le VPS peut piloter les crons de **tes 3 projets** (1 Firebase + 2 Vercel) → coût marginal ~0.

## Pourquoi
- Les routes `/api/cron/*` sont déjà de simples endpoints HTTP protégés par `Authorization: Bearer ${CRON_SECRET}`.
- N'importe quel `crontab` peut les appeler à l'heure voulue. Vercel Cron n'est donc pas indispensable — il ne sert qu'à appeler ces mêmes URLs.
- Conséquence : on peut **vider la liste `crons` de `vercel.json`** une fois le VPS en place (Vercel ne planifie plus rien → un facteur Pro en moins).
- ⚠️ Le VPS règle le **coût des crons**, pas le ToS « Vercel Hobby = non commercial ». Tant que le SaaS est pré-revenu, zone grise courante ; sinon garder 1 projet sur Pro ou héberger l'app sur le VPS.

## Installation (une fois)
```bash
# 1. Déposer les scripts sur le VPS
sudo mkdir -p /opt/instadeco
sudo cp scripts/cron/run-cron.sh /opt/instadeco/run-cron.sh
sudo chmod +x /opt/instadeco/run-cron.sh

# 2. Créer le fichier d'env (NON commité, lisible root only)
sudo tee /etc/instadeco-cron.env >/dev/null <<'EOF'
BASE_URL=https://instadeco.app
CRON_SECRET=__colle_le_CRON_SECRET_ici__
EOF
sudo chmod 600 /etc/instadeco-cron.env

# 3. Installer le crontab (utilisateur dédié de préférence)
crontab scripts/cron/instadeco.crontab.example   # adapte les chemins si ≠ /opt/instadeco
# Vérifier : crontab -l

# 4. Test manuel
/opt/instadeco/run-cron.sh reconcile-generations   # attendu : HTTP 200
```

## Multi-projets (tes 3 projets)
Réutilise le même VPS. Pour chaque projet :
- un fichier d'env dédié : `/etc/<projet>-cron.env` (BASE_URL + CRON_SECRET du projet),
- des lignes crontab qui pointent vers `run-cron.sh` avec `INSTADECO_CRON_ENV=/etc/<projet>-cron.env` en préfixe, ex :
  ```cron
  0 6 * * *  INSTADECO_CRON_ENV=/etc/wefam-cron.env /opt/instadeco/run-cron.sh daily-job
  ```
- Pour le projet **Firebase** : mêmes principes (endpoint Cloud Function protégé par un secret), ou `gcloud scheduler`. Le VPS reste l'orchestrateur unique si tu préfères tout centraliser.

## Bascule (après validation du VPS)
1. Confirmer que les runs VPS passent (logs HTTP 200).
2. **Retirer le tableau `crons` de `vercel.json`** (garder `functions` pour les maxDuration). → Vercel ne planifie plus de crons.
3. Garder les routes `/api/cron/*` (elles servent toujours, appelées par le VPS).

> Tant que le VPS n'est pas validé, on LAISSE les crons dans `vercel.json` pour ne pas créer de trou. La bascule est réversible (re-ajouter les entrées).

## Sécurité
- `CRON_SECRET` jamais commité (fichier `/etc/*-cron.env`, chmod 600).
- Les routes refusent tout appel sans `Authorization: Bearer ${CRON_SECRET}` (jamais de confiance à un header de plateforme seul — cf. CLAUDE.md).

---

# Moteur SEO autonome sur le VPS (au lieu de GitHub Actions)

> Le moteur `.claude/seo-engine/` (scripts Python qui collectent GSC, rangs, drift,
> citations LLM) tournait via `.github/workflows/seo-engine.yml`. On le bascule sur le
> **même VPS** que les crons app. Raison : GitHub Actions retarde les crons planifiés et
> **coupe les workflows après 60 jours sans commit** (un moteur « autonome » qui s'éteint
> tout seul). Le VPS est déjà payé → coût marginal nul, horaires fiables, tout centralisé.

## Prérequis qui ne disparaissent PAS (peu importe où ça tourne)
1. **Compte de service Google** (lecture Search Console). C'est l'identifiant, pas le
   planificateur. Clic-par-clic ci-dessous.
2. **Renvoyer les rapports dans le repo** : les agents `seo-chief` lisent
   `.claude/seo-engine/reports/` et `.claude/seo-memory/`. Le runner fait `git commit && push`
   si `PUSH_REPORTS=1` → le VPS a donc besoin d'un accès git en écriture (deploy key SSH ou
   token avec scope `repo`).

## Compte de service Google (clic-par-clic)
**Console Cloud** (https://console.cloud.google.com)
1. Sélecteur de projet (en haut) → **Nouveau projet** `instadeco-seo` → **Créer** → sélectionne-le.
2. ☰ → **APIs et services** → **Bibliothèque** → cherche **Google Search Console API** → **Activer**.
   (optionnel : active aussi **PageSpeed Insights API** et **Google Analytics Data API**.)
3. ☰ → **APIs et services** → **Identifiants** → **+ Créer des identifiants** → **Compte de service**.
4. Nom `seo-engine` → **Créer et continuer** → rôle vide → **OK**.
5. Clique le compte `seo-engine@...` → onglet **Clés** → **Ajouter une clé** → **Créer** → **JSON**.
   Un `.json` se télécharge. Note l'e-mail `seo-engine@instadeco-seo.iam.gserviceaccount.com`.

**Search Console** (https://search.google.com/search-console)
6. Propriété **instadeco.app** → **Paramètres** → **Utilisateurs et autorisations** →
   **Ajouter un utilisateur** → colle l'e-mail du compte de service → autorisation **Complète** → **Ajouter**.

## Installation sur le VPS (une fois)
```bash
# 1. Cloner le repo (lecture seule suffit si PUSH_REPORTS=0)
sudo mkdir -p /opt/instadeco
sudo git clone https://github.com/moustadrifgabriel1-blip/instadeco-ai.git /opt/instadeco/instadeco-ai

# 2. venv Python + dépendances
python3 -m venv /opt/instadeco/seo-venv
/opt/instadeco/seo-venv/bin/pip install -r /opt/instadeco/instadeco-ai/.claude/seo-engine/requirements.txt

# 3. Déposer la clé du compte de service (le .json téléchargé) + le runner
sudo cp ~/seo-engine-xxxx.json /etc/instadeco-gsc.json   # le JSON Google
sudo chmod 600 /etc/instadeco-gsc.json
sudo cp /opt/instadeco/instadeco-ai/scripts/seo-engine/run-seo-engine.sh /opt/instadeco/run-seo-engine.sh
sudo chmod +x /opt/instadeco/run-seo-engine.sh

# 4. Fichier d'env (NON commité, root only)
sudo tee /etc/instadeco-seo.env >/dev/null <<'EOF'
REPO_DIR=/opt/instadeco/instadeco-ai
VENV_DIR=/opt/instadeco/seo-venv
GOOGLE_APPLICATION_CREDENTIALS=/etc/instadeco-gsc.json
GSC_SITE_URL=https://instadeco.app
GA4_PROPERTY_ID=
PAGESPEED_API_KEY=
OPENAI_API_KEY=
PERPLEXITY_API_KEY=
USD_CHF_RATE=0.88
PUSH_REPORTS=0
EOF
sudo chmod 600 /etc/instadeco-seo.env

# 5. Test manuel (doit finir par "OK")
/opt/instadeco/run-seo-engine.sh gsc_daily
```

## Activer les rapports poussés dans le repo (PUSH_REPORTS=1)
Une fois le run vert, pour que `seo-chief` lise les chiffres réels :
1. Donner au VPS un accès git en écriture : deploy key SSH (repo → Settings → Deploy keys,
   case « Allow write access ») ou un token, et `git remote set-url` en SSH dans `REPO_DIR`.
2. Passer `PUSH_REPORTS=1` dans `/etc/instadeco-seo.env`.

## Planifier (crontab)
```bash
crontab scripts/seo-engine/seo-engine.crontab.example   # adapte les chemins si ≠ /opt/instadeco
crontab -l   # vérifier
```

## Bascule finale (après validation des runs VPS)
1. Confirmer plusieurs runs verts + rapports poussés.
2. Dans `.github/workflows/seo-engine.yml` : laisser le `workflow_dispatch` (filet de secours
   manuel), garder le `schedule:` commenté → GitHub ne planifie rien, le VPS est seul maître.
