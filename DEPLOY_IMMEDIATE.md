# ⚠️ RÈGLE DE DÉPLOIEMENT - PÉRIODE CRITIQUE

## 🚨 DÉPLOIEMENT IMMÉDIAT OBLIGATOIRE

**Période** : 21 janvier 2026 → 21 mai 2026 (4 mois)

**Règle** : TOUTES les modifications doivent être déployées **IMMÉDIATEMENT** en production après chaque commit.

---

## 📋 Workflow Obligatoire

```bash
# 1. Faire vos modifications
# ...

# 2. Commiter les changements
git add .
git commit -m "feat: votre description"

# 3. DÉPLOYER IMMÉDIATEMENT (NE PAS OUBLIER)
npx vercel --prod --yes
```

**Alternative avec script** :
```bash
./scripts/deploy.sh production
```

---

## ❌ Ce qu'il NE FAUT PAS faire

- ❌ Accumuler plusieurs commits sans déployer
- ❌ Attendre la fin de journée pour déployer
- ❌ Déployer seulement en fin de semaine
- ❌ Passer en mode "preview" uniquement

---

## ✅ Ce qu'il FAUT faire

- ✅ Déployer après CHAQUE commit
- ✅ Vérifier le déploiement sur https://instadeco.app
- ✅ Tester immédiatement la fonctionnalité en production
- ✅ Monitorer les logs Vercel après déploiement

---

## 🎯 Pourquoi cette règle ?

**Phase de lancement critique** :
- Tests en conditions réelles
- Ajustements rapides nécessaires
- Feedback utilisateur en temps réel
- Détection précoce des bugs
- Itération rapide sur les fonctionnalités

---

## 📅 Rappel des Dates

- **Début** : 21 janvier 2026 ✅ (aujourd'hui)
- **Fin** : 21 mai 2026
- **Durée** : 4 mois

**Après le 21 mai 2026**, vous pourrez revenir à un cycle de déploiement plus classique (staging → production).

---

## 🛠️ Commandes Utiles

### Déploiement Production
```bash
npx vercel --prod --yes
```

### Vérifier le Déploiement
```bash
# Ouvrir dans le navigateur
open https://instadeco.app

# Ou avec curl
curl -I https://instadeco.app
```

### Logs en Temps Réel
```bash
npx vercel logs https://instadeco.app --follow
```

---

## 📝 Template de Commit

Utilisez des messages de commit clairs pour faciliter le suivi :

```bash
git commit -m "feat: ajout fonctionnalité X"
git commit -m "fix: correction bug Y"
git commit -m "docs: mise à jour documentation"
git commit -m "style: amélioration UI composant Z"
git commit -m "perf: optimisation chargement images"
```

---

**Dernière mise à jour** : 21 janvier 2026

**⚠️ CETTE RÈGLE EST CRITIQUE POUR LE SUCCÈS DU LANCEMENT ⚠️**
