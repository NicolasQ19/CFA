-- ============================================================================
-- CFA — Cupo mensual de postulaciones según el plan
-- Refuerza en PostgreSQL el límite que aplican las Server Actions:
--   * Candidato con plan gratuito: 3 postulaciones por mes calendario.
--   * Representante con plan gratuito: 6 postulaciones por mes para su cartera.
-- El plan pago no tiene tope. Se cuenta por envío: cancelar una postulación no
-- devuelve el cupo del mes, de modo que no se pueda reciclar el cupo.
-- Las postulaciones de un representante consumen su cupo, no el del candidato.
-- ============================================================================

begin;

create or replace function public.limite_postulaciones_del_plan(id_usuario uuid, rol_usuario text)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when public.plan_vigente(id_usuario) = 'pago' then null
    when rol_usuario = 'representante' then 6
    when rol_usuario = 'candidato' then 3
    else null
  end;
$$;

revoke all on function public.limite_postulaciones_del_plan(uuid, text) from public;
grant execute on function public.limite_postulaciones_del_plan(uuid, text) to authenticated, service_role;

create or replace function public.controlar_cupo_postulaciones()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  responsable uuid;
  rol_responsable text;
  cupo integer;
  enviadas integer;
begin
  -- Quien envía la postulación es quien consume cupo.
  if new.postulado_por_representante_id is not null then
    responsable := new.postulado_por_representante_id;
    rol_responsable := 'representante';
  else
    responsable := new.candidato_id;
    rol_responsable := 'candidato';
  end if;

  cupo := public.limite_postulaciones_del_plan(responsable, rol_responsable);
  if cupo is null then
    return new;
  end if;

  select count(*) into enviadas
    from public.postulaciones p
   where p.creada_en >= date_trunc('month', now() at time zone 'utc')
     and p.id <> new.id
     and case
           when rol_responsable = 'representante' then p.postulado_por_representante_id = responsable
           else p.candidato_id = responsable and p.postulado_por_representante_id is null
         end;

  if enviadas >= cupo then
    raise exception 'Alcanzaste el límite de % postulaciones por mes de tu plan.', cupo;
  end if;

  return new;
end;
$$;

drop trigger if exists controlar_cupo_postulaciones on public.postulaciones;

create trigger controlar_cupo_postulaciones
  before insert on public.postulaciones
  for each row execute function public.controlar_cupo_postulaciones();

commit;
