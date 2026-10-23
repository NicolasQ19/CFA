import test from "node:test";
import assert from "node:assert/strict";
import { claveAviso, claveAlmacenLecturas, interpretarLecturas, estaLeido, marcarAvisoLeido, contarSinLeer, listarFilasNotificaciones } from "../src/lib/lectura-notificaciones.js";

const aviso = { id: "oferta-1", fecha: "2026-10-23T13:00:00Z", mensaje: "Fue publicada" };

test("abrir un aviso descuenta uno y volver a abrirlo no vuelve a descontar", () => {
  const avisos = [aviso, { ...aviso, id: "oferta-2" }];
  assert.equal(contarSinLeer(avisos, []), 2);
  const lecturas = marcarAvisoLeido(aviso, []);
  assert.equal(contarSinLeer(avisos, lecturas), 1);
  assert.equal(contarSinLeer(avisos, marcarAvisoLeido(aviso, lecturas)), 1);
  assert.equal(marcarAvisoLeido(aviso, lecturas).length, 1);
});

test("las lecturas serializadas sobreviven una recarga y la actualización automática", () => {
  const guardado = JSON.stringify(marcarAvisoLeido(aviso, []));
  const recuperadas = interpretarLecturas(guardado);
  assert.equal(contarSinLeer([{ ...aviso }], recuperadas), 0);
  assert.ok(estaLeido(aviso, recuperadas));
});

test("un nuevo cambio de estado vuelve a contar como no leído", () => {
  const lecturas = marcarAvisoLeido(aviso, []);
  assert.equal(contarSinLeer([{ ...aviso, fecha: "2026-10-23T14:00:00Z" }], lecturas), 1);
  assert.equal(contarSinLeer([{ ...aviso, mensaje: "Fue rechazada" }], lecturas), 1);
});

test("las lecturas se separan por cuenta y rol", () => {
  const claves = [claveAlmacenLecturas("club-1", "club"), claveAlmacenLecturas("club-2", "club"), claveAlmacenLecturas("club-1", "administrador")];
  assert.equal(new Set(claves).size, 3);
});

test("los avisos que ya desaparecieron no descuentan otros y cuentan los que están fuera de la primera vista", () => {
  const avisos = Array.from({ length: 12 }, (_, i) => ({ ...aviso, id: String(i) }));
  const lecturas = [claveAviso(aviso), ...avisos.slice(0, 8).map(claveAviso)];
  assert.equal(contarSinLeer(avisos, lecturas), 4);
  assert.equal(contarSinLeer([], lecturas), 0);
});

test("ignora lecturas dañadas sin romper la campana", () => {
  for (const texto of [null, "no es json", "{}", "null"]) assert.deepEqual(interpretarLecturas(texto), []);
  assert.deepEqual(interpretarLecturas('["clave", 123, null]'), ["clave"]);
});

test("el listado completo no se corta en la primera página y propaga los errores", async () => {
  const rangos = [];
  const filas = await listarFilasNotificaciones(() => ({ range: async (desde, hasta) => {
    rangos.push([desde, hasta]);
    return { data: Array.from({ length: desde === 0 ? 500 : 3 }, (_, i) => ({ id: desde + i })) };
  } }));
  assert.equal(filas.length, 503);
  assert.deepEqual(rangos, [[0, 499], [500, 999]]);
  await assert.rejects(listarFilasNotificaciones(() => ({ range: async () => ({ error: new Error("Sin conexión") }) })), /Sin conexión/);
});
