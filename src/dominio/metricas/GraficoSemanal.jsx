import { topeDelEje } from "@/lib/metricas-admin";
import styles from "./Metricas.module.css";

const fechaCorta = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit", month: "2-digit", timeZone: "America/Argentina/Buenos_Aires",
});
const numero = new Intl.NumberFormat("es-AR");

/**
 * Barras por semana (apiladas si hay varias series). Se dibuja en el servidor con
 * HTML y CSS: cada columna es enfocable y muestra el detalle al pasar el mouse.
 * `series`: [{ clave, etiqueta, color }] en orden fijo, abajo la primera.
 */
export function GraficoSemanal({ semanas, series, unidad, ahora }) {
  const tope = topeDelEje(Math.max(0, ...semanas.map((semana) => semana.total)));
  const lineas = [0, 1, 2, 3, 4].map((paso) => (tope * paso) / 4);
  const total = semanas.reduce((suma, semana) => suma + semana.total, 0);
  const nombreSemana = (semana) =>
    semana.fin > ahora ? `Semana actual (desde el ${fechaCorta.format(semana.inicio)})` : `Semana del ${fechaCorta.format(semana.inicio)}`;

  return (
    <figure className={styles.grafico}>
      {series.length > 1 && (
        <ul className={styles.leyenda}>
          {series.map((serie) => (
            <li key={serie.clave}><span className={styles.muestra} style={{ background: serie.color }} />{serie.etiqueta}</li>
          ))}
        </ul>
      )}

      <div className={styles.lienzo}>
        <div className={styles.guias} aria-hidden="true">
          {lineas.map((valor) => (
            <span key={valor} style={{ bottom: `${(valor / tope) * 100}%` }}><em>{numero.format(valor)}</em></span>
          ))}
        </div>

        <ol className={styles.columnas}>
          {semanas.map((semana, indice) => {
            const detalle = series.map((serie) => `${numero.format(semana.valores[serie.clave])} ${serie.etiqueta.toLowerCase()}`).join(", ");
            return (
              <li key={semana.inicio} className={styles.columna} tabIndex={0}
                data-lado={indice >= semanas.length - 3 ? "izquierda" : "derecha"}
                aria-label={`${nombreSemana(semana)}: ${numero.format(semana.total)} ${unidad}${series.length > 1 ? ` (${detalle})` : ""}`}>
                <div className={styles.pila} style={{ height: `${(semana.total / tope) * 100}%` }}>
                  {series.map((serie) => semana.valores[serie.clave] > 0 && (
                    <span key={serie.clave} style={{ flexGrow: semana.valores[serie.clave], background: serie.color }} />
                  ))}
                </div>
                <div className={styles.detalle} aria-hidden="true">
                  <strong>{nombreSemana(semana)}</strong>
                  {series.length > 1 && series.map((serie) => (
                    <span key={serie.clave} className={styles.detalleFila}>
                      <span><span className={styles.muestra} style={{ background: serie.color }} />{serie.etiqueta}</span>
                      <b>{numero.format(semana.valores[serie.clave])}</b>
                    </span>
                  ))}
                  <span className={`${styles.detalleFila} ${styles.detalleTotal}`}>
                    <span>Total</span><b>{numero.format(semana.total)} {unidad}</b>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <ol className={styles.ejeX} aria-hidden="true">
        {semanas.map((semana, indice) => (
          <li key={semana.inicio}>{indice % 2 === semanas.length % 2 ? "" : fechaCorta.format(semana.inicio)}</li>
        ))}
      </ol>

      <figcaption className={styles.pieGrafico}>
        {numero.format(total)} {unidad} en las últimas {semanas.length} semanas. Cada barra es una semana, de lunes a domingo.
      </figcaption>

      <details className={styles.verTabla}>
        <summary>Ver los datos en una tabla</summary>
        <table>
          <thead>
            <tr><th scope="col">Semana</th>{series.length > 1 && series.map((serie) => <th key={serie.clave} scope="col">{serie.etiqueta}</th>)}<th scope="col">Total</th></tr>
          </thead>
          <tbody>
            {semanas.map((semana) => (
              <tr key={semana.inicio}>
                <th scope="row">{nombreSemana(semana)}</th>
                {series.length > 1 && series.map((serie) => <td key={serie.clave}>{numero.format(semana.valores[serie.clave])}</td>)}
                <td>{numero.format(semana.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
