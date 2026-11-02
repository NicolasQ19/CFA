import { ETIQUETAS_PUESTO_PROFESIONAL, POSICIONES_DE_JUEGO, PROVINCIAS_ARGENTINA } from "../tipos/dominio.js";
import { rangoFechasPorEdad } from "./edad.js";

/** Topes del rango de edad del buscador: fuera de esto no hay fútbol federado. */
export const EDAD_MINIMA_BUSQUEDA = 14;
export const EDAD_MAXIMA_BUSQUEDA = 70;

export const ORDENES_BUSQUEDA = {
  recientes: "Actualizados recientemente",
  nombre_asc: "Nombre (A–Z)",
  nombre_desc: "Nombre (Z–A)",
  edad_asc: "Edad (de menor a mayor)",
  edad_desc: "Edad (de mayor a menor)",
};

export const ORDEN_POR_DEFECTO = "recientes";

function textoOpcional(valor) {
  const limpio = String(valor ?? "").trim();
  return limpio || undefined;
}

/** Solo acepta valores del catálogo: un valor inventado en la URL se descarta. */
function opcionDelCatalogo(valor, catalogo) {
  const limpio = textoOpcional(valor);
  return limpio !== undefined && catalogo.includes(limpio) ? limpio : undefined;
}

function edadDelFiltro(valor) {
  const limpio = String(valor ?? "").trim();
  if (!/^\d{1,3}$/.test(limpio)) return undefined;
  return Math.min(Math.max(Number(limpio), EDAD_MINIMA_BUSQUEDA), EDAD_MAXIMA_BUSQUEDA);
}

/**
 * Normaliza los parámetros de la URL del buscador de candidatos.
 *
 * Todo lo que no se entiende se descarta en lugar de llegar a la consulta: así
 * una URL editada a mano no devuelve una lista vacía sin explicación.
 *
 * `rangoInvertido` avisa que la edad mínima superaba la máxima. En ese caso el
 * rango se ignora por completo —filtrar por una de las dos puntas daría un
 * resultado que el club no pidió— y la página lo informa.
 */
export function normalizarFiltrosCandidatos(parametros = {}) {
  const edadMinima = edadDelFiltro(parametros.edadMinima);
  const edadMaxima = edadDelFiltro(parametros.edadMaxima);
  const rangoInvertido = edadMinima !== undefined && edadMaxima !== undefined && edadMinima > edadMaxima;

  return {
    rangoInvertido,
    filtros: {
      nombre: textoOpcional(parametros.nombre),
      puesto: opcionDelCatalogo(parametros.puesto, Object.keys(ETIQUETAS_PUESTO_PROFESIONAL)),
      provincia: opcionDelCatalogo(parametros.provincia, PROVINCIAS_ARGENTINA),
      posicion: opcionDelCatalogo(parametros.posicion, POSICIONES_DE_JUEGO),
      edadMinima: rangoInvertido ? undefined : edadMinima,
      edadMaxima: rangoInvertido ? undefined : edadMaxima,
      orden: Object.hasOwn(ORDENES_BUSQUEDA, parametros.orden) ? parametros.orden : ORDEN_POR_DEFECTO,
    },
  };
}

/** `true` si el club acotó la búsqueda de alguna forma (para ofrecer "limpiar"). */
export function hayFiltrosAplicados(filtros) {
  return Boolean(filtros.nombre || filtros.puesto || filtros.provincia || filtros.posicion
    || filtros.edadMinima !== undefined || filtros.edadMaxima !== undefined
    || (filtros.orden && filtros.orden !== ORDEN_POR_DEFECTO));
}

/**
 * Traduce un orden del buscador a la columna y el sentido que espera Supabase.
 *
 * El nombre vive en `usuarios`, no en `perfiles_candidato`. Se ordena con la
 * sintaxis de recurso embebido `usuarios(columna)`, NO con la opción
 * `referencedTable`: esa última ordena las filas *embebidas* y deja las filas
 * padre en el orden que venían (verificado contra la base).
 *
 * Más joven primero es fecha de nacimiento descendente. Las fechas ausentes van
 * siempre al final: un perfil sin fecha no es "el más joven".
 */
export function ordenParaConsulta(orden) {
  switch (orden) {
    case "nombre_asc":
      return { columna: "usuarios(nombre_completo)", ascendente: true };
    case "nombre_desc":
      return { columna: "usuarios(nombre_completo)", ascendente: false };
    case "edad_asc":
      return { columna: "fecha_nacimiento", ascendente: false, ausentesAlFinal: true };
    case "edad_desc":
      return { columna: "fecha_nacimiento", ascendente: true, ausentesAlFinal: true };
    default:
      return { columna: "actualizado_en", ascendente: false };
  }
}

/** Rango de fechas de nacimiento que corresponde a los filtros de edad. */
export function rangoDeNacimiento(filtros, hoy = new Date()) {
  return rangoFechasPorEdad(filtros.edadMinima, filtros.edadMaxima, hoy);
}
