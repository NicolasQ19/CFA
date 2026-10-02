begin;
alter table public.perfiles_club
  add column if not exists localidad text check (char_length(localidad) <= 120),
  add column if not exists descripcion text check (char_length(descripcion) <= 2000),
  add column if not exists instalaciones text check (char_length(instalaciones) <= 2000),
  add column if not exists sitio_web text check (char_length(sitio_web) <= 500),
  add column if not exists instagram text check (char_length(instagram) <= 500),
  add column if not exists facebook text check (char_length(facebook) <= 500);

-- Tabla separada: las notas no forman parte de las postulaciones visibles al candidato.
create table public.seguimiento_club (
  postulacion_id uuid primary key references public.postulaciones(id) on delete cascade,
  club_id uuid not null references public.usuarios(id) on delete cascade,
  etapa text not null check (etapa in ('recibido','evaluacion','contactado','seleccionado','descartado')),
  notas text not null default '' check (char_length(notas) <= 3000),
  actualizado_en timestamptz not null default now()
);
create index seguimiento_club_club_idx on public.seguimiento_club(club_id);
alter table public.seguimiento_club enable row level security;
revoke all on public.seguimiento_club from anon;
grant select, insert, update, delete on public.seguimiento_club to authenticated;
create policy "solo_club_propietario" on public.seguimiento_club for all to authenticated
using (
  club_id = auth.uid() and exists (
    select 1 from public.postulaciones p join public.ofertas_laborales o on o.id = p.oferta_id
    join public.usuarios u on u.id = o.club_id
    where p.id = postulacion_id and o.club_id = auth.uid() and u.rol = 'club' and u.cuenta_activa
  )
)
with check (
  club_id = auth.uid() and exists (
    select 1 from public.postulaciones p join public.ofertas_laborales o on o.id = p.oferta_id
    join public.usuarios u on u.id = o.club_id
    where p.id = postulacion_id and o.club_id = auth.uid() and u.rol = 'club' and u.cuenta_activa
  )
);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('escudos-club','escudos-club',true,2000000,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=2000000, allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "club_sube_escudo" on storage.objects for insert to authenticated with check (
  bucket_id='escudos-club' and (storage.foldername(name))[1]=auth.uid()::text
  and exists (select 1 from public.usuarios where id=auth.uid() and rol='club' and cuenta_activa)
);
create policy "club_lee_escudo_propio" on storage.objects for select to authenticated using (bucket_id='escudos-club' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "club_borra_escudo" on storage.objects for delete to authenticated using (bucket_id='escudos-club' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
