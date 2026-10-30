"use client";

import { useActionState } from "react";
import { contratarPlanPago, darDeBajaPlanPago } from "./acciones";
import { SelectorDesplegable } from "@/componentes/SelectorDesplegable";
import { MESES_SUSCRIPCION } from "@/lib/suscripciones";
import styles from "./AccionesPlan.module.css";

const ESTADO_INICIAL = { error: null, exito: null };

/** Alta y baja del plan Pro. El cobro está simulado: no hay pasarela de pago. */
export function AccionesPlan({ planVigente, nombrePlanPago }) {
  const [estado, contratar, contratando] = useActionState(contratarPlanPago, ESTADO_INICIAL);
  const [estadoBaja, darDeBaja, dandoDeBaja] = useActionState(
    async () => darDeBajaPlanPago(),
    ESTADO_INICIAL,
  );

  const mensaje = estado.error ?? estadoBaja.error ?? estado.exito ?? estadoBaja.exito;
  const esError = Boolean(estado.error ?? estadoBaja.error);

  return (
    <div className={styles.contenedor}>
      {planVigente === "pago" ? (
        <form action={darDeBaja}>
          <button type="submit" disabled={dandoDeBaja} className={styles.botonSecundario}>
            {dandoDeBaja ? "Procesando..." : "Volver al plan gratuito"}
          </button>
        </form>
      ) : (
        <form action={contratar} className={styles.formulario}>
          <span id="etiquetaMeses" className={styles.etiqueta}>
            Duración
          </span>
          <SelectorDesplegable
            nombre="meses"
            etiquetaId="etiquetaMeses"
            valorInicial="1"
            className={styles.selector}
            opciones={MESES_SUSCRIPCION.map((meses) => ({
              valor: String(meses),
              texto: meses === 1 ? "1 mes" : `${meses} meses`,
            }))}
          />
          <button type="submit" disabled={contratando} className={styles.boton}>
            {contratando ? "Activando..." : `Suscribirme a ${nombrePlanPago}`}
          </button>
        </form>
      )}

      {mensaje && (
        <p role="status" className={esError ? styles.error : styles.exito}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
