/**
 * Cálculo de edad y de rangos de fechas de nacimiento.
 *
 * Vive aparte porque lo usan tres dominios: el perfil del candidato, la cartera
 * del representante y la búsqueda de candidatos del club.
 */

/** Días que tiene un mes (1-12) de un año concreto. */
function diasDelMes(anio, mes) {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

function iso(anio, mes, dia) {
  return new Date(Date.UTC(anio, mes - 1, dia)).toISOString().slice(0, 10);
}

/**
 * Edad cumplida a partir de una fecha `AAAA-MM-DD`, o `null` si la fecha no es
 * válida, no existe en el calendario o es futura.
 */
export function edadCandidato(fecha, hoy = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? "")) return null;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const nacimiento = new Date(anio, mes - 1, dia);
  if (nacimiento.getFullYear() !== anio || nacimiento.getMonth() !== mes - 1 || nacimiento.getDate() !== dia || nacimiento > hoy) return null;
  return hoy.getFullYear() - anio - (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia) ? 1 : 0);
}

/**
 * La misma fecha `anios` años antes. El 29/2 se recorta al 28 cuando el año
 * destino no es bisiesto: adelantarlo al 1/3 correría el límite un día.
 */
function restarAnios(hoy, anios) {
  const anio = hoy.getFullYear() - anios;
  const mes = hoy.getMonth() + 1;
  return iso(anio, mes, Math.min(hoy.getDate(), diasDelMes(anio, mes)));
}

/**
 * Traduce un rango de edades a un rango de fechas de nacimiento, para poder
 * filtrar en SQL en lugar de traer todas las filas y calcular la edad en JS.
 *
 * - `edad >= minima` equivale a haber nacido **hasta** `hoy - minima años`.
 * - `edad <= maxima` equivale a haber nacido **desde** el día siguiente a
 *   `hoy - (maxima + 1) años` (ese día ya tendría `maxima + 1`).
 *
 * Devuelve `{ nacidoDesde, nacidoHasta }` en formato `AAAA-MM-DD`; cada límite
 * es `undefined` si esa punta del rango no se indicó.
 */
export function rangoFechasPorEdad(edadMinima, edadMaxima, hoy = new Date()) {
  const nacidoHasta = Number.isInteger(edadMinima) ? restarAnios(hoy, edadMinima) : undefined;

  let nacidoDesde;
  if (Number.isInteger(edadMaxima)) {
    const [anio, mes, dia] = restarAnios(hoy, edadMaxima + 1).split("-").map(Number);
    nacidoDesde = iso(anio, mes, dia + 1);
  }

  return { nacidoDesde, nacidoHasta };
}
