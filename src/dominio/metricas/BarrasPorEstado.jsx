import Link from "next/link";
import { porcentaje } from "@/lib/metricas-admin";
import styles from "./Metricas.module.css";

const numero = new Intl.NumberFormat("es-AR");

/**
 * Reparto de un total por estado: nombre, cantidad, porcentaje y una barra
 * proporcional al total. Si la fila trae `href`, toda la fila es un enlace.
 * Una fila puede traer su propio `total` (por ejemplo, Pro sobre las cuentas de su rol).
 */
export function BarrasPorEstado({ filas, total }) {
  return (
    <ul className={styles.barras}>
      {filas.map(({ clave, etiqueta, cantidad, href, total: totalFila }) => {
        const base = totalFila ?? total;
        const contenido = (
          <>
            <span className={styles.barraLinea}>
              <span className={styles.barraEtiqueta}>{etiqueta}</span>
              <strong className={styles.barraValor}>{numero.format(cantidad)}</strong>
            </span>
            <span className={styles.barraPista}>
              <span style={{ width: `${porcentaje(cantidad, base)}%` }} />
            </span>
            <span className={styles.barraPorcentaje}>{porcentaje(cantidad, base)}%</span>
          </>
        );
        return (
          <li key={clave}>
            {href ? <Link href={href} className={styles.barraFila}>{contenido}</Link> : <div className={styles.barraFila}>{contenido}</div>}
          </li>
        );
      })}
    </ul>
  );
}
