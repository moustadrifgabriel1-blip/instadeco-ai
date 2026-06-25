-- Ajoute la plateforme 'pinterest_video' a l'enum social_posts (le pin video est trace
-- separement du pin image 'pinterest', deja present). DDL non destructif : on remplace
-- la contrainte CHECK, aucune ligne touchee.

alter table public.social_posts drop constraint if exists social_posts_platform_check;
alter table public.social_posts add constraint social_posts_platform_check
  check (platform in ('instagram', 'facebook', 'pinterest', 'tiktok',
                      'instagram_reel', 'facebook_video', 'pinterest_video'));
