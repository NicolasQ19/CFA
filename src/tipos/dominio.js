/**
 * Vocabulario del dominio de CFA (Contrataciones de Fútbol Argentino).
 * Estos objetos y funciones reflejan el lenguaje del BRD para que
 * el código se lea igual que los requerimientos funcionales.
 */

export const ETIQUETAS_ROL_USUARIO = {
  candidato: "Candidato",
  representante: "Representante",
  club: "Club / Ofertante",
  administrador: "Administrador",
};

export const ETIQUETAS_PUESTO_PROFESIONAL = {
  jugador: "Jugador",
  director_tecnico: "Director Técnico",
  preparador_fisico: "Preparador Físico",
  kinesiologo: "Kinesiólogo",
  analista_deportivo: "Analista Deportivo",
  coordinador_deportivo: "Coordinador Deportivo",
  medico: "Médico",
  utilero: "Utilero",
  ojeador_scout: "Ojeador / Scout",
  otro: "Otro puesto vinculado a un club",
};

/*El puesto "jugador" carga datos deportivos; el resto carga datos técnicos. */
export function esPuestoDeCuerpoTecnico(puesto) {
  return puesto !== "jugador";
}

export const ETIQUETAS_ESTADO_POSTULACION = {
  postulado: "Postulado",
  visto: "Visto",
  preseleccionado: "Preseleccionado",
  rechazado: "Rechazado",
  oferta_cerrada: "Oferta cerrada",
};

export const ETIQUETAS_ESTADO_OFERTA = {
  pendiente_moderacion: "Pendiente de moderación",
  publicada: "Publicada",
  pausada: "Pausada",
  cerrada: "Cerrada",
  rechazada: "Rechazada",
};

/**
 * Cambios de estado que el club puede hacer sobre sus propias ofertas.
 * Pendientes y rechazadas no aparecen: esas solo las mueve el administrador.
 */
export const TRANSICIONES_OFERTA_DEL_CLUB = {
  publicada: ["pausada", "cerrada"],
  pausada: ["publicada", "cerrada"],
  cerrada: ["publicada"],
};

export const ETIQUETAS_TIPO_CONTRATO = {
  profesional: "Profesional",
  amateur: "Amateur",
  inferiores: "Inferiores",
  futbol_femenino: "Fútbol femenino",
};

/* Listas cerradas para los selects. Se guarda el texto tal cual (p. ej. "Extremo"). */
export const PROVINCIAS_ARGENTINA = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

export const POSICIONES_DE_JUEGO = [
  "Arquero",
  "Defensor central",
  "Lateral derecho",
  "Lateral izquierdo",
  "Volante central",
  "Volante interno",
  "Enganche",
  "Extremo",
  "Delantero centro",
];

export const PIERNAS_HABILES = ["Derecha", "Izquierda", "Ambas"];

/**
 * Opciones para un select, sumando el valor ya guardado si no está en la lista
 * (datos cargados antes de que el campo fuera un select).
 */
export function opcionesConValorActual(lista, valorActual) {
  return valorActual && !lista.includes(valorActual) ? [valorActual, ...lista] : lista;
}
