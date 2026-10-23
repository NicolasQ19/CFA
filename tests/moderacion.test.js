import test from "node:test";
import assert from "node:assert/strict";
import { TRANSICIONES_OFERTA_DEL_ADMIN as admin, TRANSICIONES_OFERTA_DEL_CLUB as club, ETIQUETAS_ESTADO_OFERTA as estados } from "../src/tipos/dominio.js";

test("administración puede pausar y rechazar ofertas publicadas y reanudar las pausadas", () => {
  assert.ok(admin.publicada.includes("pausada"));
  assert.ok(admin.publicada.includes("rechazada"));
  assert.ok(admin.pausada.includes("publicada"));
  assert.ok(admin.pausada.includes("rechazada"));
  assert.ok(admin.rechazada.includes("publicada"));
});

test("las transiciones cubren los estados y conservan la moderación previa", () => {
  assert.deepEqual(Object.keys(admin).sort(), Object.keys(estados).sort());
  assert.deepEqual(admin.pendiente_moderacion, ["publicada", "rechazada"]);
  for (const [origen, destinos] of Object.entries(admin)) {
    assert.ok(!destinos.includes(origen));
    assert.ok(destinos.every(destino => Object.hasOwn(estados, destino)));
  }
  assert.equal(club.rechazada, undefined);
  assert.equal(club.pendiente_moderacion, undefined);
});
