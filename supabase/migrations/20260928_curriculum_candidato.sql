begin;

alter table public.perfiles_candidato add column if not exists cv_ruta text;
alter table public.perfiles_candidato add constraint cv_ruta_del_candidato
  check (cv_ruta is null or cv_ruta ~ ('^' || usuario_id::text || '/[a-f0-9-]+\.pdf$'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curriculums', 'curriculums', false, 5000000, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 5000000, allowed_mime_types = array['application/pdf'];

create policy "candidato_sube_cv" on storage.objects for insert to authenticated
with check (
  bucket_id = 'curriculums' and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.usuarios where id = auth.uid() and rol = 'candidato' and cuenta_activa)
);

create policy "candidato_borra_cv" on storage.objects for delete to authenticated
using (bucket_id = 'curriculums' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "lectura_cv_autorizada" on storage.objects for select to authenticated
using (
  bucket_id = 'curriculums' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.perfiles_candidato p
      join public.usuarios lector on lector.id = auth.uid()
      where p.cv_ruta = storage.objects.name and lector.cuenta_activa and (
        lector.rol = 'administrador'
        or (lector.rol = 'club' and (
          p.perfil_visible or exists (
            select 1 from public.postulaciones post
            join public.ofertas_laborales oferta on oferta.id = post.oferta_id
            where post.candidato_id = p.usuario_id and oferta.club_id = auth.uid()
          )
        ))
      )
    )
  )
);

commit;
