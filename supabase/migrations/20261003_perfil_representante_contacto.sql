begin;

-- 1. Agregar campos de contacto y perfil a perfiles_representante
alter table public.perfiles_representante
  add column if not exists telefono text check (char_length(telefono) <= 50),
  add column if not exists correo_contacto text check (char_length(correo_contacto) <= 150),
  add column if not exists nacionalidad text check (char_length(nacionalidad) <= 100),
  add column if not exists sitio_web text check (char_length(sitio_web) <= 500),
  add column if not exists foto_url text;

-- 2. Asegurar que el bucket fotos-perfil exista en storage.buckets y sea público
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-perfil', 'fotos-perfil', true, 2000000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2000000, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 3. Políticas de Storage para fotos-perfil (Insert, Update, Delete para autenticados, Select público)
drop policy if exists "fotos_perfil_insert" on storage.objects;
drop policy if exists "fotos_perfil_update" on storage.objects;
drop policy if exists "fotos_perfil_delete" on storage.objects;
drop policy if exists "fotos_perfil_select" on storage.objects;
drop policy if exists "representante_sube_foto_propia" on storage.objects;
drop policy if exists "representante_borra_foto_propia" on storage.objects;

create policy "fotos_perfil_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'fotos-perfil');

create policy "fotos_perfil_update" on storage.objects for update to authenticated
using (bucket_id = 'fotos-perfil')
with check (bucket_id = 'fotos-perfil');

create policy "fotos_perfil_delete" on storage.objects for delete to authenticated
using (bucket_id = 'fotos-perfil');

create policy "fotos_perfil_select" on storage.objects for select to public
using (bucket_id = 'fotos-perfil');

-- 4. Políticas de Storage para curriculums
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curriculums', 'curriculums', false, 5000000, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 5000000, allowed_mime_types = array['application/pdf'];

drop policy if exists "representante_sube_cv_representado" on storage.objects;
drop policy if exists "representante_actualiza_cv_representado" on storage.objects;
drop policy if exists "representante_borra_cv_representado" on storage.objects;
drop policy if exists "representante_lee_cv_representado" on storage.objects;

create policy "representante_sube_cv_representado" on storage.objects for insert to authenticated
with check (
  bucket_id = 'curriculums' and exists (
    select 1 from public.candidatos_representados cr
    where cr.representante_id = auth.uid() and cr.candidato_id::text = (storage.foldername(name))[1]
  )
);

create policy "representante_actualiza_cv_representado" on storage.objects for update to authenticated
using (
  bucket_id = 'curriculums' and exists (
    select 1 from public.candidatos_representados cr
    where cr.representante_id = auth.uid() and cr.candidato_id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'curriculums' and exists (
    select 1 from public.candidatos_representados cr
    where cr.representante_id = auth.uid() and cr.candidato_id::text = (storage.foldername(name))[1]
  )
);

create policy "representante_borra_cv_representado" on storage.objects for delete to authenticated
using (
  bucket_id = 'curriculums' and exists (
    select 1 from public.candidatos_representados cr
    where cr.representante_id = auth.uid() and cr.candidato_id::text = (storage.foldername(name))[1]
  )
);

create policy "representante_lee_cv_representado" on storage.objects for select to authenticated
using (
  bucket_id = 'curriculums' and exists (
    select 1 from public.candidatos_representados cr
    where cr.representante_id = auth.uid() and cr.candidato_id::text = (storage.foldername(name))[1]
  )
);

-- 5. Permitir que el representante actualice y consulte perfiles_candidato de su cartera
drop policy if exists "representante_actualiza_perfil_representado" on public.perfiles_candidato;
create policy "representante_actualiza_perfil_representado"
  on public.perfiles_candidato for update
  to authenticated
  using (
    exists (
      select 1 from public.candidatos_representados cr
      where cr.representante_id = auth.uid() and cr.candidato_id = perfiles_candidato.usuario_id
    )
  )
  with check (
    exists (
      select 1 from public.candidatos_representados cr
      where cr.representante_id = auth.uid() and cr.candidato_id = perfiles_candidato.usuario_id
    )
  );

drop policy if exists "representante_lee_sus_representados" on public.perfiles_candidato;
create policy "representante_lee_sus_representados"
  on public.perfiles_candidato for select
  to authenticated
  using (
    exists (
      select 1 from public.candidatos_representados cr
      where cr.representante_id = auth.uid() and cr.candidato_id = perfiles_candidato.usuario_id
    )
  );

-- 6. Función para crear candidato representado con foto y CV iniciales
drop function if exists public.crear_candidato_representado;

create or replace function public.crear_candidato_representado(
  p_nombre_completo text,
  p_puesto puesto_profesional,
  p_provincia text,
  p_club_actual text default null,
  p_posicion_juego text default null,
  p_pierna_habil text default null,
  p_altura_cm integer default null,
  p_peso_kg integer default null,
  p_trayectoria text default null,
  p_titulo_o_matricula text default null,
  p_licencia text default null,
  p_anios_experiencia integer default null,
  p_especialidad text default null,
  p_enlaces_video text[] default '{}',
  p_foto_url text default null,
  p_cv_ruta text default null
) returns uuid
language plpgsql
security definer
as $$
declare
  v_candidato_id uuid := gen_random_uuid();
  v_rep_id uuid := auth.uid();
  v_rep_rol rol_usuario;
begin
  if v_rep_id is null then
    raise exception 'No autenticado';
  end if;

  select rol into v_rep_rol from public.usuarios where id = v_rep_id;
  if v_rep_rol != 'representante' then
    raise exception 'Solo un representante puede registrar representados';
  end if;

  -- 1. Insertar en usuarios
  insert into public.usuarios (id, rol, nombre_completo, correo_electronico, cuenta_activa)
  values (v_candidato_id, 'candidato', trim(p_nombre_completo), 'representado_' || v_candidato_id || '@cfa.local', true);

  -- 2. Insertar en perfiles_candidato
  insert into public.perfiles_candidato (
    usuario_id,
    puesto,
    provincia,
    club_actual,
    posicion_juego,
    pierna_habil,
    altura_cm,
    peso_kg,
    trayectoria,
    titulo_o_matricula,
    licencia,
    anios_experiencia,
    especialidad,
    enlaces_video,
    foto_url,
    cv_ruta,
    perfil_visible
  ) values (
    v_candidato_id,
    p_puesto,
    p_provincia,
    p_club_actual,
    p_posicion_juego,
    p_pierna_habil,
    p_altura_cm,
    p_peso_kg,
    p_trayectoria,
    p_titulo_o_matricula,
    p_licencia,
    p_anios_experiencia,
    p_especialidad,
    coalesce(p_enlaces_video, '{}'),
    p_foto_url,
    p_cv_ruta,
    true
  );

  -- 3. Vincular a la cartera del representante
  insert into public.candidatos_representados (representante_id, candidato_id)
  values (v_rep_id, v_candidato_id);

  return v_candidato_id;
end;
$$;

grant execute on function public.crear_candidato_representado to authenticated;

-- 7. Función para actualizar candidato representado incluyendo foto y CV
drop function if exists public.actualizar_candidato_representado;

create or replace function public.actualizar_candidato_representado(
  p_candidato_id uuid,
  p_nombre_completo text,
  p_puesto puesto_profesional,
  p_provincia text,
  p_club_actual text default null,
  p_posicion_juego text default null,
  p_pierna_habil text default null,
  p_altura_cm integer default null,
  p_peso_kg integer default null,
  p_trayectoria text default null,
  p_titulo_o_matricula text default null,
  p_licencia text default null,
  p_anios_experiencia integer default null,
  p_especialidad text default null,
  p_enlaces_video text[] default '{}',
  p_foto_url text default null,
  p_actualizar_foto boolean default false,
  p_cv_ruta text default null,
  p_actualizar_cv boolean default false
) returns boolean
language plpgsql
security definer
as $$
declare
  v_rep_id uuid := auth.uid();
begin
  if v_rep_id is null then
    raise exception 'No autenticado';
  end if;

  if not exists (
    select 1 from public.candidatos_representados
    where representante_id = v_rep_id and candidato_id = p_candidato_id
  ) then
    raise exception 'Este candidato no pertenece a tu cartera';
  end if;

  update public.usuarios
  set nombre_completo = trim(p_nombre_completo)
  where id = p_candidato_id;

  update public.perfiles_candidato
  set puesto = p_puesto,
      provincia = p_provincia,
      club_actual = p_club_actual,
      posicion_juego = p_posicion_juego,
      pierna_habil = p_pierna_habil,
      altura_cm = p_altura_cm,
      peso_kg = p_peso_kg,
      trayectoria = p_trayectoria,
      titulo_o_matricula = p_titulo_o_matricula,
      licencia = p_licencia,
      anios_experiencia = p_anios_experiencia,
      especialidad = p_especialidad,
      enlaces_video = coalesce(p_enlaces_video, '{}'),
      foto_url = case when p_actualizar_foto then p_foto_url else foto_url end,
      cv_ruta = case when p_actualizar_cv then p_cv_ruta else cv_ruta end,
      actualizado_en = now()
  where usuario_id = p_candidato_id;

  return true;
end;
$$;

grant execute on function public.actualizar_candidato_representado to authenticated;

-- 8. Actualizar la función RPC listar_cartera_representante para devolver foto_url y cv_ruta
drop function if exists public.listar_cartera_representante();

create or replace function public.listar_cartera_representante()
returns table (
  candidato_id uuid,
  creado_en timestamptz,
  nombre_completo text,
  puesto puesto_profesional,
  provincia text,
  club_actual text,
  foto_url text,
  cv_ruta text,
  posicion_juego text,
  pierna_habil text,
  altura_cm integer,
  peso_kg integer,
  trayectoria text,
  titulo_o_matricula text,
  licencia text,
  anios_experiencia integer,
  especialidad text,
  enlaces_video text[]
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    cr.candidato_id,
    cr.creado_en,
    u.nombre_completo,
    pc.puesto,
    pc.provincia,
    pc.club_actual,
    pc.foto_url,
    pc.cv_ruta,
    pc.posicion_juego,
    pc.pierna_habil,
    pc.altura_cm,
    pc.peso_kg,
    pc.trayectoria,
    pc.titulo_o_matricula,
    pc.licencia,
    pc.anios_experiencia,
    pc.especialidad,
    pc.enlaces_video
  from public.candidatos_representados cr
  join public.usuarios u on u.id = cr.candidato_id
  join public.perfiles_candidato pc on pc.usuario_id = cr.candidato_id
  where cr.representante_id = auth.uid()
  order by cr.creado_en desc;
end;
$$;

grant execute on function public.listar_cartera_representante to authenticated;

commit;