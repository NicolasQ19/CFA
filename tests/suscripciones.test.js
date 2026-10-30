import test from "node:test";
import assert from "node:assert/strict";
import {
  LIMITES_PLAN_GRATUITO,
  inicioDelMes,
  normalizarPlan,
  obtenerLimites,
  obtenerPlanVigente,
  puedePostularse,
  puedePublicarOferta,
  calcularVencimiento,
  describirPlan,
  validarCambioDePlan,
} from "../src/lib/suscripciones.js";

const AHORA = new Date("2026-11-15T10:00:00Z");

test("obtenerPlanVigente degrada a gratuito las suscripciones ausentes, vencidas o inválidas", () => {
  assert.equal(obtenerPlanVigente(null, AHORA), "gratuito");
  assert.equal(obtenerPlanVigente({ plan: "gratuito" }, AHORA), "gratuito");
  assert.equal(obtenerPlanVigente({ plan: "pago", vence_en: "2026-11-01T00:00:00Z" }, AHORA), "gratuito");
  assert.equal(obtenerPlanVigente({ plan: "pago", vence_en: "sin fecha" }, AHORA), "gratuito");
  assert.equal(obtenerPlanVigente({ plan: "club_pro" }, AHORA), "gratuito");

  assert.equal(obtenerPlanVigente({ plan: "pago", vence_en: "2026-12-01T00:00:00Z" }, AHORA), "pago");
  assert.equal(obtenerPlanVigente({ plan: "pago", vence_en: null }, AHORA), "pago");
});

test("normalizarPlan y obtenerLimites derivan los cupos de la combinación rol + plan", () => {
  assert.equal(normalizarPlan("pago"), "pago");
  assert.equal(normalizarPlan("candidato_pro"), "gratuito");

  assert.equal(obtenerLimites("club", "gratuito").ofertasActivas, LIMITES_PLAN_GRATUITO.club.ofertasActivas);
  assert.equal(obtenerLimites("candidato", "gratuito").postulacionesMensuales, 3);
  assert.equal(obtenerLimites("representante", "gratuito").postulacionesMensuales, 6);

  // Un rol no tiene los cupos de otro: el club no arrastra cupo mensual de postulaciones.
  assert.equal(obtenerLimites("club", "gratuito").postulacionesMensuales, null);
  assert.equal(obtenerLimites("candidato", "gratuito").ofertasActivas, null);

  for (const rol of ["club", "candidato", "representante"]) {
    assert.deepEqual(obtenerLimites(rol, "pago"), { ofertasActivas: null, postulacionesMensuales: null });
  }

  assert.deepEqual(obtenerLimites("administrador", "gratuito"), { ofertasActivas: null, postulacionesMensuales: null });
});

test("puedePublicarOferta corta al club gratuito en su tercera oferta activa y no limita al plan pago", () => {
  assert.deepEqual(puedePublicarOferta({ plan: "gratuito", ofertasActivas: 0 }), {
    permitido: true, limite: 3, restantes: 3, error: null, limitePlan: false,
  });
  assert.equal(puedePublicarOferta({ plan: "gratuito", ofertasActivas: 2 }).restantes, 1);

  const alLimite = puedePublicarOferta({ plan: "gratuito", ofertasActivas: 3 });
  assert.equal(alLimite.permitido, false);
  assert.equal(alLimite.restantes, 0);
  assert.match(alLimite.error, /Club Base permite 3 ofertas activas/);
  assert.match(alLimite.error, /Club Pro/);
  // El panel usa esta marca para ofrecer el enlace a /planes junto al error.
  assert.equal(alLimite.limitePlan, true);
  assert.equal(puedePostularse({ rol: "candidato", plan: "gratuito", postulacionesDelMes: 3 }).limitePlan, true);
  assert.equal(puedePublicarOferta({ plan: "pago", ofertasActivas: 9 }).limitePlan, false);

  // Un club que quedó por encima del cupo al vencer su plan no pierde ofertas, pero no crea nuevas.
  assert.equal(puedePublicarOferta({ plan: "gratuito", ofertasActivas: 8 }).permitido, false);

  assert.equal(puedePublicarOferta({ plan: "pago", ofertasActivas: 50 }).permitido, true);
});

test("puedePostularse aplica el cupo mensual de candidato y representante por separado", () => {
  assert.equal(puedePostularse({ rol: "candidato", plan: "gratuito", postulacionesDelMes: 2 }).restantes, 1);

  const candidatoAlLimite = puedePostularse({ rol: "candidato", plan: "gratuito", postulacionesDelMes: 3 });
  assert.equal(candidatoAlLimite.permitido, false);
  assert.match(candidatoAlLimite.error, /Candidato Base permite 3 postulaciones por mes/);

  assert.equal(puedePostularse({ rol: "representante", plan: "gratuito", postulacionesDelMes: 3 }).permitido, true);
  const representanteAlLimite = puedePostularse({ rol: "representante", plan: "gratuito", postulacionesDelMes: 6 });
  assert.equal(representanteAlLimite.permitido, false);
  assert.match(representanteAlLimite.error, /para tu cartera/);

  assert.equal(puedePostularse({ rol: "candidato", plan: "pago", postulacionesDelMes: 99 }).permitido, true);
  assert.equal(puedePostularse({ rol: "representante", plan: "pago", postulacionesDelMes: 99 }).permitido, true);
});

test("los contadores inválidos no amplían el cupo y la ventana mensual arranca el día 1", () => {
  for (const valor of [undefined, null, -5, "tres", Number.NaN]) {
    assert.equal(puedePostularse({ rol: "candidato", plan: "gratuito", postulacionesDelMes: valor }).restantes, 3);
  }

  assert.equal(inicioDelMes(AHORA), "2026-11-01T00:00:00.000Z");
  assert.equal(inicioDelMes(new Date("2026-01-01T00:00:00Z")), "2026-01-01T00:00:00.000Z");
});

test("validarCambioDePlan protege el alta que registra el administrador", () => {
  assert.deepEqual(validarCambioDePlan({ rol: "club", plan: "pago", meses: 6 }).datos, { plan: "pago", meses: 6 });
  assert.deepEqual(validarCambioDePlan({ rol: "candidato", plan: "gratuito" }).datos, { plan: "gratuito", meses: 0 });

  assert.match(validarCambioDePlan({ rol: "club", plan: "pago", meses: 6, esPropia: true }).error, /tu propio plan/);
  assert.match(validarCambioDePlan({ rol: "administrador", plan: "pago", meses: 1 }).error, /no tiene planes/);
  assert.match(validarCambioDePlan({ rol: "club", plan: "vip", meses: 1 }).error, /plan válido/);
  assert.match(validarCambioDePlan({ rol: "club", plan: "pago", meses: 99 }).error, /duración válida/);
});

test("calcularVencimiento y describirPlan alimentan el listado de administración", () => {
  assert.equal(calcularVencimiento(3, AHORA), "2027-02-15T10:00:00.000Z");

  const pago = describirPlan("club", { plan: "pago", vence_en: "2027-01-01T00:00:00Z" }, AHORA);
  assert.deepEqual(pago, { plan: "pago", nombre: "Club Pro", vencimiento: "2027-01-01T00:00:00Z" });

  const vencido = describirPlan("club", { plan: "pago", vence_en: "2026-01-01T00:00:00Z" }, AHORA);
  assert.deepEqual(vencido, { plan: "gratuito", nombre: "Club Base", vencimiento: null });

  assert.deepEqual(describirPlan("candidato", null, AHORA), { plan: "gratuito", nombre: "Candidato Base", vencimiento: null });
  assert.equal(describirPlan("administrador", null, AHORA).nombre, "Sin plan");
});

