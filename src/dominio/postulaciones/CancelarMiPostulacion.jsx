"use client";

import { useState, useTransition } from "react";
import { cancelarMiPostulacion } from "./acciones";
import styles from "./CancelarMiPostulacion.module.css";

export function CancelarMiPostulacion({ postulacionId, nombreOferta, onCancelada }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState(null);
  function cancelar() {
    if (pendiente || !window.confirm("¿Querés cancelar tu postulación? Se retirará de la oferta. Podés volver a postularte si la búsqueda sigue publicada.")) return;
    setError(null);
    iniciarTransicion(async () => {
      try {
        const resultado = await cancelarMiPostulacion(postulacionId);
        if (resultado?.error) setError(resultado.error);
        else if (resultado?.exito) onCancelada?.();
      } catch {
        setError("No se pudo cancelar la postulación. Volvé a intentar.");
      }
    });
  }
  return <div className={styles.contenedor}>
    <button type="button" disabled={pendiente} onClick={cancelar} className={styles.boton}
      aria-label={nombreOferta ? `Cancelar mi postulación a ${nombreOferta}` : "Cancelar mi postulación"}>
      {pendiente ? "Cancelando..." : "Cancelar postulación"}
    </button>
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
