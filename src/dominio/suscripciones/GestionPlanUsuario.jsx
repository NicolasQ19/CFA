"use client";

import { useState, useTransition } from "react";
import { actualizarPlanDeUsuario } from "./acciones";
import { MESES_SUSCRIPCION } from "@/lib/suscripciones";
import styles from "./AccionesPlan.module.css";

/** Alta y baja del plan de una cuenta desde el panel de administración. */
export function GestionPlanUsuario({ usuarioId, planVigente, nombrePlanPago }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [meses, setMeses] = useState(1);
  const [mensaje, setMensaje] = useState(null);

  function aplicar(plan) {
    setMensaje(null);
    iniciarTransicion(async () => {
      const respuesta = await actualizarPlanDeUsuario({ usuarioId, plan, meses });
      setMensaje(respuesta?.error ?? respuesta?.exito ?? null);
      if (respuesta?.error) setMensaje(respuesta.error);
    });
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.formulario}>
        <label htmlFor={`meses-${usuarioId}`} className={styles.etiqueta}>
          Meses
        </label>
        <select
          id={`meses-${usuarioId}`}
          value={meses}
          onChange={(evento) => setMeses(Number(evento.target.value))}
          className={styles.selector}
        >
          {MESES_SUSCRIPCION.map((valor) => (
            <option key={valor} value={valor}>{valor}</option>
          ))}
        </select>
        <button type="button" disabled={pendiente} onClick={() => aplicar("pago")} className={styles.boton}>
          {planVigente === "pago" ? "Extender" : `Activar ${nombrePlanPago}`}
        </button>
        {planVigente === "pago" && (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => aplicar("gratuito")}
            className={styles.botonSecundario}
          >
            Dar de baja
          </button>
        )}
      </div>
      {mensaje && <p role="status" className={styles.exito}>{mensaje}</p>}
    </div>
  );
}
