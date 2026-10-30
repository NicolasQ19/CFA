-- ============================================================================
-- CFA — Alta y baja del plan Pro desde la aplicación (cobro simulado)
-- 1. Corrige el mensaje del cupo de ofertas, que se le muestra también al
--    administrador cuando modera una oferta de un club sin cupo.
-- 2. Permite que cada usuario contrate o dé de baja su propio plan Pro sin
--    abrir la escritura directa de `suscripciones`: las funciones son
--    `security definer` y solo tocan la fila del usuario autenticado.
-- ============================================================================

begin;

-- 1. Mensaje del cupo redactado en tercera persona: lo lee el club y el administrador.
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
    raise exception 'El club alcanzó el número máximo de ofertas publicadas según su plan (%).', cupo;
  end if;

  return new;
end;
$$;

-- 2. Alta del plan Pro. El cobro está simulado: no hay pasarela de pago.
create or replace function public.activar_plan_pago(meses integer default 1)
returns public.suscripciones
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  rol_actual text;
  duracion integer := greatest(1, least(coalesce(meses, 1), 12));
  fila public.suscripciones;
begin
  select u.rol into rol_actual
    from public.usuarios u
   where u.id = auth.uid() and u.cuenta_activa = true;

  if rol_actual is null or rol_actual not in ('club', 'candidato', 'representante') then
    raise exception 'Tu cuenta no puede contratar un plan.';
  end if;

  insert into public.suscripciones as s (usuario_id, plan, inicia_en, vence_en, activada_por)
  values (auth.uid(), 'pago', now(), now() + make_interval(months => duracion), auth.uid())
  on conflict (usuario_id) do update
    set plan = 'pago',
        inicia_en = now(),
        -- Renovar sobre un plan vigente suma al tiempo que queda.
        vence_en = greatest(coalesce(s.vence_en, now()), now()) + make_interval(months => duracion),
        activada_por = auth.uid()
  returning * into fila;

  return fila;
end;
$$;

revoke all on function public.activar_plan_pago(integer) from public;
grant execute on function public.activar_plan_pago(integer) to authenticated;

-- Baja: el plan vuelve a gratuito de inmediato. No borra la fila, para conservar el historial.
create or replace function public.cancelar_plan_pago()
returns public.suscripciones
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  fila public.suscripciones;
begin
  update public.suscripciones
     set plan = 'gratuito', vence_en = null
   where usuario_id = auth.uid()
  returning * into fila;

  return fila;
end;
$$;

revoke all on function public.cancelar_plan_pago() from public;
grant execute on function public.cancelar_plan_pago() to authenticated;

commit;
