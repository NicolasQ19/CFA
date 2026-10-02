import test from 'node:test';
import assert from 'node:assert/strict';
import { validarMejorasPerfil, completitudPerfil } from '../src/lib/perfil-candidato.js';
const formulario = valores => { const f = new FormData(); for (const [k, v] of Object.entries(valores)) f.set(k, typeof v === 'string' ? v : JSON.stringify(v)); return f; };

test('los campos adicionales son opcionales y no impiden guardar', () => {
  const { datos, error } = validarMejorasPerfil(new FormData());
  assert.equal(error, undefined);
  assert.equal(datos.dispuesto_mudarse, null);
  assert.deepEqual(datos.experiencias, []);
});
test('normaliza una trayectoria y conserva la negativa de mudanza', () => {
  const { datos } = validarMejorasPerfil(formulario({ dispuestoMudarse: 'no', experiencias: [{ club:' Club A ', categoria:'Primera', temporada:'2024–2025', descripcion:' Capitán ', clave:'no persistir' }] }));
  assert.equal(datos.dispuesto_mudarse, false);
  assert.deepEqual(datos.experiencias, [{ club:'Club A', categoria:'Primera', temporada:'2024–2025', descripcion:'Capitán' }]);
});
test('rechaza experiencias incompletas o JSON inválido', () => {
  for(const experiencias of ['{', {}, [null], [{club:'Club A'}], Array(21).fill({})]) assert.ok(validarMejorasPerfil(formulario({experiencias})).error);
});
test('ignora filas totalmente vacías', () => assert.deepEqual(validarMejorasPerfil(formulario({experiencias:[{club:' '}]})).datos.experiencias, []));
test('valida longitud y opciones permitidas', () => {
  for(const valores of [{presentacion:'a'.repeat(601)}, {disponibilidad:'otro'}, {situacionClub:'otro'}, {dispuestoMudarse:'otro'}]) assert.ok(validarMejorasPerfil(formulario(valores)).error);
});
test('rechaza fechas imposibles y admite años bisiestos', () => {
  assert.ok(validarMejorasPerfil(formulario({incorporacionDesde:'2025-02-30'})).error);
  assert.equal(validarMejorasPerfil(formulario({incorporacionDesde:'2024-02-29'})).datos.incorporacion_desde, '2024-02-29');
});
test('completitud acepta trayectoria antigua y CV sin exigir videos', () => {
  assert.equal(completitudPerfil({}).porcentaje, 0);
  const perfil = { foto_url:'foto', puesto:'jugador', provincia:'Córdoba', presentacion:'Presentación', disponibilidad:'disponible', trayectoria:'Club anterior', cv_ruta:'cv' };
  assert.equal(completitudPerfil(perfil).porcentaje, 100);
  assert.deepEqual(completitudPerfil(perfil).faltantes, []);
});
test('una experiencia incompleta no cuenta para completitud', () => {
  assert.ok(completitudPerfil({experiencias:[{club:'Club A'}]}).faltantes.includes('Trayectoria'));
});
