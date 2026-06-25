-- Élargit social_posts pour les formats vidéo (Reel Instagram + vidéo Facebook) et
-- ajoute le statut 'pending' (trace insérée avant publication, pour l'idempotence du
-- script vidéo VPS). DDL NON destructif : on remplace les contraintes CHECK, aucune
-- ligne touchée. Les contraintes inline d'origine portent les noms auto Postgres.

alter table public.social_posts drop constraint if exists social_posts_platform_check;
alter table public.social_posts add constraint social_posts_platform_check
  check (platform in ('instagram', 'facebook', 'pinterest', 'tiktok', 'instagram_reel', 'facebook_video'));

alter table public.social_posts drop constraint if exists social_posts_status_check;
alter table public.social_posts add constraint social_posts_status_check
  check (status in ('posted', 'failed', 'pending'));
