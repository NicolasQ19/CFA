import type {
  EstadoOferta,
  EstadoPostulacion,
  PuestoProfesional,
  RolUsuario,
  TipoContrato,
} from "@/tipos/dominio";

/**
 * Tipos de las tablas de Supabase, escritos a mano para reflejar
 * supabase/migrations/0001_esquema_inicial.sql.
 * Si el esquema cambia, actualizar este archivo junto con la migración.
 */

export interface Usuario {
  id: string;
  rol: RolUsuario;
  nombre_completo: string;
  correo_electronico: string;
  cuenta_activa: boolean;
  creado_en: string;
}

export interface PerfilCandidato {
  usuario_id: string;
  puesto: PuestoProfesional;
  provincia: string;
  club_actual: string | null;
  foto_url: string | null;
  enlaces_video: string[];
  trayectoria: string | null;
  formacion_academica: string | null;
  perfil_visible: boolean;

  // Datos deportivos (solo cuando puesto = "jugador")
  posicion_juego: string | null;
  pierna_habil: string | null;
  altura_cm: number | null;
  peso_kg: number | null;

  // Datos técnicos (cuerpo técnico / staff)
  titulo_o_matricula: string | null;
  licencia: string | null;
  anios_experiencia: number | null;
  especialidad: string | null;

  actualizado_en: string;
}

export interface PerfilClub {
  usuario_id: string;
  nombre_club: string;
  escudo_url: string | null;
  provincia: string;
  categoria: string;
  actualizado_en: string;
}

export interface PerfilRepresentante {
  usuario_id: string;
  nombre_agencia: string | null;
  actualizado_en: string;
}

export interface CandidatoRepresentado {
  representante_id: string;
  candidato_id: string;
  creado_en: string;
}

export interface OfertaLaboral {
  id: string;
  club_id: string;
  puesto_buscado: PuestoProfesional;
  posicion_juego: string | null;
  categoria: string;
  tipo_contrato: TipoContrato;
  provincia: string;
  descripcion: string;
  estado: EstadoOferta;
  creada_en: string;
  actualizada_en: string;
}

export interface Postulacion {
  id: string;
  oferta_id: string;
  candidato_id: string;
  postulado_por_representante_id: string | null;
  estado: EstadoPostulacion;
  creada_en: string;
  actualizada_en: string;
}

/** Forma mínima del tipo genérico que espera @supabase/ssr para tipar el cliente. */
export interface BaseDeDatos {
  public: {
    Tables: {
      usuarios: { Row: Usuario; Insert: Partial<Usuario> & Pick<Usuario, "id" | "rol" | "nombre_completo" | "correo_electronico">; Update: Partial<Usuario> };
      perfiles_candidato: { Row: PerfilCandidato; Insert: Partial<PerfilCandidato> & Pick<PerfilCandidato, "usuario_id" | "puesto" | "provincia">; Update: Partial<PerfilCandidato> };
      perfiles_club: { Row: PerfilClub; Insert: Partial<PerfilClub> & Pick<PerfilClub, "usuario_id" | "nombre_club" | "provincia" | "categoria">; Update: Partial<PerfilClub> };
      perfiles_representante: { Row: PerfilRepresentante; Insert: Partial<PerfilRepresentante> & Pick<PerfilRepresentante, "usuario_id">; Update: Partial<PerfilRepresentante> };
      candidatos_representados: { Row: CandidatoRepresentado; Insert: CandidatoRepresentado; Update: Partial<CandidatoRepresentado> };
      ofertas_laborales: { Row: OfertaLaboral; Insert: Partial<OfertaLaboral> & Pick<OfertaLaboral, "club_id" | "puesto_buscado" | "categoria" | "tipo_contrato" | "provincia" | "descripcion">; Update: Partial<OfertaLaboral> };
      postulaciones: { Row: Postulacion; Insert: Partial<Postulacion> & Pick<Postulacion, "oferta_id" | "candidato_id">; Update: Partial<Postulacion> };
    };
  };
}
