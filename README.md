# Boussole

Un seul système personnel pour tes **tâches** (todo liste), ton **agenda** (calendrier) et tes **projets** (Kanban + Gantt + dépendances), le tout aligné sur tes **objectifs** (OKR). PWA installable, avec notifications push.

Stack : **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** · **Tailwind CSS v4** · **Supabase** (Postgres + Auth) · **Web Push**.

---

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → *New project*.
2. Une fois le projet créé, ouvre l'éditeur SQL (*SQL Editor*) et colle le contenu de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql), puis exécute-le. Cela crée toutes les tables, les index, les triggers et les règles de sécurité (Row Level Security — chaque ligne n'est visible que par toi).
3. Dans **Authentication → Providers**, l'authentification par e-mail/mot de passe est active par défaut.
   - Pour un usage strictement personnel, tu peux désactiver *"Confirm email"* dans **Authentication → Settings** pour te connecter sans attendre l'e-mail de confirmation.
4. Dans **Project Settings → API Keys**, récupère :
   - l'**URL du projet**
   - la **clé publique** (*Publishable key*, ou *anon* sur un projet plus ancien)
   - la **clé secrète** (*Secret key*, ou *service_role* sur un projet plus ancien) — à garder strictement privée.

## 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` et `SUPABASE_SECRET_KEY` avec les valeurs récupérées à l'étape précédente.

## 3. Générer les clés des notifications push (VAPID)

```bash
npm install
npm run generate-vapid
```

Copie les deux clés affichées dans `.env.local` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY`), et renseigne `VAPID_SUBJECT` avec `mailto:ton-adresse@example.com`.

Choisis aussi une valeur aléatoire longue pour `CRON_SECRET` (par ex. `openssl rand -hex 32`).

## 4. Lancer en local

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000), crée un compte, et c'est parti.

> Les notifications push nécessitent HTTPS (ou `localhost`, qui est autorisé par les navigateurs) et un service worker enregistré — les deux sont déjà en place.

## 5. Déployer sur Vercel

1. Pousse le projet sur un dépôt Git puis importe-le sur [vercel.com](https://vercel.com).
2. Renseigne toutes les variables de `.env.local` dans **Project Settings → Environment Variables** (y compris `NEXT_PUBLIC_SITE_URL` avec ton domaine final, et `CRON_SECRET`).
3. Déploie.

### Rappels automatiques (tâche planifiée)

Le cron n'est **pas** géré par Vercel ici (sur le plan Hobby, les tâches cron Vercel ne s'exécutent qu'**une fois par jour**, ce qui est insuffisant pour des rappels à quelques minutes près). La route `GET /api/cron/notifications` est protégée par un secret partagé (`Authorization: Bearer <CRON_SECRET>`) et peut être déclenchée par n'importe quel appelant externe — deux options sont prêtes à l'emploi :

**Option A — GitHub Actions (fournie)**

Le fichier [`.github/workflows/cron-notifications.yml`](./.github/workflows/cron-notifications.yml) appelle la route toutes les 5 minutes. Il suffit de définir deux secrets sur le dépôt GitHub (**Settings → Secrets and variables → Actions → New repository secret**) :

| Secret | Valeur |
|---|---|
| `APP_URL` | l'URL publique de l'app, ex. `https://boussole.vercel.app` (sans `/` final) |
| `CRON_SECRET` | exactement la même valeur que sur Vercel |

Le workflow peut aussi être déclenché manuellement depuis l'onglet **Actions** du dépôt (bouton *Run workflow*), pratique pour tester.

⚠️ GitHub désactive automatiquement les workflows planifiés après **60 jours sans commit** sur le dépôt (public ou privé). Si le projet est actif, ce n'est jamais un problème ; sinon, un simple commit (ou repasser par Actions → *Enable workflow*) suffit à le relancer.

**Option B — cron-job.org (aucune maintenance de dépôt)**

Sur [cron-job.org](https://cron-job.org), crée un compte gratuit puis une tâche :
- URL : `https://ton-domaine/api/cron/notifications`
- Méthode : `GET`
- En-tête personnalisé : `Authorization: Bearer <CRON_SECRET>`
- Intervalle : toutes les 5 minutes

Cette option n'a pas la contrainte des 60 jours d'inactivité de GitHub Actions.

Dans les deux cas, aucune configuration côté Vercel n'est nécessaire au-delà de la variable d'environnement `CRON_SECRET` déjà définie à l'étape précédente.

## 6. Installer l'app (PWA)

Une fois déployée en HTTPS, ouvre le site sur ton téléphone ou ton ordinateur : le navigateur proposera *"Ajouter à l'écran d'accueil"* / *"Installer l'application"*. L'icône et le nom "Boussole" apparaissent, l'app s'ouvre en plein écran comme une app native.

Pour activer les notifications : **Paramètres → Notifications push → Activer sur cet appareil**, dans l'app.

---

## Structure du projet

```
.github/workflows/cron-notifications.yml  déclenche les rappels toutes les 5 min (voir §5)
app/
  (auth)/           connexion / inscription
  (app)/             zone connectée : tableau de bord, tâches, calendrier, projets, objectifs, paramètres
  api/
    cron/notifications/   tâche planifiée d'envoi des rappels
  auth/callback/     retour du lien de confirmation e-mail
proxy.ts             (remplace middleware.ts depuis Next.js 16) — rafraîchit la session, laisse passer /api/* (auth gérée par chaque route)
lib/
  supabase/          clients Supabase (navigateur / serveur / admin)
  actions/           Server Actions (toutes les écritures en base, y compris l'abonnement/test push)
  push/send.ts       envoi des notifications Web Push (web-push)
  utils/             récurrence, dates (dont le calcul des bornes du jour dans le fuseau du profil)
  types/domain.ts    types TypeScript du modèle de données
components/          composants d'interface, par module
public/
  manifest.json, sw.js, icons/    PWA
supabase/migrations/0001_init.sql  schéma complet + RLS
```

## Modèle de données (résumé)

- **projects** — conteneur pour organiser tâches et objectifs.
- **tasks** — todo liste : sous-tâches, priorités, tags, récurrence, position (Kanban), dates (Gantt).
- **task_dependencies** — liens "dépend de" entre tâches, utilisés dans le Gantt.
- **objectives** + **key_results** — OKR : un objectif, plusieurs résultats clés mesurables.
- **events** — agenda, avec récurrence et rappel.
- **push_subscriptions** — abonnements Web Push par appareil.

Tout est protégé par Row Level Security : même avec la clé publique, un utilisateur ne peut lire/écrire que ses propres données.

## Notes

- Usage **solo** : pas de partage ni de rôles multi-utilisateurs (peut être ajouté plus tard en réintroduisant une notion d'espace de travail partagé).
- La récurrence (tâches et événements) utilise un format simplifié inspiré de la norme RRULE (`FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR`), sans dépendance externe.
- Le mode sombre suit automatiquement les préférences système (aucun bouton à activer).
