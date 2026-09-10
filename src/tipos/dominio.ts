/**
 * Vocabulario del dominio de CFA (Contrataciones de Fútbol Argentino).
 * Estos tipos y etiquetas reflejan literalmente el lenguaje del BRD para que
 * el código se lea igual que los requerimientos funcionales.
 */

export type RolUsuario = "candidato" | "representante" | "club" | "administrador";

export const ETIQUETAS_ROL_USUARIO: Record<RolUsuario, string> = {
  candidato: "Candidato",
  representante: "Representante",
  club: "Club / Ofertante",
  administrador: "Administrador",
};

export type PuestoProfesional =
  | "jugador"
  | "director_tecnico"
  | "preparador_fisico"
  | "kinesiologo"
  | "analista_deportivo"
  | "coordinador_deportivo"
  | "medico"
  | "utilero"
  | "ojeador_scout"
  | "otro";

export const ETIQUETAS_PUESTO_PROFESIONAL: Record<PuestoProfesional, string> = {
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

/** RF-06: el puesto "jugador" carga datos deportivos; el resto carga datos técnicos (RF-07). */
export function esPuestoDeCuerpoTecnico(puesto: PuestoProfesional): boolean {
  return puesto !== "jugador";
}

export type EstadoPostulacion =
  | "postulado"
  | "visto"
  | "preseleccionado"
  | "rechazado"
  | "oferta_cerrada";

export const ETIQUETAS_ESTADO_POSTULACION: Record<EstadoPostulacion, string> = {
  postulado: "Postulado",
  visto: "Visto",
  preseleccionado: "Preseleccionado",
  rechazado: "Rechazado",
  oferta_cerrada: "Oferta cerrada",
};

export type EstadoOferta =
  | "pendiente_moderacion"
  | "publicada"
  | "pausada"
  | "cerrada"
  | "rechazada";

export const ETIQUETAS_ESTADO_OFERTA: Record<EstadoOferta, string> = {
  pendiente_moderacion: "Pendiente de moderación",
  publicada: "Publicada",
  pausada: "Pausada",
  cerrada: "Cerrada",
  rechazada: "Rechazada",
};

export type TipoContrato = "profesional" | "amateur" | "inferiores" | "futbol_femenino";

export const ETIQUETAS_TIPO_CONTRATO: Record<TipoContrato, string> = {
  profesional: "Profesional",
  amateur: "Amateur",
  inferiores: "Inferiores",
  futbol_femenino: "Fútbol femenino",
};
