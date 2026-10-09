/**
 * Esquema de tablas de Supabase para referencia de base de datos.
 * Refleja supabase/migrations/0001_esquema_inicial.sql.
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
 * @property {string} puesto
 * @property {string} provincia
 * @property {string | null} club_actual
 * @property {string | null} presentacion
 * @property {"disponible" | "escucho_ofertas" | "no_disponible" | null} disponibilidad
 * @property {"con_club" | "sin_club" | null} situacion_club
 * @property {string | null} incorporacion_desde
 * @property {boolean | null} dispuesto_mudarse
 * @property {{club: string, categoria: string, temporada: string, descripcion: string}[]} experiencias
 * @property {string | null} cv_ruta
 * @property {string | null} foto_url
 * @property {string[]} enlaces_video
 * @property {string | null} trayectoria
 * @property {string | null} formacion_academica
 * @property {boolean} perfil_visible
 * @property {string | null} posicion_juego
 * @property {string | null} pierna_habil
 * @property {number | null} altura_cm
 * @property {number | null} peso_kg
 * @property {string | null} titulo_o_matricula
 * @property {string | null} licencia
 * @property {number | null} anios_experiencia
 * @property {string | null} especialidad
 * @property {string} actualizado_en
 */

/**
 * @typedef {Object} PerfilClub
 * @property {string} usuario_id
 * @property {string} nombre_club
 * @property {string | null} localidad
 * @property {string | null} descripcion
 * @property {string | null} instalaciones
 * @property {string | null} sitio_web
 * @property {string | null} instagram
 * @property {string | null} facebook
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
 * @property {string} puesto_buscado
 * @property {string | null} posicion_juego
 * @property {string} categoria
 * @property {string} tipo_contrato
 * @property {string} provincia
 * @property {string} descripcion
 * @property {string} estado
 * @property {string} creada_en
 * @property {string} actualizada_en
 */

/**
 * @typedef {Object} Postulacion
 * @property {string} id
 * @property {string} oferta_id
 * @property {string} candidato_id
 * @property {string | null} postulado_por_representante_id
 * @property {string} estado
 * @property {string} creada_en
 * @property {string} actualizada_en
 */
/**
 * @typedef {Object} SeguimientoClub
 * @property {string} postulacion_id
 * @property {string} club_id
 * @property {"recibido" | "evaluacion" | "contactado" | "seleccionado" | "descartado"} etapa
 * @property {string} notas
 * @property {string} actualizado_en
 */
