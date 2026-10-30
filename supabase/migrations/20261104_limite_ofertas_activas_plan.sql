-- ============================================================================
-- CFA — Cupo de ofertas activas según el plan del club
-- Refuerza en PostgreSQL el límite que aplica la Server Action: el plan gratuito
-- admite 3 ofertas activas simultáneas (pendiente_moderacion, publicada o pausada).
-- Las ofertas cerradas y rechazadas no ocupan cupo.
--
-- Si el club quedó por encima del cupo al vencer un plan pago, conserva sus ofertas:
-- el trigger solo impide crear nuevas o reactivar una pausada por encima del límite.
-- ============================================================================

begin;

create or replace function public.limite_ofertas_activas_del_plan(id_club uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case when public.plan_vigente(id_club) = 'pago' then null else 3 end;
$$;

revoke all on function public.limite_ofertas_activas_del_plan(uuid) from public;
grant execute on function public.limite_ofertas_activas_del_plan(uuid) to authenticated, service_role;

create or replace function public.controlar_cupo_ofertas_club()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  cupo integer;
  activas integer;
begin
  -- Solo interesa cuando la oferta pasa a ocupar cupo.
  if new.estado not in ('pendiente_moderacion', 'publicada', 'pausada') then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.estado in ('pendiente_moderacion', 'publicada', 'pausada')
  then
    return new;
  end if;

  cupo := public.limite_ofertas_activas_del_plan(new.club_id);
  if cupo is null then
    return new;
  end if;

  select count(*) into activas
    from public.ofertas_laborales o
   where o.club_id = new.club_id
     and o.id <> new.id
     and o.estado in ('pendiente_moderacion', 'publicada', 'pausada');

  if activas >= cupo then
    raise exception 'Tu plan permite % ofertas activas a la vez. Cerrá una búsqueda o pasate al plan Pro para publicar sin límite.', cupo;
  end if;

  return new;
end;
$$;

drop trigger if exists controlar_cupo_ofertas_club on public.ofertas_laborales;

create trigger controlar_cupo_ofertas_club
  before insert or update of estado on public.ofertas_laborales
  for each row execute function public.controlar_cupo_ofertas_club();

commit;
