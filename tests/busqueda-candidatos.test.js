import test from 'node:test';
import assert from 'node:assert/strict';
import { edadCandidato, rangoFechasPorEdad } from '../src/lib/edad.js';
import {
  EDAD_MAXIMA_BUSQUEDA,
  EDAD_MINIMA_BUSQUEDA,
  ORDEN_POR_DEFECTO,
  hayFiltrosAplicados,
  normalizarFiltrosCandidatos,
  ordenParaConsulta,
  rangoDeNacimiento,
} from '../src/lib/busqueda-candidatos.js';

const hoy = new Date(2026, 10, 2); // 2 de noviembre de 2026

test('el rango de edad se traduce a fechas de nacimiento inclusivas', () => {
  const { nacidoDesde, nacidoHasta } = rangoFechasPorEdad(18, 23, hoy);
  // Cumplir 18 hoy es haber nacido el 2/11/2008; cumplir 24 mañana es el 3/11/2002.
  assert.equal(nacidoHasta, '2008-11-02');
  assert.equal(nacidoDesde, '2002-11-03');
});

test('las puntas del rango coinciden con la edad que calcula edadCandidato', () => {
  const { nacidoDesde, nacidoHasta } = rangoFechasPorEdad(18, 23, hoy);
  assert.equal(edadCandidato(nacidoHasta, hoy), 18, 'el nacido más viejo del rango tiene la edad mínima');
  assert.equal(edadCandidato(nacidoDesde, hoy), 23, 'el nacido más joven del rango tiene la edad máxima');
  // Un día a cada lado ya queda fuera.
  assert.equal(edadCandidato('2008-11-03', hoy), 17);
  assert.equal(edadCandidato('2002-11-02', hoy), 24);
});

test('cada punta del rango es independiente', () => {
  assert.deepEqual(rangoFechasPorEdad(30, undefined, hoy), { nacidoDesde: undefined, nacidoHasta: '1996-11-02' });
  assert.deepEqual(rangoFechasPorEdad(undefined, 30, hoy), { nacidoDesde: '1995-11-03', nacidoHasta: undefined });
  assert.deepEqual(rangoFechasPorEdad(undefined, undefined, hoy), { nacidoDesde: undefined, nacidoHasta: undefined });
});

test('el 29 de febrero no corre el límite un día', () => {
  const bisiesto = new Date(2024, 1, 29);
  // 2023 no es bisiesto: el límite se recorta al 28/2 en lugar de pasar al 1/3.
  assert.equal(rangoFechasPorEdad(1, undefined, bisiesto).nacidoHasta, '2023-02-28');
  assert.equal(edadCandidato('2023-02-28', bisiesto), 1);
  assert.equal(edadCandidato('2023-03-01', bisiesto), 0, 'el 1/3 todavía no cumplió: debe quedar fuera');
});

test('una edad exacta deja un rango de un solo año cumplido', () => {
  const { nacidoDesde, nacidoHasta } = rangoFechasPorEdad(20, 20, hoy);
  assert.equal(edadCandidato(nacidoHasta, hoy), 20);
  assert.equal(edadCandidato(nacidoDesde, hoy), 20);
  assert.ok(nacidoDesde < nacidoHasta);
});

test('los filtros vacíos no llegan a la consulta', () => {
  const { filtros, rangoInvertido } = normalizarFiltrosCandidatos({ nombre: '   ', puesto: '' });
  assert.equal(rangoInvertido, false);
  assert.deepEqual(filtros, {
    nombre: undefined, puesto: undefined, provincia: undefined, posicion: undefined,
    edadMinima: undefined, edadMaxima: undefined, orden: ORDEN_POR_DEFECTO,
  });
  assert.equal(hayFiltrosAplicados(filtros), false);
});

test('se descartan los valores que no están en el catálogo', () => {
  const { filtros } = normalizarFiltrosCandidatos({
    puesto: 'presidente', provincia: 'Montevideo', posicion: 'Bateador', orden: 'sueldo_desc',
  });
  assert.equal(filtros.puesto, undefined);
  assert.equal(filtros.provincia, undefined);
  assert.equal(filtros.posicion, undefined);
  assert.equal(filtros.orden, ORDEN_POR_DEFECTO, 'un orden inventado cae al orden por defecto');
});

test('se aceptan los valores válidos del catálogo', () => {
  const { filtros } = normalizarFiltrosCandidatos({
    nombre: '  Pérez ', puesto: 'jugador', provincia: 'Santa Fe', posicion: 'Arquero', orden: 'edad_asc',
  });
  assert.deepEqual(filtros, {
    nombre: 'Pérez', puesto: 'jugador', provincia: 'Santa Fe', posicion: 'Arquero',
    edadMinima: undefined, edadMaxima: undefined, orden: 'edad_asc',
  });
  assert.equal(hayFiltrosAplicados(filtros), true);
});

test('las edades se recortan a los topes y se ignora lo que no es un entero', () => {
  assert.equal(normalizarFiltrosCandidatos({ edadMinima: '3' }).filtros.edadMinima, EDAD_MINIMA_BUSQUEDA);
  assert.equal(normalizarFiltrosCandidatos({ edadMaxima: '200' }).filtros.edadMaxima, EDAD_MAXIMA_BUSQUEDA);
  for (const edadMinima of ['', 'veinte', '20.5', '-20', '1e3', ' ']) {
    assert.equal(normalizarFiltrosCandidatos({ edadMinima }).filtros.edadMinima, undefined, `rechaza ${JSON.stringify(edadMinima)}`);
  }
});

test('un rango invertido se avisa y no filtra por ninguna de las dos puntas', () => {
  const { filtros, rangoInvertido } = normalizarFiltrosCandidatos({ edadMinima: '30', edadMaxima: '20' });
  assert.equal(rangoInvertido, true);
  assert.equal(filtros.edadMinima, undefined);
  assert.equal(filtros.edadMaxima, undefined);
  assert.deepEqual(rangoDeNacimiento(filtros, hoy), { nacidoDesde: undefined, nacidoHasta: undefined });
});

test('el orden por nombre usa la sintaxis de recurso embebido, no la tabla referenciada', () => {
  // `referencedTable` ordena las filas embebidas y deja las padre como venían.
  assert.deepEqual(ordenParaConsulta('nombre_asc'), { columna: 'usuarios(nombre_completo)', ascendente: true });
  assert.deepEqual(ordenParaConsulta('nombre_desc'), { columna: 'usuarios(nombre_completo)', ascendente: false });
});

test('ordenar por edad invierte el sentido de la fecha de nacimiento', () => {
  // Más joven primero = nacido más tarde = fecha descendente.
  assert.deepEqual(ordenParaConsulta('edad_asc'), { columna: 'fecha_nacimiento', ascendente: false, ausentesAlFinal: true });
  assert.deepEqual(ordenParaConsulta('edad_desc'), { columna: 'fecha_nacimiento', ascendente: true, ausentesAlFinal: true });
});

test('el orden por defecto son los perfiles actualizados recientemente', () => {
  assert.deepEqual(ordenParaConsulta(ORDEN_POR_DEFECTO), { columna: 'actualizado_en', ascendente: false });
  assert.deepEqual(ordenParaConsulta(undefined), { columna: 'actualizado_en', ascendente: false });
});

test('cambiar solo el orden ya cuenta como filtro aplicado', () => {
  assert.equal(hayFiltrosAplicados(normalizarFiltrosCandidatos({ orden: 'nombre_asc' }).filtros), true);
  assert.equal(hayFiltrosAplicados(normalizarFiltrosCandidatos({ edadMinima: '18' }).filtros), true);
});
