import test from 'node:test';
import assert from 'node:assert/strict';
import { validarCurriculum, TAMANIO_MAXIMO_CV } from '../src/lib/curriculum.js';

test('sin archivo conserva el CV actual', async () => {
  assert.equal(await validarCurriculum(null), null);
  assert.equal(await validarCurriculum(new File([], '')), null);
});
test('acepta un PDF y extensiones en mayúsculas', async () => {
  assert.equal(await validarCurriculum(new File(['%PDF-1.7\n'], 'CV.PDF', {type:'application/pdf'})), null);
});
test('rechaza un archivo renombrado como PDF', async () => {
  assert.match(await validarCurriculum(new File(['<html>'], 'cv.pdf', {type:'application/pdf'})), /no es un PDF válido/);
});
test('rechaza extensiones y tipos incompatibles', async () => {
  assert.match(await validarCurriculum(new File(['%PDF-'], 'cv.html', {type:'application/pdf'})), /archivo PDF/);
  assert.match(await validarCurriculum(new File(['%PDF-'], 'cv.pdf', {type:'text/html'})), /archivo PDF/);
});
test('aplica el límite de 5 MB', async () => {
  assert.match(await validarCurriculum(new File([new Uint8Array(TAMANIO_MAXIMO_CV + 1)], 'cv.pdf', {type:'application/pdf'})), /5 MB/);
});
