import test from "node:test";
import assert from "node:assert/strict";
import { validarDatosOferta } from "../src/lib/editar-oferta.js";

function formulario(valores) {
  const form = new FormData();
  for (const [clave, valor] of Object.entries(valores)) {
    form.set(clave, valor);
  }
  return form;
}

test("valida correctamente la edición de oferta con campos válidos", () => {
  const resultado = validarDatosOferta(
    formulario({
      puestoBuscado: "jugador",
      posicionJuego: "Delantero centro",
      categoria: "Primera Nacional",
      tipoContrato: "profesional",
      provincia: "Buenos Aires",
      descripcion: "Se busca delantero centro con experiencia en la categoría.",
    }),
    "publicada",
  );

  assert.equal(resultado.error, undefined);
  assert.equal(resultado.datos.puesto_buscado, "jugador");
  assert.equal(resultado.datos.posicion_juego, "Delantero centro");
  assert.equal(resultado.datos.categoria, "Primera Nacional");
  assert.equal(resultado.datos.estado, undefined);
});

test("rechaza edición de oferta si la descripción o un campo obligatorio está vacío", () => {
  const resultado = validarDatosOferta(
    formulario({
      puestoBuscado: "jugador",
      categoria: "Primera Nacional",
      tipoContrato: "profesional",
      provincia: "Buenos Aires",
      descripcion: "   ",
    }),
  );

  assert.ok(resultado.error);
  assert.match(resultado.error, /obligatorios/);
});

test("elimina la posición de juego si el puesto cambia a cuerpo técnico", () => {
  const resultado = validarDatosOferta(
    formulario({
      puestoBuscado: "director_tecnico",
      posicionJuego: "Delantero centro",
      categoria: "Primera",
      tipoContrato: "profesional",
      provincia: "Córdoba",
      descripcion: "Nuevo cuerpo técnico para la temporada 2026.",
    }),
  );

  assert.equal(resultado.error, undefined);
  assert.equal(resultado.datos.puesto_buscado, "director_tecnico");
  assert.equal(resultado.datos.posicion_juego, null);
});

test("rechaza valores inválidos de puesto, tipo de contrato o provincia", () => {
  const base = {
    puestoBuscado: "jugador",
    categoria: "Federal A",
    tipoContrato: "profesional",
    provincia: "Santa Fe",
    descripcion: "Búsqueda abierta.",
  };

  assert.ok(validarDatosOferta(formulario({ ...base, puestoBuscado: "invalido" })).error);
  assert.ok(validarDatosOferta(formulario({ ...base, tipoContrato: "invalido" })).error);
  assert.ok(validarDatosOferta(formulario({ ...base, provincia: "Narnia" })).error);
});

test("una oferta rechazada vuelve a pendiente_moderacion al editarla (Diagrama 5.1 / CU-21)", () => {
  const resultado = validarDatosOferta(
    formulario({
      puestoBuscado: "preparador_fisico",
      categoria: "Primera",
      tipoContrato: "profesional",
      provincia: "Mendoza",
      descripcion: "Descripción corregida tras revisión.",
    }),
    "rechazada",
  );

  assert.equal(resultado.error, undefined);
  assert.equal(resultado.datos.estado, "pendiente_moderacion");
});
