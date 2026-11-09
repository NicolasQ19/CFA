import {
  ESTADOS_OFERTA_QUE_OCUPAN_CUPO,
  inicioDelMes,
  obtenerPlanVigente,
  puedePostularse,
  puedePublicarOferta,
} from "./suscripciones.js";

/**
 * Plan vigente de un usuario. Cada cuenta solo puede leer su propia suscripción (RLS);
 * ante cualquier error de lectura se devuelve `gratuito` para no regalar cupo.
 */
export async function obtenerPlanDelUsuario(supabase, usuarioId) {
  const { data, error } = await supabase
    .from("suscripciones")
    .select("plan, vence_en")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error) return "gratuito";

  return obtenerPlanVigente(data);
}

/** Ofertas del club que ocupan cupo: pendientes de moderación, publicadas y pausadas. */
export async function contarOfertasActivas(supabase, clubId) {
  const { count, error } = await supabase
    .from("ofertas_laborales")
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .in("estado", ESTADOS_OFERTA_QUE_OCUPAN_CUPO);

  if (error || count === null) return { fallo: "No se pudo verificar cuántas ofertas activas tenés. Intentá nuevamente." };

  return { total: count };
}

/** Cupo de publicación del club: sirve para bloquear la acción y para mostrar el consumo. */
export async function obtenerCupoOfertasDelClub(supabase, clubId) {
  const [plan, conteo] = await Promise.all([
    obtenerPlanDelUsuario(supabase, clubId),
    contarOfertasActivas(supabase, clubId),
  ]);

  if (conteo.fallo) return { fallo: conteo.fallo };

  return { plan, usadas: conteo.total, ...puedePublicarOferta({ plan, ofertasActivas: conteo.total }) };
}

/**
 * Postulaciones que el usuario envió en el mes corriente.
 *
 * El cupo lo consume quien envía: las postulaciones que manda un representante
 * descuentan de su plan y nunca del cupo del candidato representado.
 *
 * Se cuenta en `envios_postulacion` y no en `postulaciones`: cancelar borra la
 * postulación, y el envío tiene que seguir contando en el mes.
 */
export async function contarPostulacionesDelMes(supabase, usuarioId, ahora = new Date()) {
  const { count, error } = await supabase
    .from("envios_postulacion")
    .select("id", { count: "exact", head: true })
    .eq("responsable_id", usuarioId)
    .gte("enviada_en", inicioDelMes(ahora));

  if (error || count === null) return { fallo: "No se pudo verificar cuántas postulaciones enviaste este mes. Intentá nuevamente." };

  return { total: count };
}

/** Cupo mensual de postulaciones del candidato o del representante. */
export async function obtenerCupoPostulaciones(supabase, usuarioId, rol, ahora = new Date()) {
  const [plan, conteo] = await Promise.all([
    obtenerPlanDelUsuario(supabase, usuarioId),
    contarPostulacionesDelMes(supabase, usuarioId, ahora),
  ]);

  if (conteo.fallo) return { fallo: conteo.fallo };

  return { plan, usadas: conteo.total, ...puedePostularse({ rol, plan, postulacionesDelMes: conteo.total }) };
}

export { inicioDelMes };
