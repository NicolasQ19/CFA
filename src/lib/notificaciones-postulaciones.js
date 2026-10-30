import { ETIQUETAS_ESTADO_POSTULACION, ETIQUETAS_PUESTO_PROFESIONAL } from "../tipos/dominio.js";
import { listarFilasNotificaciones } from "./lectura-notificaciones.js";
import { NOMBRES_PLAN_POR_ROL, obtenerPlanVigente } from "./suscripciones.js";

/**
 * Aviso del plan cuando lo cambió la administración (no el propio usuario):
 * la cuenta no se entera de otra forma de que le activaron o le dieron de baja el Pro.
 */
async function avisoDePlan(cliente, usuario) {
  const { data, error } = await cliente.from("suscripciones")
    .select("plan, vence_en, activada_por, actualizada_en, observaciones")
    .eq("usuario_id", usuario.id)
    .maybeSingle();

  if (error || !data || !data.actualizada_en) return [];
  if (!data.activada_por || data.activada_por === usuario.id) return [];

  const nombres = NOMBRES_PLAN_POR_ROL[usuario.rol];
  if (!nombres) return [];

  const esPago = obtenerPlanVigente(data) === "pago";

  return [{
    id: `plan-${usuario.id}-${data.actualizada_en}`,
    origen: "Administración",
    mensaje: esPago
      ? `activó tu plan ${nombres.pago}.${data.observaciones ? ` ${data.observaciones}` : ""}`
      : `dio de baja tu plan ${nombres.pago}. Volviste a los límites de ${nombres.gratuito}.`,
    detalle: "Plan de tu cuenta",
    fecha: data.actualizada_en,
    href: "/planes",
  }];
}

function tituloOferta(oferta) {
  const puesto = ETIQUETAS_PUESTO_PROFESIONAL[oferta?.puesto_buscado] ?? "Oferta laboral";
  return oferta?.posicion_juego ? `${puesto} — ${oferta.posicion_juego}` : puesto;
}

/** Solo usar con un usuario validado en el servidor; cada consulta limita el destinatario. */
export async function obtenerAvisosPostulaciones(cliente, usuario) {
  if (!["club", "candidato", "representante"].includes(usuario?.rol) || !usuario.id) throw new Error("Destinatario inválido");

  if (usuario.rol === "club") {
    const verificacion = usuario.verificacion_club;
    const avisosVerificacion = verificacion?.revisada_en && ["verificado", "rechazado"].includes(verificacion.estado) ? [{
      id: `verificacion-club-${usuario.id}`,
      origen: "Administración",
      mensaje: `${verificacion.estado === "verificado" ? "verificó tu club. Ya podés publicar ofertas y acceder a candidatos." : "rechazó la verificación de tu club."}${verificacion.observaciones ? ` ${verificacion.observaciones}` : ""}`,
      detalle: "Verificación del club",
      fecha: verificacion.revisada_en,
      href: "/mi-club#verificacion",
    }] : [];
    if (verificacion?.estado !== "verificado") return { total: avisosVerificacion.length, notificaciones: avisosVerificacion };
    const data = await listarFilasNotificaciones(() => cliente.from("postulaciones")
      .select("id, oferta_id, creada_en, perfiles_candidato(usuarios(nombre_completo)), ofertas_laborales!inner(club_id, puesto_buscado, posicion_juego)")
      .eq("ofertas_laborales.club_id", usuario.id)
      .eq("estado", "postulado")
      .order("creada_en", { ascending: false }).order("id"));
    const ofertas = await listarFilasNotificaciones(() => cliente.from("ofertas_laborales")
      .select("id, estado, puesto_buscado, posicion_juego, actualizada_en")
      .eq("club_id", usuario.id)
      .in("estado", ["publicada", "rechazada"])
      .order("actualizada_en", { ascending: false }).order("id"));

    const postulaciones = (data ?? []).map(fila => ({
        id: fila.id,
        origen: fila.perfiles_candidato?.usuarios?.nombre_completo ?? "Un candidato",
        mensaje: "se postuló a tu oferta.",
        detalle: tituloOferta(fila.ofertas_laborales),
        fecha: fila.creada_en,
        href: `/mis-ofertas/${fila.oferta_id}/postulantes#postulacion-${fila.id}`,
      }));
    const decisiones = (ofertas ?? []).map(oferta => ({
      id: `oferta-${oferta.id}`,
      origen: "Tu oferta",
      mensaje: oferta.estado === "publicada" ? "fue publicada y está disponible para recibir postulaciones." : "fue rechazada y no se mostrará en el listado público.",
      detalle: tituloOferta(oferta),
      fecha: oferta.actualizada_en,
      href: `/mis-ofertas#oferta-${oferta.id}`,
    }));
    const avisosPlan = await avisoDePlan(cliente, usuario);

    return {
      total: postulaciones.length + decisiones.length + avisosVerificacion.length + avisosPlan.length,
      notificaciones: [...postulaciones, ...decisiones, ...avisosVerificacion, ...avisosPlan]
        .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha) || a.id.localeCompare(b.id)),
    };
  }

  // Recorrer las páginas mantiene el contador exacto incluso con más de 1000 postulaciones.
  // Se conserva la última actualización de cada postulación, no un historial de estados.
  let total = 0;
  const notificaciones = [];
  const esRepresentante = usuario.rol === "representante";
  for (let desde = 0; ; desde += 500) {
    const { data, error } = await cliente.from("postulaciones")
      .select(esRepresentante
        ? "id, oferta_id, estado, creada_en, actualizada_en, perfiles_candidato(usuarios(nombre_completo)), ofertas_laborales(puesto_buscado, posicion_juego, descripcion_actualizada_en, perfiles_club(nombre_club))"
        : "id, oferta_id, estado, creada_en, actualizada_en, ofertas_laborales(puesto_buscado, posicion_juego, descripcion_actualizada_en, perfiles_club(nombre_club))")
      .eq(esRepresentante ? "postulado_por_representante_id" : "candidato_id", usuario.id)
      .order("actualizada_en", { ascending: false }).order("id").range(desde, desde + 499);
    if (error) throw error;
    const filas = data ?? [];
    for (const fila of filas) {
      const descripcionCambiada = fila.ofertas_laborales?.descripcion_actualizada_en;
      // La descripción de la oferta cambió después de que se envió esta postulación.
      if (descripcionCambiada && Date.parse(descripcionCambiada) > Date.parse(fila.creada_en)) {
        total += 1;
        notificaciones.push({
          id: `descripcion-${fila.id}`,
          origen: fila.ofertas_laborales?.perfiles_club?.nombre_club ?? "El club",
          mensaje: esRepresentante
            ? `cambió la descripción de una oferta a la que postulaste a ${fila.perfiles_candidato?.usuarios?.nombre_completo ?? "tu representado"}.`
            : "cambió la descripción de la oferta a la que te postulaste.",
          detalle: tituloOferta(fila.ofertas_laborales),
          fecha: descripcionCambiada,
          href: `/ofertas/${fila.oferta_id}`,
        });
      }

      const tieneCambio = fila.estado !== "postulado" || Date.parse(fila.actualizada_en) > Date.parse(fila.creada_en);
      if (!tieneCambio) continue;
      total += 1;
      const estado = fila.estado === "rechazado" ? "No seleccionado" : ETIQUETAS_ESTADO_POSTULACION[fila.estado] ?? fila.estado;
      notificaciones.push({
        id: fila.id,
        origen: fila.ofertas_laborales?.perfiles_club?.nombre_club ?? "El club",
        mensaje: esRepresentante
          ? `actualizó la postulación de ${fila.perfiles_candidato?.usuarios?.nombre_completo ?? "tu representado"}: ${estado}.`
          : `actualizó tu postulación: ${estado}.`,
        detalle: tituloOferta(fila.ofertas_laborales),
        fecha: fila.actualizada_en,
        href: `${esRepresentante ? "/mi-cartera" : "/mis-postulaciones"}#postulacion-${fila.id}`,
      });
    }
    if (filas.length < 500) break;
  }

  // La oferta eliminada ya no existe: el aviso es lo único que queda de esa postulación.
  const bajas = await listarFilasNotificaciones(() => cliente.from("avisos_ofertas_eliminadas")
    .select("id, nombre_club, titulo_oferta, creada_en")
    .eq(esRepresentante ? "representante_id" : "candidato_id", usuario.id)
    .order("creada_en", { ascending: false }).order("id"));

  for (const baja of bajas ?? []) {
    total += 1;
    notificaciones.push({
      id: `baja-${baja.id}`,
      origen: baja.nombre_club,
      mensaje: esRepresentante
        ? "eliminó una oferta en la que habías postulado a un representado. La postulación ya no figura en tu cartera."
        : "eliminó la oferta a la que te habías postulado. La postulación ya no figura en tu historial.",
      detalle: baja.titulo_oferta,
      fecha: baja.creada_en,
      href: esRepresentante ? "/mi-cartera" : "/mis-postulaciones",
    });
  }

  for (const aviso of await avisoDePlan(cliente, usuario)) {
    total += 1;
    notificaciones.push(aviso);
  }

  return { total, notificaciones };
}

export async function consultarAvisosPostulaciones(clienteSesion, crearClienteDatos) {
  const { data: { user }, error: errorSesion } = await clienteSesion.auth.getUser();
  if (errorSesion || !user) return { status: 401, datos: { error: "Iniciá sesión para continuar." } };
  const { data: usuario, error } = await clienteSesion.from("usuarios")
    .select("id, rol, cuenta_activa").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (!usuario?.cuenta_activa || !["club", "candidato", "representante"].includes(usuario.rol)) {
    return { status: 403, datos: { error: "No tenés permiso para consultar estos avisos." } };
  }
  if (usuario.rol === "club") {
    const { data: verificacion, error: errorVerificacion } = await clienteSesion.from("verificaciones_club")
      .select("estado, revisada_en, observaciones").eq("club_id", user.id).maybeSingle();
    if (errorVerificacion) throw errorVerificacion;
    usuario.verificacion_club = verificacion;
    if (verificacion?.estado !== "verificado") return { status: 200, datos: await obtenerAvisosPostulaciones(null, { ...usuario, id: user.id }) };
  }
  // La clave de servicio permite incluir el nombre del club si la oferta se pausó o cerró.
  // Se crea después de validar la sesión; las consultas se limitan siempre al usuario autenticado.
  const datos = await obtenerAvisosPostulaciones(crearClienteDatos(), { ...usuario, id: user.id });
  return { status: 200, datos };
}
