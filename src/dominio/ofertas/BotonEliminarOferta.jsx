"use client";

import { useState, useTransition } from "react";
import { eliminarOferta } from "@/dominio/ofertas/acciones";
import styles from "./BotonesEstadoOferta.module.css";

/** El club elimina una oferta propia. Pide confirmación: la acción no se deshace. */
export function BotonEliminarOferta({ ofertaId, totalPostulantes = 0 }) {
  const [estaEnviando, iniciarTransicion] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState(null);

  function eliminar() {
    setError(null);
    iniciarTransicion(async () => {
      const resultado = await eliminarOferta(ofertaId);
      if (resultado?.error) {
        setError(resultado.error);
        setConfirmando(false);
      }
    });
  }

  if (confirmando) {
    return (
      <div className={styles.contenedor}>
        <span className={styles.pregunta}>
          {totalPostulantes > 0
            ? `¿Eliminar la oferta? Se borra de forma definitiva junto con ${totalPostulantes === 1 ? "la postulación recibida" : `las ${totalPostulantes} postulaciones recibidas`}. Avisaremos a ${totalPostulantes === 1 ? "el candidato" : "los candidatos"} de la baja.`
            : "¿Eliminar la oferta? Se borra de forma definitiva y no queda registro de la búsqueda."}
        </span>
        <div className={styles.botones}>
          <button type="button" disabled={estaEnviando} onClick={eliminar} className={styles.botonPeligro}>
            Sí, eliminar
          </button>
          <button
            type="button"
            disabled={estaEnviando}
            onClick={() => setConfirmando(false)}
            className={styles.boton}
          >
            Cancelar
          </button>
        </div>
        {estaEnviando && <p className={styles.feedback}>Eliminando...</p>}
      </div>
    );
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.botones}>
        <button
          type="button"
          disabled={estaEnviando}
          onClick={() => setConfirmando(true)}
          className={styles.botonPeligro}
        >
          Eliminar
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
