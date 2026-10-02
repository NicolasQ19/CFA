begin;

-- 1. Modificar la restricción de foreign key en usuarios para permitir representados sin cuenta en auth.users
alter table public.usuarios drop constraint if exists usuarios_id_fkey;

-- 2. Función para que el representante registre directamente a su talento
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
  p_foto_url text default null
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
    true
  );

  -- 3. Vincular a la cartera del representante
  insert into public.candidatos_representados (representante_id, candidato_id)
  values (v_rep_id, v_candidato_id);

  return v_candidato_id;
end;
$$;

grant execute on function public.crear_candidato_representado to authenticated;

-- 3. Función para eliminar un representado de la cartera y limpiar su perfil
create or replace function public.eliminar_candidato_representado(p_candidato_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_rep_id uuid := auth.uid();
begin
  if v_rep_id is null then
    raise exception 'No autenticado';
  end if;

  -- Verificar pertenencia en cartera
  if not exists (
    select 1 from public.candidatos_representados
    where representante_id = v_rep_id and candidato_id = p_candidato_id
  ) then
    raise exception 'Este candidato no pertenece a tu cartera';
  end if;

  delete from public.candidatos_representados where representante_id = v_rep_id and candidato_id = p_candidato_id;
  delete from public.perfiles_candidato where usuario_id = p_candidato_id;
  delete from public.usuarios where id = p_candidato_id;

  return true;
end;
$$;

grant execute on function public.eliminar_candidato_representado to authenticated;

commit;
