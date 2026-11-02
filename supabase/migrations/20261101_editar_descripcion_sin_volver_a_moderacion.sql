-- ============================================================================
-- CFA — La moderación previa solo aplica antes de la primera publicación
-- Reemplaza la regla que obligaba a reenviar a pendiente_moderacion cualquier
-- cambio de descripción. Ahora:
--   * Ofertas pendiente_moderacion / rechazada: todo cambio de contenido sigue
--     exigiendo que la oferta quede en pendiente_moderacion.
--   * Ofertas publicada / pausada: el club puede corregir la descripción sin
--     salir del listado público y sin cambiar de estado por esta vía.
-- El resto de las protecciones (cierre definitivo, identidad bloqueada,
-- autopublicación) se mantiene igual.
-- ============================================================================

begin;

create or replace function public.proteger_integridad_oferta_club()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tiene_postulantes boolean;
  identidad_cambio boolean;
begin
  -- Los administradores conservan sus facultades de moderación.
  if public.rol_del_usuario_actual() <> 'club' then
    return new;
  end if;

  if old.club_id is distinct from new.club_id then
    raise exception 'No se puede transferir una oferta a otro club.';
  end if;

  if old.estado = 'cerrada' then
    raise exception 'Las ofertas cerradas son definitivas y no pueden editarse ni reabrirse.';
  end if;

  identidad_cambio :=
    old.puesto_buscado is distinct from new.puesto_buscado
    or old.posicion_juego is distinct from new.posicion_juego
    or old.categoria is distinct from new.categoria
    or old.tipo_contrato is distinct from new.tipo_contrato
    or old.provincia is distinct from new.provincia;

  if identidad_cambio then
    select exists(
      select 1 from public.postulaciones p where p.oferta_id = old.id
    ) into tiene_postulantes;

    if old.estado not in ('pendiente_moderacion', 'rechazada') or tiene_postulantes then
      raise exception 'El puesto y las condiciones principales no pueden modificarse porque la oferta ya fue publicada o tiene postulantes.';
    end if;
  end if;

  if old.estado in ('pendiente_moderacion', 'rechazada') then
    if new.estado <> 'pendiente_moderacion' then
      raise exception 'La oferta debe ser aprobada por administración antes de publicarse.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.proteger_integridad_oferta_club() from public;

commit;
