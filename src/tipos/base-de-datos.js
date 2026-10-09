/**
 * Forma de las tablas de Supabase, documentada a mano para reflejar
 * supabase/migrations/0001_esquema_inicial.sql.
 * Si el esquema cambia, actualizar este archivo junto con la migración.
 *
 * Los valores posibles de rol, puesto, estado y tipo de contrato son las
 * claves de las etiquetas definidas en src/tipos/dominio.js.
 */

/**
 * @typedef {Object} Usuario
 * @property {string} id
 * @property {"candidato" | "representante" | "club" | "administrador"} rol
 * @property {string} nombre_completo
 * @property {string} correo_electronico
 * @property {boolean} cuenta_activa
 * @property {string} creado_en
 */

/**
 * @typedef {Object} PerfilCandidato
 * @property {string | null} nombres
 * @property {string | null} apellidos
 * @property {string | null} fecha_nacimiento
 * @property {string} usuario_id
 * @property {string} puesto - clave de ETIQUETAS_PUESTO_PROFESIONAL
 * @property {string} provincia
 * @property {string | null} club_actual
 * @property {string | null} foto_url
 * @property {string[]} enlaces_video
 * @property {string | null} trayectoria
 * @property {string | null} formacion_academica
 * @property {boolean} perfil_visible
 *
 * Datos deportivos (solo cuando puesto = "jugador")
 * @property {string | null} posicion_juego
 * @property {string | null} pierna_habil
 * @property {number | null} altura_cm
 * @property {number | null} peso_kg
 *
 * Datos técnicos (cuerpo técnico / staff)
 * @property {string | null} titulo_o_matricula
 * @property {string | null} licencia
 * @property {number | null} anios_experiencia
 * @property {string | null} especialidad
 *
 * @property {string} actualizado_en
 */

/**
 * @typedef {Object} PerfilClub
 * @property {string} usuario_id
 * @property {string} nombre_club
 * @property {string | null} escudo_url
 * @property {string} provincia
 * @property {string} categoria
 * @property {string} actualizado_en
 */

/**
 * @typedef {Object} PerfilRepresentante
 * @property {string} usuario_id
 * @property {string | null} nombre_agencia
 * @property {string | null} presentacion
 * @property {string | null} especializacion
 * @property {string | null} zona_trabajo
 * @property {string} actualizado_en
 */

/**
 * @typedef {Object} CandidatoRepresentado
 * @property {string} representante_id
 * @property {string} candidato_id
 * @property {string} creado_en
 */

/**
 * @typedef {Object} OfertaLaboral
 * @property {string} id
 * @property {string} club_id
 * @property {string} puesto_buscado - clave de ETIQUETAS_PUESTO_PROFESIONAL
 * @property {string | null} posicion_juego
 * @property {string} categoria
 * @property {string} tipo_contrato - clave de ETIQUETAS_TIPO_CONTRATO
 * @property {string} provincia
 * @property {string} descripcion
 * @property {string} estado - clave de ETIQUETAS_ESTADO_OFERTA
 * @property {string} creada_en
 * @property {string} actualizada_en
 */

/**
 * @typedef {Object} Postulacion
 * @property {string} id
 * @property {string} oferta_id
 * @property {string} candidato_id
 * @property {string | null} postulado_por_representante_id
 * @property {string} estado - clave de ETIQUETAS_ESTADO_POSTULACION
 * @property {string} creada_en
 * @property {string} actualizada_en
 */

export {};
