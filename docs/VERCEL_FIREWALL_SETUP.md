# Configuration Vercel Firewall

## ⚠️ Prérequis

Le Vercel Firewall est disponible uniquement sur les plans **Pro** et **Enterprise**.

## 🔧 Configuration via Dashboard

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet **InstaDeco**
3. Aller dans **Settings** → **Security** → **Firewall**

## 📋 Règles à Configurer

### 1. Bloquer les User-Agents Suspects

```
Name: Block malicious bots
Action: Deny
Condition: User Agent matches regex
Value: (curl|wget|python-requests|scrapy|nikto|sqlmap|nmap|masscan|zgrab)
```

### 2. Bloquer les Tentatives d'Injection SQL

```
Name: Block SQL injection
Action: Deny
Condition: Path matches regex
Value: (?i)(union.*select|select.*from|insert.*into|delete.*from|drop.*table|exec\(|script>|<script)
```

### 3. Bloquer la Traversée de Répertoire

```
Name: Block path traversal
Action: Deny
Condition: Path matches regex
Value: (\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|\.\.%2f|%2e%2e%5c)
```

### 4. Rate Limit API Générale

```
Name: Rate limit API
Action: Rate Limit (100 requests / 1 minute)
Condition: Path starts with
Value: /api/
```

### 5. Rate Limit Authentification (Protection Brute Force)

```
Name: Rate limit auth
Action: Rate Limit (10 requests / 1 minute)
Condition: Path starts with
Value: /api/auth/
```

### 6. Rate Limit Endpoint Génération

```
Name: Rate limit generate
Action: Rate Limit (20 requests / 1 minute)
Condition: Path equals
Value: /api/v2/generate
```

### 7. Challenge Géographique (Optionnel)

```
Name: Geo challenge high-risk
Action: Challenge
Condition: Country in
Value: RU, CN, KP
```

## 🛡️ Protections Déjà en Place (Code)

Ces protections sont implémentées dans le code :

| Protection | Fichier | Description |
|------------|---------|-------------|
| Rate Limiting | `/lib/security/rate-limiter.ts` | 10 req/min par IP |
| Security Headers | `/lib/security/headers.ts` | CSP, HSTS, X-Frame |
| XSS Sanitization | `/lib/security/sanitize.ts` | Nettoyage des entrées |
| Audit Logs | `/lib/security/audit-logger.ts` | Journal des événements |
| RLS Policies | Supabase | Isolation des données |

## 📊 Monitoring

Après activation du Firewall :
- Consulter les **Firewall Logs** dans Vercel Dashboard
- Surveiller les patterns d'attaque
- Ajuster les règles selon les faux positifs

## 🔗 Ressources

- [Documentation Vercel Firewall](https://vercel.com/docs/security/firewall)
- [Web Application Firewall Best Practices](https://owasp.org/www-community/Web_Application_Firewall)
