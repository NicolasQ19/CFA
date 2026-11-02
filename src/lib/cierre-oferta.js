import { TRANSICIONES_OFERTA_DEL_CLUB } from "../tipos/dominio.js";

/**
 * Estados de postulación que siguen en curso y pasan a `oferta_cerrada`
 * cuando el club cierra definitivamente la búsqueda laboral.
 * Las postulaciones ya marcadas como `rechazado` conservan su resolución original.
 */
export const ESTADOS_ABIERTOS_POSTULACION = [
  "postulado",
  "visto",
  "preseleccionado",
];

/**
 * Cambia el estado de una oferta propia del club (pausar, reanudar o cerrar).
 * Si el nuevo estado es `cerrada`, actualiza automáticamente todas las postulaciones
 * abiertas de esa oferta a `oferta_cerrada` para notificar a candidatos y representantes.
 */
export async function ejecutarCambioEstadoOferta({
  supabase,
  ofertaId,
  clubId,
  nuevoEstado,
  ahora = new Date().toISOString(),
}) {
  const { data: oferta } = await supabase
    .from("ofertas_laborales")
    .select("id, club_id, estado")
    .eq("id", ofertaId)
    .maybeSingle();

  if (!oferta || oferta.club_id !== clubId) {
    return { error: "Esta oferta no pertenece a tu club." };
  }

  if (!TRANSICIONES_OFERTA_DEL_CLUB[oferta.estado]?.includes(nuevoEstado)) {
    return { error: "No se puede cambiar la oferta a ese estado." };
  }

  const { error } = await supabase
    .from("ofertas_laborales")
    .update({ estado: nuevoEstado, actualizada_en: ahora })
    .eq("id", ofertaId)
    .eq("club_id", clubId);

  if (error) {
    return { error: error.message };
  }

  if (nuevoEstado === "cerrada") {
    const { error: errorPostulaciones } = await supabase
      .from("postulaciones")
      .update({ estado: "oferta_cerrada", actualizada_en: ahora })
      .eq("oferta_id", ofertaId)
      .in("estado", ESTADOS_ABIERTOS_POSTULACION);

    if (errorPostulaciones) {
      return { error: errorPostulaciones.message };
    }
  }

  return { exito: true, ofertaCerrada: nuevoEstado === "cerrada" };
}
