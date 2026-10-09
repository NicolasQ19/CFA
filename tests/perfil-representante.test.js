import test from "node:test";
import assert from "node:assert/strict";
import { validarPresentacionRepresentante, completitudRepresentante } from "../src/lib/perfil-representante.js";

test("la completitud ignora campos vacíos y no exige datos opcionales", () => {
  assert.equal(completitudRepresentante().porcentaje, 0);
  assert.equal(completitudRepresentante({ nombre_agencia: "  ", presentacion: "\n" }).completos, 0);
  const avance = completitudRepresentante({ nombre_agencia: "Agencia" });
  assert.equal(avance.completos, 1);
  assert.equal(avance.porcentaje, 13);
  assert.equal(avance.secciones.filter(s => !s.completo).length, 7);
});

test("teléfono y correo son alternativas de una única sección de contacto", () => {
  for (const contacto of [{ telefono: "123" }, { correo_contacto: "agencia@example.com" }, { telefono: "123", correo_contacto: "agencia@example.com" }]) {
    assert.equal(completitudRepresentante(contacto).completos, 1);
  }
});

test("un perfil completo llega a 100 y quitar la foto reduce el avance", () => {
  const perfil = { nombre_agencia: "Agencia", foto_url: "https://example.com/foto.png", presentacion: "Trayectoria", especializacion: "Juveniles", zona_trabajo: "Buenos Aires", telefono: "123", nacionalidad: "Argentina", sitio_web: "https://example.com" };
  assert.equal(completitudRepresentante(perfil).porcentaje, 100);
  assert.equal(completitudRepresentante({ ...perfil, foto_url: null }).porcentaje, 88);
  assert.equal(completitudRepresentante({ ...perfil, foto_url: "blob:nueva-foto" }).porcentaje, 100);
});

function formulario(valores = {}) {
  const datos = new FormData();
  for (const [campo, valor] of Object.entries(valores)) datos.set(campo, valor);
  return datos;
}

test("conserva compatibilidad con perfiles antiguos y permite limpiar los campos", () => {
  const vacios = { presentacion: null, especializacion: null, zona_trabajo: null };
  assert.deepEqual(validarPresentacionRepresentante(formulario()).datos, vacios);
  assert.deepEqual(validarPresentacionRepresentante(formulario({ presentacion: "  ", especializacion: "", zonaTrabajo: "\n" })).datos, vacios);
});

test("normaliza espacios y conserva saltos de línea en la presentación", () => {
  assert.deepEqual(validarPresentacionRepresentante(formulario({
    presentacion: "  Agencia deportiva.\nTrabajamos con clubes.  ",
    especializacion: "  Juveniles y cuerpo técnico  ", zonaTrabajo: "  Argentina y Uruguay  ",
  })).datos, {
    presentacion: "Agencia deportiva.\nTrabajamos con clubes.",
    especializacion: "Juveniles y cuerpo técnico", zona_trabajo: "Argentina y Uruguay",
  });
});

test("rechaza envíos que exceden los límites aunque omitan la validación del navegador", () => {
  for (const [campo, limite] of [["presentacion", 2000], ["especializacion", 300], ["zonaTrabajo", 300]]) {
    assert.ok(validarPresentacionRepresentante(formulario({ [campo]: "x".repeat(limite) })).datos);
    assert.ok(validarPresentacionRepresentante(formulario({ [campo]: "x".repeat(limite + 1) })).error);
  }
});
