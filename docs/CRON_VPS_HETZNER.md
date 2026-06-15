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
