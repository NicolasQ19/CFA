"use client";

import { useTransition, useState } from "react";
import { eliminarRepresentado } from "@/dominio/representantes/acciones";
import styles from "./BotonGestionarCartera.module.css";

export function BotonQuitarCartera({ candidatoId }) {
  const [estaEnviando, iniciarTransicion] = useTransition();
  const [error, setError] = useState(null);

  function manejarClick() {
    if (!confirm("¿Seguro que deseás dar de baja a este candidato de tu cartera?")) return;
    setError(null);
    iniciarTransicion(async () => {
      const res = await eliminarRepresentado(candidatoId);
      if (res?.error) {
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <button
        onClick={manejarClick}
        disabled={estaEnviando}
        className={styles.botonQuitar}
      >
        {estaEnviando ? "Eliminando..." : "Eliminar de cartera"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
