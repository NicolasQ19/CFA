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

export const ETIQUETAS_TIPO_CONTRATO = {
  profesional: "Profesional",
  amateur: "Amateur",
  inferiores: "Inferiores",
  futbol_femenino: "Fútbol femenino",
};