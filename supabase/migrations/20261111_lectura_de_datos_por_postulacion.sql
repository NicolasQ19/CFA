-- ============================================================================
-- CFA — Lecturas que dependen de una postulación
-- 1. El club dueño de una oferta ve el perfil de sus postulantes aunque esté oculto (RN-15).
-- 2. Quien se postuló sigue viendo la oferta aunque ya no esté publicada.
-- Las funciones son security definer para no encadenar las políticas de
-- `postulaciones` y `ofertas_laborales`, que se referencian entre sí.
-- ============================================================================

begin;

create or replace function public.club_tiene_postulante(id_candidato uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.postulaciones p
      join public.ofertas_laborales o on o.id = p.oferta_id
     where p.candidato_id = id_candidato
       and o.club_id = auth.uid()
  );
$$;

create or replace function public.usuario_postulo_a_oferta(id_oferta uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.postulaciones p
     where p.oferta_id = id_oferta
       and (p.candidato_id = auth.uid() or p.postulado_por_representante_id = auth.uid())
  );
$$;

revoke all on function public.club_tiene_postulante(uuid) from public;
revoke all on function public.usuario_postulo_a_oferta(uuid) from public;
grant execute on function public.club_tiene_postulante(uuid) to authenticated;
grant execute on function public.usuario_postulo_a_oferta(uuid) to authenticated;

drop policy if exists "club_ve_perfil_de_sus_postulantes" on public.perfiles_candidato;
create policy "club_ve_perfil_de_sus_postulantes"
  on public.perfiles_candidato for select to authenticated
  using (public.club_tiene_postulante(usuario_id));

drop policy if exists "postulantes_ven_sus_ofertas" on public.ofertas_laborales;
create policy "postulantes_ven_sus_ofertas"
  on public.ofertas_laborales for select to authenticated
  using (public.usuario_postulo_a_oferta(id));

commit;
