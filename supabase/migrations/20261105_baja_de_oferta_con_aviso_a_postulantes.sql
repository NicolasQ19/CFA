-- ============================================================================
-- CFA — El club elimina ofertas propias, con aviso a sus postulantes
-- `postulaciones` depende de la oferta con `on delete cascade`: al borrarla, los
-- candidatos pierden la postulación de su historial. Para que no se enteren por
-- la desaparición silenciosa de la fila, el club deja un aviso por postulante
-- antes de borrar, y ese aviso sobrevive a la oferta.
-- ============================================================================

begin;

-- Por si se aplicó la versión anterior de este archivo, que bloqueaba el borrado.
drop trigger if exists proteger_eliminacion_oferta_club on public.ofertas_laborales;
drop function if exists public.proteger_eliminacion_oferta_club();

create table if not exists public.avisos_ofertas_eliminadas (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references public.usuarios (id) on delete cascade,
  representante_id uuid references public.usuarios (id) on delete set null,
  club_id uuid not null references public.usuarios (id) on delete cascade,
  nombre_club text not null,
  titulo_oferta text not null,
  creada_en timestamptz not null default now()
);

create index if not exists avisos_ofertas_eliminadas_candidato
  on public.avisos_ofertas_eliminadas (candidato_id, creada_en desc);
create index if not exists avisos_ofertas_eliminadas_representante
  on public.avisos_ofertas_eliminadas (representante_id, creada_en desc);

alter table public.avisos_ofertas_eliminadas enable row level security;

-- Cada destinatario lee solo sus avisos; el administrador, todos.
drop policy if exists "destinatarios_leen_sus_avisos_de_baja" on public.avisos_ofertas_eliminadas;
create policy "destinatarios_leen_sus_avisos_de_baja"
  on public.avisos_ofertas_eliminadas for select to authenticated
  using (
    candidato_id = auth.uid()
    or representante_id = auth.uid()
    or public.es_administrador_activo()
  );

-- El club solo puede dejar avisos a su propio nombre; nadie puede editarlos ni borrarlos.
drop policy if exists "clubes_registran_avisos_de_baja" on public.avisos_ofertas_eliminadas;
create policy "clubes_registran_avisos_de_baja"
  on public.avisos_ofertas_eliminadas for insert to authenticated
  with check (club_id = auth.uid() and public.rol_del_usuario_actual() = 'club');

commit;
