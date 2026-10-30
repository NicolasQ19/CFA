import Link from "next/link";
import { NOMBRES_PLAN_POR_ROL } from "@/lib/suscripciones";
import styles from "./IndicadorConsumoPlan.module.css";

/**
 * Consumo del cupo del plan ("2 de 3 ofertas activas"). Con plan pago muestra que no hay tope.
 * `cupo` es el resultado de obtenerCupoOfertasDelClub u obtenerCupoPostulaciones.
 */
export function IndicadorConsumoPlan({ rol, cupo, unidad, unidadSingular }) {
  if (!cupo || cupo.fallo) return null;

  const nombres = NOMBRES_PLAN_POR_ROL[rol];
  const sinTope = cupo.limite === null;
  const agotado = !sinTope && cupo.restantes === 0;
  const etiquetaUnidad = cupo.limite === 1 ? (unidadSingular ?? unidad) : unidad;

  return (
    <p className={agotado ? styles.contenedorAgotado : styles.contenedor}>
      <span className={styles.plan}>{nombres[sinTope ? "pago" : "gratuito"]}</span>
      <span className={styles.consumo}>
        {sinTope
          ? `${unidad} sin límite`
          : `${cupo.usadas} de ${cupo.limite} ${etiquetaUnidad}`}
      </span>
      {!sinTope && (
        <Link href="/planes" className={styles.enlace}>
          {agotado ? "Mejorar mi plan" : "Ver planes"}
        </Link>
      )}
    </p>
  );
}
