import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  ETIQUETAS_TIPO_CONTRATO,
  PROVINCIAS_ARGENTINA,
} from "../tipos/dominio.js";

/**
 * Determina si una oferta del club puede editarse y si su identidad (puesto, posición,
 * categoría, contrato y provincia) sigue abierta o ya quedó fijada.
 *
 * Reglas de integridad:
 * - Ofertas `cerrada`: cierre definitivo; no admiten edición ni reapertura.
 * - Ofertas `pendiente_moderacion` o `rechazada` SIN postulantes: edición completa permitida.
 * - Ofertas `publicada`, `pausada` o con postulantes registrados: identidad bloqueada;
 *   solo se permite ajustar la descripción, que se guarda conservando el estado actual.
 * - La moderación se exige únicamente antes de la primera publicación: al crear la oferta
 *   y al corregir una oferta `rechazada`.
 */
export function obtenerReglasEdicionOferta(oferta, totalPostulantes = 0) {
  if (!oferta) {
    return {
      puedeEditar: false,
      identidadEditable: false,
      tienePostulantes: false,
      requiereReenvioModeracion: false,
      motivoBloqueo: "No se encontró la oferta solicitada.",
    };
  }

  if (oferta.estado === "cerrada") {
    return {
      puedeEditar: false,
      identidadEditable: false,
      tienePostulantes: Number(totalPostulantes) > 0,
      requiereReenvioModeracion: false,
      motivoBloqueo:
        "Las ofertas cerradas son definitivas y no pueden editarse. Si necesitás cubrir otra vacante, publicá una nueva oferta.",
    };
  }

  const tienePostulantes = Number(totalPostulantes) > 0;
  const antesDePublicarse =
    oferta.estado === "pendiente_moderacion" || oferta.estado === "rechazada";
  const identidadEditable = antesDePublicarse && !tienePostulantes;
  const requiereReenvioModeracion = oferta.estado === "rechazada";

  return {
    puedeEditar: true,
    identidadEditable,
    tienePostulantes,
    requiereReenvioModeracion,
    motivoBloqueo: null,
  };
}

/**
 * Valida y normaliza todos los campos al crear una oferta nueva (o en edición completa previa a publicación).
 */
export function validarDatosOferta(datosFormulario) {
  const puestoBuscado = String(datosFormulario.get("puestoBuscado") ?? "");
  const categoria = String(datosFormulario.get("categoria") ?? "").trim();
  const tipoContrato = String(datosFormulario.get("tipoContrato") ?? "");
  const provincia = String(datosFormulario.get("provincia") ?? "").trim();
  const descripcion = String(datosFormulario.get("descripcion") ?? "").trim();
  const posicionJuego =
    puestoBuscado === "jugador"
      ? String(datosFormulario.get("posicionJuego") ?? "").trim() || null
      : null;

  if (!puestoBuscado || !categoria || !tipoContrato || !provincia || !descripcion) {
    return { error: "Completá todos los campos obligatorios de la oferta." };
  }

  if (!Object.hasOwn(ETIQUETAS_PUESTO_PROFESIONAL, puestoBuscado)) {
    return { error: "Seleccioná un puesto profesional válido." };
  }

  if (!Object.hasOwn(ETIQUETAS_TIPO_CONTRATO, tipoContrato)) {
    return { error: "Seleccioná un tipo de contrato válido." };
  }

  if (!PROVINCIAS_ARGENTINA.includes(provincia)) {
    return { error: "Seleccioná una provincia válida." };
  }

  return {
    datos: {
      puesto_buscado: puestoBuscado,
      posicion_juego: posicionJuego,
      categoria,
      tipo_contrato: tipoContrato,
      provincia,
      descripcion,
    },
  };
}

function intentoModificarIdentidadBloqueada(datosFormulario, ofertaActual) {
  const campos = [
    ["puestoBuscado", ofertaActual.puesto_buscado ?? ""],
    ["categoria", String(ofertaActual.categoria ?? "").trim()],
    ["tipoContrato", ofertaActual.tipo_contrato ?? ""],
    ["provincia", String(ofertaActual.provincia ?? "").trim()],
  ];

  for (const [nombreCampo, valorActual] of campos) {
    if (datosFormulario.has(nombreCampo)) {
      const enviado = String(datosFormulario.get(nombreCampo) ?? "").trim();
      if (enviado !== valorActual) return true;
    }
  }

  if (datosFormulario.has("posicionJuego")) {
    const posicionEnviada = String(datosFormulario.get("posicionJuego") ?? "").trim() || null;
    const posicionActual = ofertaActual.posicion_juego || null;
    if (posicionEnviada !== posicionActual) return true;
  }

  return false;
}

/**
 * Valida la edición de una oferta existente protegiendo a los postulantes, la moderación
 * y evitando que el club recicle una misma oferta para eludir límites de publicación.
 */
export function validarEdicionOferta({
  datosFormulario,
  ofertaActual,
  totalPostulantes = 0,
}) {
  const reglas = obtenerReglasEdicionOferta(ofertaActual, totalPostulantes);
  if (!reglas.puedeEditar) {
    return { error: reglas.motivoBloqueo };
  }

  if (reglas.identidadEditable) {
    const validacion = validarDatosOferta(datosFormulario);
    if (validacion.error) {
      return { error: validacion.error };
    }

    const sinCambios =
      validacion.datos.puesto_buscado === ofertaActual.puesto_buscado &&
      (validacion.datos.posicion_juego || null) === (ofertaActual.posicion_juego || null) &&
      validacion.datos.categoria === String(ofertaActual.categoria ?? "").trim() &&
      validacion.datos.tipo_contrato === ofertaActual.tipo_contrato &&
      validacion.datos.provincia === String(ofertaActual.provincia ?? "").trim() &&
      validacion.datos.descripcion === String(ofertaActual.descripcion ?? "").trim();

    if (sinCambios && ofertaActual.estado !== "rechazada") {
      return { error: "No realizaste cambios en la oferta." };
    }

    return {
      datos: {
        ...validacion.datos,
        estado: "pendiente_moderacion",
      },
    };
  }

  if (intentoModificarIdentidadBloqueada(datosFormulario, ofertaActual)) {
    return {
      error:
        "El puesto y las condiciones principales no pueden modificarse porque la oferta ya fue publicada o tiene postulantes. Publicá una nueva oferta.",
    };
  }

  const descripcion = String(datosFormulario.get("descripcion") ?? "").trim();
  if (!descripcion) {
    return { error: "Completá la descripción de la oferta." };
  }

  if (
    descripcion === String(ofertaActual.descripcion ?? "").trim() &&
    ofertaActual.estado !== "rechazada"
  ) {
    return { error: "No realizaste cambios en la descripción de la oferta." };
  }

  // Una oferta ya publicada no vuelve a moderación por editar su descripción:
  // la moderación previa solo aplica antes de la primera publicación.
  if (ofertaActual.estado === "rechazada") {
    return {
      datos: {
        descripcion,
        estado: "pendiente_moderacion",
      },
    };
  }

  return { datos: { descripcion } };
}

/**
 * Determina si el club puede eliminar una oferta propia.
 *
 * Eliminar borra la oferta de la base y, con ella, las postulaciones asociadas
 * (`on delete cascade`). Se permite en cualquier estado, pero cuando había candidatos
 * hay que avisarles: pierden la postulación de su historial sin haberla cancelado.
 */
export function validarEliminacionOferta(oferta, totalPostulantes = 0) {
  if (!oferta) {
    return {
      puedeEliminar: false,
      requiereAvisoPostulantes: false,
      totalPostulantes: 0,
      motivoBloqueo: "No se encontró la oferta solicitada.",
    };
  }

  const postulantes = Math.max(0, Number(totalPostulantes) || 0);

  return {
    puedeEliminar: true,
    requiereAvisoPostulantes: postulantes > 0,
    totalPostulantes: postulantes,
    motivoBloqueo: null,
  };
}
