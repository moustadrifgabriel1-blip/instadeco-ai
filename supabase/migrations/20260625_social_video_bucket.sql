-- Bucket public dédié aux vidéos avant/après publiées sur les réseaux (Reel IG + FB).
-- Public en lecture (Meta doit récupérer la mp4 par URL directe, sans auth ni redirect).
-- Écriture = service-role uniquement (le script VPS utilise la clé service, bypass RLS).
-- Idempotent. file_size_limit 50 Mo (les rendus font ~0,4 Mo, large marge).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-video', 'social-video', true, 52428800, array['video/mp4'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
