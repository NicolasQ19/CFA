begin;

-- 1. Política para que los usuarios autenticados puedan leer el nombre de los candidatos
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'usuarios' and policyname = 'usuarios_candidatos_son_legibles'
  ) then
    create policy "usuarios_candidatos_son_legibles"
      on public.usuarios for select
      to authenticated
      using (rol = 'candidato');
  end if;
end
$$;

-- 2. Función para listar cartera con nombre completo garantizado
create or replace function public.listar_cartera_representante()
returns table (
  candidato_id uuid,
  creado_en timestamptz,
  nombre_completo text,
  puesto puesto_profesional,
  provincia text,
  club_actual text,
  foto_url text,
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

-- 3. Función para actualizar los datos de un candidato representado
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
  p_enlaces_video text[] default '{}'
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

  -- Verificar que el candidato pertenece a la cartera de este representante
  if not exists (
    select 1 from public.candidatos_representados
    where representante_id = v_rep_id and candidato_id = p_candidato_id
  ) then
    raise exception 'Este candidato no pertenece a tu cartera';
  end if;

  -- Actualizar nombre en usuarios
  update public.usuarios
  set nombre_completo = trim(p_nombre_completo)
  where id = p_candidato_id;

  -- Actualizar datos en perfiles_candidato
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
      actualizado_en = now()
  where usuario_id = p_candidato_id;

  return true;
end;
$$;

grant execute on function public.actualizar_candidato_representado to authenticated;

commit;
