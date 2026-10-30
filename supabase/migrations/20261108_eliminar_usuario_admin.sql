-- ============================================================================
-- CFA — Eliminación definitiva de cuentas desde la administración
--
-- El borrado se hace sobre auth.users (o sobre public.usuarios para las fichas
-- de cartera, que no tienen login) y baja en cascada al resto de las tablas.
-- La única referencia que lo bloqueaba era suscripciones.activada_por, que no
-- declaraba acción al borrar: queda en set null para conservar la suscripción
-- del otro usuario aunque se elimine quien la activó.
-- ============================================================================

begin;

alter table public.suscripciones
  drop constraint if exists suscripciones_activada_por_fkey;

alter table public.suscripciones
  add constraint suscripciones_activada_por_fkey
  foreign key (activada_por) references public.usuarios (id) on delete set null;

commit;
