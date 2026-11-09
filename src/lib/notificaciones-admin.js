import { ETIQUETAS_PUESTO_PROFESIONAL } from "../tipos/dominio.js";

/** Une ofertas por moderar y solicitudes de verificación en el formato de la campana, de la más nueva a la más vieja. */
export function combinarAvisosAdmin({ ofertas = [], verificaciones = [] }) {
  const avisosOfertas = ofertas.map((oferta) => ({
    id: oferta.id,
    origen: oferta.perfiles_club?.nombre_club ?? "Club sin nombre",
    mensaje: "creó una nueva oferta.",
    detalle: ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado,
    fecha: oferta.creada_en,
    href: `/admin?oferta=${oferta.id}#oferta-${oferta.id}`,
  }));

  const avisosVerificacion = verificaciones.map((solicitud) => ({
    id: `verificacion-${solicitud.club_id}-${solicitud.solicitada_en}`,
    origen: solicitud.club?.perfiles_club?.nombre_club ?? solicitud.club?.nombre_completo ?? "Club sin nombre",
    mensaje: "solicitó la verificación del club.",
    detalle: "Verificación institucional",
    fecha: solicitud.solicitada_en,
    href: "/admin/clubes",
  }));

  return [...avisosOfertas, ...avisosVerificacion].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
}
