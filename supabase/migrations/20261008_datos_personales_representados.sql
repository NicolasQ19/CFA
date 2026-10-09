begin;

alter table public.perfiles_candidato
  add column if not exists nombres text check (char_length(nombres) <= 150),
  add column if not exists apellidos text check (char_length(apellidos) <= 150),
  add column if not exists fecha_nacimiento date;

create or replace function public.crear_candidato_representado_con_datos(
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
  p_cv_ruta text default null,
  p_nombres text default null,
  p_apellidos text default null,
  p_fecha_nacimiento date default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_candidato_id uuid := gen_random_uuid();
  v_rep_id uuid := auth.uid();
  v_rep_rol rol_usuario;
begin

  if not exists (select 1 from public.usuarios where id = auth.uid() and rol = 'representante' and cuenta_activa) then
    raise exception 'Solo un representante activo puede gestionar su cartera';
  end if;
  if p_fecha_nacimiento > current_date or p_fecha_nacimiento < (current_date - interval '120 years')::date then
    raise exception 'Fecha de nacimiento no válida';
  end if;
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

  update public.perfiles_candidato set nombres = nullif(trim(p_nombres), ''), apellidos = nullif(trim(p_apellidos), ''), fecha_nacimiento = p_fecha_nacimiento where usuario_id = v_candidato_id;

  return v_candidato_id;
end;
$$;
revoke all on function public.crear_candidato_representado_con_datos from public;
grant execute on function public.crear_candidato_representado_con_datos to authenticated;

create or replace function public.actualizar_candidato_representado_con_datos(
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
  p_actualizar_cv boolean default false,
  p_nombres text default null,
  p_apellidos text default null,
  p_fecha_nacimiento date default null
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rep_id uuid := auth.uid();
begin

  if not exists (select 1 from public.usuarios where id = auth.uid() and rol = 'representante' and cuenta_activa) then
    raise exception 'Solo un representante activo puede gestionar su cartera';
  end if;
  if p_fecha_nacimiento > current_date or p_fecha_nacimiento < (current_date - interval '120 years')::date then
    raise exception 'Fecha de nacimiento no válida';
  end if;
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

  update public.perfiles_candidato set nombres = nullif(trim(p_nombres), ''), apellidos = nullif(trim(p_apellidos), ''), fecha_nacimiento = p_fecha_nacimiento where usuario_id = p_candidato_id;

  return true;
end;
$$;
revoke all on function public.actualizar_candidato_representado_con_datos from public;
grant execute on function public.actualizar_candidato_representado_con_datos to authenticated;

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
  enlaces_video text[],
  nombres text,
  apellidos text,
  fecha_nacimiento date
)
language plpgsql
security definer
set search_path = public, pg_temp
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
    pc.enlaces_video,
    pc.nombres,
    pc.apellidos,
    pc.fecha_nacimiento
  from public.candidatos_representados cr
  join public.usuarios u on u.id = cr.candidato_id
  join public.perfiles_candidato pc on pc.usuario_id = cr.candidato_id
  where cr.representante_id = auth.uid()
  order by cr.creado_en desc;
end;
$$;
revoke all on function public.listar_cartera_representante from public;
grant execute on function public.listar_cartera_representante to authenticated;

commit;
