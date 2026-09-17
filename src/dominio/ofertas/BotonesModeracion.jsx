"use client";

import { useTransition } from "react";
import { moderarOferta } from "@/dominio/ofertas/acciones";
import styles from "./BotonesModeracion.module.css";

export function BotonesModeracion({ ofertaId }) {
  const [estaEnviando, iniciarTransicion] = useTransition();

  function aprobar() {
    iniciarTransicion(() => moderarOferta(ofertaId, "publicada"));
  }

  function rechazar() {
    iniciarTransicion(() => moderarOferta(ofertaId, "rechazada"));
  }

  return (
    <div className={styles.contenedor}>
      <button onClick={aprobar} disabled={estaEnviando} className={styles.botonAprobar}>
        Publicar
      </button>
      <button onClick={rechazar} disabled={estaEnviando} className={styles.botonRechazar}>
        Rechazar
      </button>
    </div>
  );
}
