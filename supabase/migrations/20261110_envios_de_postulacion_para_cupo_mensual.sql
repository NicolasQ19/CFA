-- ============================================================================
-- CFA — El cupo mensual de postulaciones se cuenta por envío
-- Cancelar una postulación borra su fila, así que contar `postulaciones`
-- devolvía el cupo. Cada envío queda registrado aparte y sobrevive al retiro.
-- ============================================================================

begin;

create table if not exists public.envios_postulacion (
  id uuid primary key default gen_random_uuid(),
  responsable_id uuid not null references public.usuarios (id) on delete cascade,
  enviada_en timestamptz not null default now()
);

create index if not exists envios_postulacion_responsable
  on public.envios_postulacion (responsable_id, enviada_en desc);

alter table public.envios_postulacion enable row level security;

drop policy if exists "responsable_lee_sus_envios" on public.envios_postulacion;
create policy "responsable_lee_sus_envios"
  on public.envios_postulacion for select to authenticated
  using (responsable_id = auth.uid());

-- Las postulaciones vigentes del historial conservan su consumo.
insert into public.envios_postulacion (responsable_id, enviada_en)
select coalesce(p.postulado_por_representante_id, p.candidato_id), p.creada_en
  from public.postulaciones p
 where not exists (select 1 from public.envios_postulacion);

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
  if new.postulado_por_representante_id is not null then
    responsable := new.postulado_por_representante_id;
    rol_responsable := 'representante';
  else
    responsable := new.candidato_id;
    rol_responsable := 'candidato';
  end if;

  cupo := public.limite_postulaciones_del_plan(responsable, rol_responsable);
  if cupo is not null then
    select count(*) into enviadas
      from public.envios_postulacion e
     where e.responsable_id = responsable
       and e.enviada_en >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';

    if enviadas >= cupo then
      raise exception 'Alcanzaste el límite de % postulaciones por mes de tu plan.', cupo;
    end if;
  end if;

  insert into public.envios_postulacion (responsable_id) values (responsable);
  return new;
end;
$$;

commit;
