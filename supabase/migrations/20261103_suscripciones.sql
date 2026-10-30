-- ============================================================================
-- CFA — Planes de suscripción (gratuito / pago)
-- Un único valor de plan por usuario: los límites concretos se derivan de la
-- combinación (rol, plan), de modo que no puede existir un candidato con plan
-- de club. La activación es manual y queda a cargo de un administrador activo.
-- ============================================================================

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_suscripcion') then
    create type plan_suscripcion as enum ('gratuito', 'pago');
  end if;
end
$$;

create table if not exists public.suscripciones (
  usuario_id uuid primary key references public.usuarios (id) on delete cascade,
  plan plan_suscripcion not null default 'gratuito',
  inicia_en timestamptz not null default now(),
  vence_en timestamptz, -- null = sin vencimiento
  activada_por uuid references public.usuarios (id),
  observaciones text,
  actualizada_en timestamptz not null default now(),

  constraint vigencia_coherente check (vence_en is null or vence_en > inicia_en)
);

-- Plan efectivo de un usuario: 'gratuito' si no tiene fila o si el plan venció.
-- Centraliza la regla de vencimiento para que no se repita en cada consulta.
create or replace function public.plan_vigente(id_usuario uuid)
returns plan_suscripcion
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select s.plan
       from public.suscripciones s
      where s.usuario_id = id_usuario
        and s.plan = 'pago'
        and (s.vence_en is null or s.vence_en > now())),
    'gratuito'::plan_suscripcion
  );
$$;

revoke all on function public.plan_vigente(uuid) from public;
grant execute on function public.plan_vigente(uuid) to authenticated, service_role;

alter table public.suscripciones enable row level security;

-- Cada usuario consulta únicamente su propia suscripción; el administrador, todas.
drop policy if exists "usuarios_leen_su_suscripcion" on public.suscripciones;
create policy "usuarios_leen_su_suscripcion"
  on public.suscripciones for select to authenticated
  using (usuario_id = auth.uid() or public.es_administrador_activo());

-- La activación y la baja son siempre manuales: solo un administrador activo escribe.
drop policy if exists "administradores_gestionan_suscripciones" on public.suscripciones;
create policy "administradores_gestionan_suscripciones"
  on public.suscripciones for all to authenticated
  using (public.es_administrador_activo())
  with check (public.es_administrador_activo());

create or replace function public.registrar_cambio_suscripcion()
returns trigger
language plpgsql
as $$
begin
  new.actualizada_en := now();
  return new;
end;
$$;

drop trigger if exists registrar_cambio_suscripcion on public.suscripciones;
create trigger registrar_cambio_suscripcion
  before update on public.suscripciones
  for each row execute function public.registrar_cambio_suscripcion();

commit;
