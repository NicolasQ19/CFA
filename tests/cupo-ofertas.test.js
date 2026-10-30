import test from "node:test";
import assert from "node:assert/strict";
import {
  contarOfertasActivas,
  contarPostulacionesDelMes,
  obtenerCupoOfertasDelClub,
  obtenerCupoPostulaciones,
  obtenerPlanDelUsuario,
} from "../src/lib/cupo-suscripciones.js";

function clienteFalso(respuestasPorTabla) {
  const consultas = [];
  return {
    consultas,
    from(tabla) {
      const pasos = [["from", tabla]];
      consultas.push(pasos);
      const resultado = respuestasPorTabla[tabla];
      const consulta = {};
      for (const metodo of ["select", "eq", "in", "is", "gte", "order", "range"]) {
        consulta[metodo] = (...args) => { pasos.push([metodo, ...args]); return consulta; };
      }
      consulta.maybeSingle = () => Promise.resolve(resultado);
      consulta.then = (resolver, rechazar) => Promise.resolve(resultado).then(resolver, rechazar);
      return consulta;
    },
  };
}

const vigente = { data: { plan: "pago", vence_en: "2099-01-01T00:00:00Z" } };
const sinSuscripcion = { data: null };

test("obtenerPlanDelUsuario devuelve gratuito ante suscripción ausente, vencida o error de lectura", async () => {
  assert.equal(await obtenerPlanDelUsuario(clienteFalso({ suscripciones: sinSuscripcion }), "club-1"), "gratuito");
  assert.equal(await obtenerPlanDelUsuario(clienteFalso({ suscripciones: { data: { plan: "pago", vence_en: "2020-01-01T00:00:00Z" } } }), "club-1"), "gratuito");
  assert.equal(await obtenerPlanDelUsuario(clienteFalso({ suscripciones: { error: new Error("RLS") } }), "club-1"), "gratuito");
  assert.equal(await obtenerPlanDelUsuario(clienteFalso({ suscripciones: vigente }), "club-1"), "pago");
});

test("contarOfertasActivas solo cuenta los estados que ocupan cupo y avisa si falla el conteo", async () => {
  const cliente = clienteFalso({ ofertas_laborales: { count: 2 } });
  assert.deepEqual(await contarOfertasActivas(cliente, "club-1"), { total: 2 });

  const pasos = JSON.stringify(cliente.consultas[0]);
  assert.ok(pasos.includes(JSON.stringify(["eq", "club_id", "club-1"])));
  assert.ok(pasos.includes(JSON.stringify(["in", "estado", ["pendiente_moderacion", "publicada", "pausada"]])));

  const sinConteo = await contarOfertasActivas(clienteFalso({ ofertas_laborales: { count: null } }), "club-1");
  assert.match(sinConteo.fallo, /No se pudo verificar/);
  const conError = await contarOfertasActivas(clienteFalso({ ofertas_laborales: { error: new Error("timeout") } }), "club-1");
  assert.match(conError.fallo, /No se pudo verificar/);
});

test("obtenerCupoOfertasDelClub bloquea al club gratuito en el límite y libera al plan pago", async () => {
  const enElLimite = await obtenerCupoOfertasDelClub(
    clienteFalso({ suscripciones: sinSuscripcion, ofertas_laborales: { count: 3 } }), "club-1");
  assert.equal(enElLimite.permitido, false);
  assert.equal(enElLimite.usadas, 3);
  assert.equal(enElLimite.plan, "gratuito");
  assert.match(enElLimite.error, /Club Base permite 3 ofertas activas/);

  const conCupo = await obtenerCupoOfertasDelClub(
    clienteFalso({ suscripciones: sinSuscripcion, ofertas_laborales: { count: 1 } }), "club-1");
  assert.equal(conCupo.permitido, true);
  assert.equal(conCupo.restantes, 2);

  const pago = await obtenerCupoOfertasDelClub(
    clienteFalso({ suscripciones: vigente, ofertas_laborales: { count: 40 } }), "club-1");
  assert.equal(pago.permitido, true);
  assert.equal(pago.limite, null);
});

test("un conteo fallido no deja publicar en lugar de asumir cupo disponible", async () => {
  const resultado = await obtenerCupoOfertasDelClub(
    clienteFalso({ suscripciones: sinSuscripcion, ofertas_laborales: { count: null } }), "club-1");
  assert.match(resultado.fallo, /No se pudo verificar/);
  assert.equal(resultado.permitido, undefined);
});

const AHORA = new Date("2026-11-20T12:00:00Z");

test("contarPostulacionesDelMes cuenta por quien envía y desde el día 1 del mes", async () => {
  const candidato = clienteFalso({ postulaciones: { count: 2 } });
  assert.deepEqual(await contarPostulacionesDelMes(candidato, "candidato-1", "candidato", AHORA), { total: 2 });
  const pasosCandidato = JSON.stringify(candidato.consultas[0]);
  assert.ok(pasosCandidato.includes(JSON.stringify(["eq", "candidato_id", "candidato-1"])));
  assert.ok(pasosCandidato.includes(JSON.stringify(["gte", "creada_en", "2026-11-01T00:00:00.000Z"])));
  // Las postulaciones enviadas por un representante no consumen el cupo del candidato.
  assert.ok(pasosCandidato.includes(JSON.stringify(["is", "postulado_por_representante_id", null])));

  const representante = clienteFalso({ postulaciones: { count: 5 } });
  await contarPostulacionesDelMes(representante, "rep-1", "representante", AHORA);
  assert.ok(JSON.stringify(representante.consultas[0]).includes(JSON.stringify(["eq", "postulado_por_representante_id", "rep-1"])));
  assert.ok(!JSON.stringify(representante.consultas[0]).includes('"is"'));

  const sinConteo = await contarPostulacionesDelMes(clienteFalso({ postulaciones: { count: null } }), "c1", "candidato", AHORA);
  assert.match(sinConteo.fallo, /No se pudo verificar/);
});

test("obtenerCupoPostulaciones corta al candidato en 3 y al representante en 6, y libera al plan pago", async () => {
  const candidatoEnLimite = await obtenerCupoPostulaciones(
    clienteFalso({ suscripciones: sinSuscripcion, postulaciones: { count: 3 } }), "c1", "candidato", AHORA);
  assert.equal(candidatoEnLimite.permitido, false);
  assert.equal(candidatoEnLimite.limitePlan, true);
  assert.match(candidatoEnLimite.error, /Candidato Base permite 3 postulaciones por mes/);

  const representanteConCupo = await obtenerCupoPostulaciones(
    clienteFalso({ suscripciones: sinSuscripcion, postulaciones: { count: 3 } }), "r1", "representante", AHORA);
  assert.equal(representanteConCupo.permitido, true);
  assert.equal(representanteConCupo.restantes, 3);

  const representanteEnLimite = await obtenerCupoPostulaciones(
    clienteFalso({ suscripciones: sinSuscripcion, postulaciones: { count: 6 } }), "r1", "representante", AHORA);
  assert.equal(representanteEnLimite.permitido, false);

  const pago = await obtenerCupoPostulaciones(
    clienteFalso({ suscripciones: vigente, postulaciones: { count: 80 } }), "c1", "candidato", AHORA);
  assert.equal(pago.permitido, true);
  assert.equal(pago.limite, null);
});

test("un conteo mensual fallido no deja postularse", async () => {
  const resultado = await obtenerCupoPostulaciones(
    clienteFalso({ suscripciones: sinSuscripcion, postulaciones: { count: null } }), "c1", "candidato", AHORA);
  assert.match(resultado.fallo, /No se pudo verificar/);
  assert.equal(resultado.permitido, undefined);
});
