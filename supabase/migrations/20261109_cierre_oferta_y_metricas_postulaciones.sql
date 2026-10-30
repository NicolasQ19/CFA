-- ============================================================================
-- CFA — Propagación de oferta_cerrada y lectura administrativa de postulaciones
-- 1. Permite a administradores activos consultar conteos globales de postulaciones
--    en /admin/metricas (CU-23 / RF-27).
-- 2. Propaga automáticamente `oferta_cerrada` a las postulaciones abiertas
--    cuando una oferta pasa a estado `cerrada` (CU-11 / Diagrama 5.2).
-- ============================================================================

begin;

drop policy if exists "administradores_leen_postulaciones" on public.postulaciones;

create policy "administradores_leen_postulaciones"
  on public.postulaciones for select
  to authenticated
  using (public.rol_del_usuario_actual() = 'administrador');

create or replace function public.propagar_cierre_oferta_a_postulaciones()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'cerrada' and old.estado is distinct from 'cerrada' then
    update public.postulaciones
       set estado = 'oferta_cerrada',
           actualizada_en = coalesce(new.actualizada_en, now())
     where oferta_id = new.id
       and estado in ('postulado', 'visto', 'preseleccionado');
  end if;

  return new;
end;
$$;

drop trigger if exists propagar_cierre_oferta_a_postulaciones on public.ofertas_laborales;

create trigger propagar_cierre_oferta_a_postulaciones
  after update of estado on public.ofertas_laborales
  for each row execute function public.propagar_cierre_oferta_a_postulaciones();

revoke all on function public.propagar_cierre_oferta_a_postulaciones() from public;

commit;
