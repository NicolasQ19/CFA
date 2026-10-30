/**
 * Planes de suscripción de CFA.
 *
 * Hay un solo valor de plan por usuario (`gratuito` o `pago`); los límites concretos
 * salen de la combinación (rol, plan). Así no puede existir un candidato con plan de
 * club, y cambiar un cupo es modificar una constante de este archivo.
 *
 * El plan pago no tiene límites: `null` significa "sin tope".
 */

export const PLANES = ["gratuito", "pago"];

export const ETIQUETAS_PLAN = {
  gratuito: "Base",
  pago: "Pro",
};

export const NOMBRES_PLAN_POR_ROL = {
  club: { gratuito: "Club Base", pago: "Club Pro" },
  candidato: { gratuito: "Candidato Base", pago: "Candidato Pro" },
  representante: { gratuito: "Representante Base", pago: "Representante Pro" },
};

/** Cupos del plan gratuito. El plan pago los deja sin tope. */
export const LIMITES_PLAN_GRATUITO = {
  club: { ofertasActivas: 3 },
  candidato: { postulacionesMensuales: 3 },
  representante: { postulacionesMensuales: 6 },
};

/** Estados en los que una oferta sigue ocupando cupo del plan del club. */
export const ESTADOS_OFERTA_QUE_OCUPAN_CUPO = ["pendiente_moderacion", "publicada", "pausada"];

/** Qué incluye cada plan, para la comparación de /planes. */
export const BENEFICIOS_PLAN = {
  club: {
    gratuito: [
      "Hasta 3 ofertas activas a la vez",
      "Moderación de ofertas y gestión de postulantes",
      "Perfil institucional público",
    ],
    pago: [
      "Ofertas activas sin límite",
      "Moderación de ofertas y gestión de postulantes",
      "Perfil institucional público",
    ],
  },
  candidato: {
    gratuito: [
      "Hasta 3 postulaciones por mes",
      "Perfil profesional completo con currículum y videos",
      "Seguimiento del estado de cada postulación",
    ],
    pago: [
      "Postulaciones sin límite",
      "Perfil profesional completo con currículum y videos",
      "Seguimiento del estado de cada postulación",
    ],
  },
  representante: {
    gratuito: [
      "Hasta 6 postulaciones por mes para tu cartera",
      "Representados sin límite",
      "Seguimiento de la cartera por estado",
    ],
    pago: [
      "Postulaciones sin límite para tu cartera",
      "Representados sin límite",
      "Seguimiento de la cartera por estado",
    ],
  },
};

export const ROLES_CON_PLAN = Object.keys(BENEFICIOS_PLAN);

const SIN_LIMITES = { ofertasActivas: null, postulacionesMensuales: null };

/** Normaliza cualquier valor desconocido a `gratuito`: ante la duda, se aplica el cupo. */
export function normalizarPlan(plan) {
  return PLANES.includes(plan) ? plan : "gratuito";
}

/**
 * Plan efectivo de una suscripción, replicando `public.plan_vigente` de la base.
 * Una suscripción paga vencida vale como gratuita.
 */
export function obtenerPlanVigente(suscripcion, ahora = new Date()) {
  if (normalizarPlan(suscripcion?.plan) !== "pago") return "gratuito";
  if (!suscripcion.vence_en) return "pago";

  const vencimiento = Date.parse(suscripcion.vence_en);
  if (Number.isNaN(vencimiento)) return "gratuito";

  return vencimiento > ahora.getTime() ? "pago" : "gratuito";
}

/** Cupos aplicables a un usuario según su rol y su plan vigente. */
export function obtenerLimites(rol, plan) {
  if (normalizarPlan(plan) === "pago") return { ...SIN_LIMITES };
  return { ...SIN_LIMITES, ...(LIMITES_PLAN_GRATUITO[rol] ?? {}) };
}

function resultadoPermitido() {
  return { permitido: true, limite: null, restantes: null, error: null, limitePlan: false };
}

/**
 * ¿El club puede publicar una oferta más?
 * `ofertasActivas` cuenta las que ocupan cupo: pendientes de moderación, publicadas y pausadas.
 */
export function puedePublicarOferta({ plan, ofertasActivas = 0 }) {
  const { ofertasActivas: limite } = obtenerLimites("club", plan);
  if (limite === null) return resultadoPermitido();

  const usadas = Math.max(0, Number(ofertasActivas) || 0);
  const restantes = Math.max(0, limite - usadas);

  if (usadas >= limite) {
    return {
      permitido: false,
      limite,
      restantes: 0,
      limitePlan: true,
      error: `Tu plan ${NOMBRES_PLAN_POR_ROL.club.gratuito} permite ${limite} ofertas activas a la vez. Cerrá una búsqueda o pasate a ${NOMBRES_PLAN_POR_ROL.club.pago} para publicar sin límite.`,
    };
  }

  return { permitido: true, limite, restantes, error: null, limitePlan: false };
}

/**
 * ¿El candidato o el representante pueden enviar una postulación más este mes?
 * Se cuenta por envío: cancelar una postulación no devuelve el cupo del mes.
 */
export function puedePostularse({ rol, plan, postulacionesDelMes = 0 }) {
  const { postulacionesMensuales: limite } = obtenerLimites(rol, plan);
  if (limite === null) return resultadoPermitido();

  const usadas = Math.max(0, Number(postulacionesDelMes) || 0);
  const restantes = Math.max(0, limite - usadas);
  const nombres = NOMBRES_PLAN_POR_ROL[rol];

  if (usadas >= limite) {
    return {
      permitido: false,
      limite,
      restantes: 0,
      limitePlan: true,
      error: rol === "representante"
        ? `Tu plan ${nombres.gratuito} permite ${limite} postulaciones por mes para tu cartera. Pasate a ${nombres.pago} para postular sin límite.`
        : `Tu plan ${nombres.gratuito} permite ${limite} postulaciones por mes. Pasate a ${nombres.pago} para postularte sin límite.`,
    };
  }

  return { permitido: true, limite, restantes, error: null, limitePlan: false };
}

/** Inicio del mes corriente en UTC: define la ventana que cuentan los cupos mensuales. */
export function inicioDelMes(ahora = new Date()) {
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString();
}

export const MESES_SUSCRIPCION = [1, 3, 6, 12];

/** Valida el alta o la baja que un administrador aplica sobre la cuenta de otro usuario. */
export function validarCambioDePlan({ rol, plan, meses = 1, esPropia = false }) {
  if (esPropia) {
    return { error: "No podés cambiar tu propio plan desde la administración." };
  }

  if (!ROLES_CON_PLAN.includes(rol)) {
    return { error: "Esta cuenta no tiene planes disponibles." };
  }

  if (!PLANES.includes(plan)) {
    return { error: "Elegí un plan válido." };
  }

  if (plan === "gratuito") {
    return { datos: { plan: "gratuito", meses: 0 } };
  }

  const duracion = Number(meses);
  if (!MESES_SUSCRIPCION.includes(duracion)) {
    return { error: "Elegí una duración válida para el plan Pro." };
  }

  return { datos: { plan: "pago", meses: duracion } };
}

/** Fecha de vencimiento a partir de hoy, para el alta que registra el administrador. */
export function calcularVencimiento(meses, ahora = new Date()) {
  const vencimiento = new Date(ahora.getTime());
  vencimiento.setUTCMonth(vencimiento.getUTCMonth() + Number(meses));
  return vencimiento.toISOString();
}

/** Texto corto del plan de una cuenta, para los listados de administración. */
export function describirPlan(rol, suscripcion, ahora = new Date()) {
  const plan = obtenerPlanVigente(suscripcion, ahora);
  const nombres = NOMBRES_PLAN_POR_ROL[rol];
  if (!nombres) return { plan, nombre: "Sin plan", vencimiento: null };

  return {
    plan,
    nombre: nombres[plan],
    vencimiento: plan === "pago" ? (suscripcion?.vence_en ?? null) : null,
  };
}

