import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  ETIQUETAS_TIPO_CONTRATO,
  PROVINCIAS_ARGENTINA,
} from "../tipos/dominio.js";

/**
 * Valida y normaliza los campos editables de una oferta laboral del club (RF-13 / CU-11).
 * Si la oferta estaba rechazada, al editarla vuelve a enviarse a pendiente_moderacion (CU-21 / Diagrama 5.1).
 */
export function validarDatosOferta(datosFormulario, estadoActual = null) {
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

  const datos = {
    puesto_buscado: puestoBuscado,
    posicion_juego: posicionJuego,
    categoria,
    tipo_contrato: tipoContrato,
    provincia,
    descripcion,
  };

  if (estadoActual === "rechazada") {
    datos.estado = "pendiente_moderacion";
  }

  return { datos };
}
