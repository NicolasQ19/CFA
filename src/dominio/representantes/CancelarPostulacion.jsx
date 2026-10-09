"use client";

import { useState, useTransition } from "react";
import { cancelarPostulacionRepresentado } from "@/dominio/representantes/acciones";
import styles from "./CancelarPostulacion.module.css";

export function CancelarPostulacion({ postulacionId, nombreCandidato = "este candidato" }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState(null);

  function cancelar() {
    if (!window.confirm(`¿Cancelar la postulación de ${nombreCandidato}? Se retirará de esta oferta y podrás volver a postularlo si sigue publicada.`)) return;
    setError(null);
    iniciarTransicion(async () => {
      try {
        const resultado = await cancelarPostulacionRepresentado(postulacionId);
        if (resultado?.error) setError(resultado.error);
      } catch {
        setError("No se pudo cancelar la postulación. Volvé a intentar.");
      }
    });
  }

  return <div className={styles.contenedor}>
    <button type="button" className={styles.boton} disabled={pendiente} onClick={cancelar} aria-label={`Cancelar postulación de ${nombreCandidato}`}>
      {pendiente ? "Cancelando..." : "Cancelar postulación"}
    </button>
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
