import test from "node:test";
import assert from "node:assert/strict";
import { puestoCompatible, filtrarCandidatosParaOferta, edadCandidato, validarDatosPersonalesRepresentado } from "../src/lib/postulacion-cartera.js";
import { ETIQUETAS_PUESTO_PROFESIONAL } from "../src/tipos/dominio.js";

test("cada puesto solo admite candidatos del mismo puesto, sin agrupar al cuerpo técnico", () => {
  const puestos = Object.keys(ETIQUETAS_PUESTO_PROFESIONAL);
  for (const candidato of puestos) for (const oferta of puestos) {
    assert.equal(puestoCompatible(candidato, oferta), candidato === oferta);
  }
  assert.equal(puestoCompatible(undefined, undefined), false);
  assert.equal(puestoCompatible("inventado", "inventado"), false);
});

const cartera = [
  { candidato_id: "1", nombre: "José Pérez", perfil: { puesto: "director_tecnico" } },
  { candidato_id: "2", nombre: "Josefina", perfil: { puesto: "jugador" } },
  { candidato_id: "3", usuario: { nombre_completo: "Ana López" }, perfil: { puesto: "director_tecnico" } },
  { candidato_id: "4", nombre: "Sin perfil" },
];

test("calcula la edad con cumpleaños y rechaza fechas imposibles o futuras", () => {
  const hoy = new Date(2026, 9, 8);
  assert.equal(edadCandidato("2000-10-08", hoy), 26);
  assert.equal(edadCandidato("2000-10-09", hoy), 25);
  assert.equal(edadCandidato("2001-02-29", hoy), null);
  assert.equal(edadCandidato("2027-01-01", hoy), null);
  assert.equal(edadCandidato(null, hoy), null);
});

const conDatos = [
  { candidato_id: "a", nombre: "Álvaro De Paul", perfil: { puesto: "jugador", nombres: "Álvaro", apellidos: "De Paul", fecha_nacimiento: "2000-10-09", provincia: "Córdoba" } },
  { candidato_id: "b", nombre: "Bruno Álvarez", perfil: { puesto: "jugador", nombres: "Bruno", apellidos: "Álvarez", fecha_nacimiento: "2005-01-01", provincia: "Buenos Aires" } },
  { candidato_id: "c", nombre: "Carlos", perfil: { puesto: "jugador" } },
];

test("ordena por nombre, apellido y edad; deja datos desconocidos al final", () => {
  const ids = opciones => filtrarCandidatosParaOferta(conDatos, "jugador", [], "", opciones, new Date(2026, 9, 8)).map(c => c.candidato_id);
  assert.deepEqual(ids({ orden: "nombre_desc" }), ["c", "b", "a"]);
  assert.deepEqual(ids({ orden: "apellido_asc" }), ["b", "a", "c"]);
  assert.deepEqual(ids({ orden: "apellido_desc" }), ["a", "b", "c"]);
  assert.deepEqual(ids({ orden: "edad_asc" }), ["b", "a", "c"]);
  assert.deepEqual(ids({ orden: "edad_desc" }), ["a", "b", "c"]);
  assert.equal(conDatos[0].candidato_id, "a");
});

test("combina rango inclusivo, provincia y apellido compuesto sin inventar datos", () => {
  const hoy = new Date(2026, 9, 8);
  assert.deepEqual(filtrarCandidatosParaOferta(conDatos, "jugador", [], "de paul", { buscarPor: "apellido", provincia: "Córdoba", edadMinima: 25, edadMaxima: 25 }, hoy).map(c => c.candidato_id), ["a"]);
  assert.deepEqual(filtrarCandidatosParaOferta(conDatos, "jugador", [], "Carlos", { buscarPor: "apellido" }, hoy), []);
  assert.deepEqual(filtrarCandidatosParaOferta(conDatos, "jugador", [], "", { edadMinima: 30, edadMaxima: 20 }, hoy), []);
});

test("valida datos personales y conserva nombres completos antiguos", () => {
  const datos = new FormData();
  datos.set("nombreCompleto", " Nombre antiguo ");
  assert.equal(validarDatosPersonalesRepresentado(datos).nombreCompleto, "Nombre antiguo");
  datos.set("nombres", " Rodrigo "); datos.set("apellidos", " De Paul ");
  assert.equal(validarDatosPersonalesRepresentado(datos).nombreCompleto, "Rodrigo De Paul");
  datos.set("fechaNacimiento", "2026-02-30");
  assert.ok(validarDatosPersonalesRepresentado(datos).error);
});

test("combina puesto, postulaciones previas y búsqueda sin distinguir tildes o mayúsculas", () => {
  assert.deepEqual(filtrarCandidatosParaOferta(cartera, "director_tecnico", [], " JOSE ").map(c => c.candidato_id), ["1"]);
  assert.deepEqual(filtrarCandidatosParaOferta(cartera, "director_tecnico", ["1"]).map(c => c.candidato_id), ["3"]);
  assert.deepEqual(filtrarCandidatosParaOferta(cartera, "director_tecnico", ["1"], "jose"), []);
  assert.deepEqual(filtrarCandidatosParaOferta(cartera, "director_tecnico", [], "lopez").map(c => c.candidato_id), ["3"]);
  assert.deepEqual(filtrarCandidatosParaOferta(cartera, "medico"), []);
});
