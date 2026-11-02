-- ============================================================================
-- CFA — Aviso a postulantes cuando cambia la descripción de una oferta activa
-- Registra la fecha del último cambio de descripción posterior a la publicación
-- para que candidatos y representantes lo vean en su campana de notificaciones.
-- La edición previa a la publicación (pendiente_moderacion / rechazada) no genera
-- aviso: todavía no hay postulantes que dependan de ese texto.
-- ============================================================================

begin;

alter table public.ofertas_laborales
  add column if not exists descripcion_actualizada_en timestamptz;

create or replace function public.registrar_cambio_descripcion_oferta()
returns trigger
language plpgsql
as $$
begin
  if old.descripcion is distinct from new.descripcion
    and old.estado in ('publicada', 'pausada')
  then
    new.descripcion_actualizada_en := now();
  end if;

  return new;
end;
$$;

drop trigger if exists registrar_cambio_descripcion_oferta on public.ofertas_laborales;

-- Se ejecuta después del trigger de integridad (orden alfabético de nombres).
create trigger registrar_cambio_descripcion_oferta
  before update on public.ofertas_laborales
  for each row execute function public.registrar_cambio_descripcion_oferta();

commit;
