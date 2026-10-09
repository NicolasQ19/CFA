begin;

-- Lectura pública acotada; no amplía el acceso a usuarios, cartera o postulaciones.
create or replace function public.obtener_perfil_publico_representante(p_representante_id uuid)
returns table (
  usuario_id uuid,
  nombre_agencia text,
  foto_url text,
  presentacion text,
  especializacion text,
  zona_trabajo text,
  nacionalidad text,
  telefono text,
  correo_contacto text,
  sitio_web text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select pr.usuario_id,
         coalesce(nullif(trim(pr.nombre_agencia), ''), u.nombre_completo),
         pr.foto_url, pr.presentacion, pr.especializacion, pr.zona_trabajo,
         pr.nacionalidad, pr.telefono, pr.correo_contacto, pr.sitio_web
  from public.perfiles_representante pr
  join public.usuarios u on u.id = pr.usuario_id
  where pr.usuario_id = p_representante_id
    and u.rol = 'representante' and u.cuenta_activa = true;
$$;

revoke all on function public.obtener_perfil_publico_representante(uuid) from public;
grant execute on function public.obtener_perfil_publico_representante(uuid) to anon, authenticated;

commit;
