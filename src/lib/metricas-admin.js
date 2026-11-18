/**
 * Cálculos del panel /admin/metricas (CU-23 / RF-27). Son funciones puras:
 * reciben filas ya leídas de Supabase y devuelven lo que dibuja la página.
 */

const DIA = 86400000;
// Argentina no tiene horario de verano: la semana se arma en UTC-3 fijo
// para que una alta del domingo a la noche no caiga en la semana siguiente.
const DESFASE_ARGENTINA = -3 * 3600000;

/** Inicio (lunes 00:00 hora argentina) de la semana que contiene `fecha`, como timestamp UTC. */
export function inicioDeSemana(fecha) {
  const local = new Date(new Date(fecha).getTime() + DESFASE_ARGENTINA);
  const diasDesdeLunes = (local.getUTCDay() + 6) % 7;
  const lunesLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - diasDesdeLunes);
  return lunesLocal - DESFASE_ARGENTINA;
}

/** Las últimas `cantidad` semanas, de la más vieja a la actual (que puede estar en curso). */
export function semanasRecientes(cantidad, ahora = new Date()) {
  const actual = inicioDeSemana(ahora);
  return Array.from({ length: cantidad }, (_, i) => {
    const inicio = actual - (cantidad - 1 - i) * 7 * DIA;
    return { inicio, fin: inicio + 7 * DIA };
  });
}

/**
 * Reparte filas por semana y por serie. `campoFecha` indica la columna de fecha
 * y `claveSerie` (opcional) la columna que separa las series, por ejemplo `rol`.
 */
export function agruparPorSemana(filas, { semanas, campoFecha, claveSerie, series }) {
  const resultado = semanas.map((semana) => ({
    ...semana,
    valores: Object.fromEntries(series.map((serie) => [serie, 0])),
  }));
  for (const fila of filas ?? []) {
    const momento = Date.parse(fila[campoFecha]);
    if (Number.isNaN(momento)) continue;
    const serie = claveSerie ? fila[claveSerie] : series[0];
    const semana = resultado.find((s) => momento >= s.inicio && momento < s.fin);
    if (semana && serie in semana.valores) semana.valores[serie] += 1;
  }
  return resultado.map((semana) => ({
    ...semana,
    total: Object.values(semana.valores).reduce((suma, valor) => suma + valor, 0),
  }));
}

/** Tope "redondo" del eje (1, 2, 5 × 10ⁿ) para que las líneas guía caigan en números simples. */
export function topeDelEje(maximo, divisiones = 4) {
  if (!(maximo > 0)) return divisiones;
  const paso = maximo / divisiones;
  const magnitud = 10 ** Math.floor(Math.log10(paso));
  const redondo = [1, 2, 5, 10].map((m) => m * magnitud).find((candidato) => candidato >= paso);
  return Math.max(divisiones, Math.round(redondo * divisiones));
}

/** Porcentaje entero de `parte` sobre `total`, 0 si no hay total. */
export function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}
