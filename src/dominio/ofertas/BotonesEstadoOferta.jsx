"use client";

import { useState, useTransition } from "react";
import { cambiarEstadoDeOferta } from "@/dominio/ofertas/acciones";
import { TRANSICIONES_OFERTA_DEL_CLUB } from "@/tipos/dominio";
import styles from "./BotonesEstadoOferta.module.css";

/** Texto del botón según el estado destino, mirado desde el estado actual. */
function textoAccion(estadoActual, nuevoEstado) {
  if (nuevoEstado === "pausada") return "Pausar";
  if (nuevoEstado === "cerrada") return "Cerrar";
  return estadoActual === "cerrada" ? "Reabrir" : "Reanudar";
}

/** RF-13: el club pausa, reanuda, cierra o reabre una oferta propia. */
export function BotonesEstadoOferta({ ofertaId, estado }) {
  const [estaEnviando, iniciarTransicion] = useTransition();
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const [error, setError] = useState(null);

  const acciones = TRANSICIONES_OFERTA_DEL_CLUB[estado] ?? [];
  if (acciones.length === 0) return null;

  function cambiar(nuevoEstado) {
    setError(null);
    setConfirmandoCierre(false);
    iniciarTransicion(async () => {
      const resultado = await cambiarEstadoDeOferta(ofertaId, nuevoEstado);
      if (resultado?.error) setError(resultado.error);
    });
  }

  if (confirmandoCierre) {
    return (
      <div className={styles.contenedor}>
        <span className={styles.pregunta}>¿Cerrar la oferta? Deja de verse en el listado.</span>
        <div className={styles.botones}>
          <button type="button" onClick={() => cambiar("cerrada")} className={styles.botonPeligro}>
            Sí, cerrar
          </button>
          <button
            type="button"
            onClick={() => setConfirmandoCierre(false)}
            className={styles.boton}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.botones}>
        {acciones.map((nuevoEstado) => (
          <button
            key={nuevoEstado}
            type="button"
            disabled={estaEnviando}
            onClick={() =>
              nuevoEstado === "cerrada" ? setConfirmandoCierre(true) : cambiar(nuevoEstado)
            }
            className={nuevoEstado === "cerrada" ? styles.botonPeligro : styles.boton}
          >
            {textoAccion(estado, nuevoEstado)}
          </button>
        ))}
      </div>
      {estaEnviando && <p className={styles.feedback}>Guardando...</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
