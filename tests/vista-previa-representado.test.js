import test from "node:test";
import assert from "node:assert/strict";
import { prepararVistaPreviaRepresentado } from "../src/lib/vista-previa-representado.js";

function formulario(valores) {
  const datos = new FormData();
  for (const [campo, valor] of Object.entries(valores)) datos.set(campo, valor);
  return datos;
}

test("la vista previa usa el borrador y conserva los campos públicos que no se editan", () => {
  const actual = { nombre_completo: "Nombre antiguo", presentacion: "Presentación existente", experiencias: [{ club: "Club A" }], cv_ruta: "actual.pdf", foto_url: "actual.png" };
  const previa = prepararVistaPreviaRepresentado(formulario({ nombres: " Rodrigo ", apellidos: " De Paul ", puesto: "jugador", provincia: "Buenos Aires", alturaCm: "182", trayectoria: " Nueva trayectoria ", video1: "https://youtu.be/abcdefghijk", video2: "https://youtu.be/abcdefghijk" }), actual);
  assert.equal(previa.nombreCandidato, "Rodrigo De Paul");
  assert.equal(previa.perfil.trayectoria, "Nueva trayectoria");
  assert.equal(previa.perfil.altura_cm, "182");
  assert.equal(previa.perfil.presentacion, actual.presentacion);
  assert.equal(previa.perfil.cv_ruta, "actual.pdf");
  assert.equal(previa.perfil.enlaces_video.length, 1);
  assert.equal(actual.nombre_completo, "Nombre antiguo");
});

test("respeta la eliminación de archivos y el cambio a cuerpo técnico", () => {
  const previa = prepararVistaPreviaRepresentado(formulario({ puesto: "director_tecnico", tituloOMatricula: "ATFA", aniosExperiencia: "0", quitarCv: "on", quitarFoto: "on" }), { foto_url: "actual.png", cv_ruta: "actual.pdf", posicion_juego: "Arquero" });
  assert.equal(previa.perfil.cv_ruta, null);
  assert.equal(previa.perfil.foto_url, null);
  assert.equal(previa.perfil.posicion_juego, null);
  assert.equal(previa.perfil.anios_experiencia, "0");
  assert.equal(previa.perfil.titulo_o_matricula, "ATFA");
  assert.equal(previa.nombreCandidato, "Candidato");
});
