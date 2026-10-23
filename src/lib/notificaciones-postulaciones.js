import { ETIQUETAS_ESTADO_POSTULACION, ETIQUETAS_PUESTO_PROFESIONAL } from "../tipos/dominio.js";
import { listarFilasNotificaciones } from "./lectura-notificaciones.js";

function tituloOferta(oferta) {
  const puesto = ETIQUETAS_PUESTO_PROFESIONAL[oferta?.puesto_buscado] ?? "Oferta laboral";
  return oferta?.posicion_juego ? `${puesto} — ${oferta.posicion_juego}` : puesto;
}

/** Solo usar con un usuario validado en el servidor; cada consulta limita el destinatario. */
export async function obtenerAvisosPostulaciones(cliente, usuario) {
  if (!["club", "candidato"].includes(usuario?.rol) || !usuario.id) throw new Error("Destinatario inválido");

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
    return {
      total: postulaciones.length + decisiones.length + avisosVerificacion.length,
      notificaciones: [...postulaciones, ...decisiones, ...avisosVerificacion]
        .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha) || a.id.localeCompare(b.id)),
    };
  }

  // Recorrer las páginas mantiene el contador exacto incluso con más de 1000 postulaciones.
  // Se conserva la última actualización de cada postulación, no un historial de estados.
  let total = 0;
  const notificaciones = [];
  for (let desde = 0; ; desde += 500) {
    const { data, error } = await cliente.from("postulaciones")
      .select("id, estado, creada_en, actualizada_en, ofertas_laborales(puesto_buscado, posicion_juego, perfiles_club(nombre_club))")
      .eq("candidato_id", usuario.id)
      .order("actualizada_en", { ascending: false }).order("id").range(desde, desde + 499);
    if (error) throw error;
    const filas = data ?? [];
    for (const fila of filas) {
      const tieneCambio = fila.estado !== "postulado" || Date.parse(fila.actualizada_en) > Date.parse(fila.creada_en);
      if (!tieneCambio) continue;
      total += 1;
      const estado = fila.estado === "rechazado" ? "No seleccionado" : ETIQUETAS_ESTADO_POSTULACION[fila.estado] ?? fila.estado;
      notificaciones.push({
        id: fila.id,
        origen: fila.ofertas_laborales?.perfiles_club?.nombre_club ?? "El club",
        mensaje: `actualizó tu postulación: ${estado}.`,
        detalle: tituloOferta(fila.ofertas_laborales),
        fecha: fila.actualizada_en,
        href: `/mis-postulaciones#postulacion-${fila.id}`,
      });
    }
    if (filas.length < 500) break;
  }
  return { total, notificaciones };
}

export async function consultarAvisosPostulaciones(clienteSesion, crearClienteDatos) {
  const { data: { user }, error: errorSesion } = await clienteSesion.auth.getUser();
  if (errorSesion || !user) return { status: 401, datos: { error: "Iniciá sesión para continuar." } };
  const { data: usuario, error } = await clienteSesion.from("usuarios")
    .select("id, rol, cuenta_activa").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (!usuario?.cuenta_activa || !["club", "candidato"].includes(usuario.rol)) {
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
