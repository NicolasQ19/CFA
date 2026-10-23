"use client";

import { useState, useTransition } from "react";
import { moderarOferta } from "@/dominio/ofertas/acciones";
import { TRANSICIONES_OFERTA_DEL_ADMIN } from "@/tipos/dominio";
import styles from "./BotonesModeracion.module.css";

export function BotonesModeracion({ ofertaId, estado }) {
  const [estaEnviando, iniciarTransicion] = useTransition();
  const [mensaje, setMensaje] = useState(null);
  function cambiar(nuevoEstado) {
    setMensaje(null);
    iniciarTransicion(async () => {
      try {
        const resultado = await moderarOferta(ofertaId, nuevoEstado);
        setMensaje(resultado.error ? { error: true, texto: resultado.error } : { texto: "Estado actualizado." });
      } catch {
        setMensaje({ error: true, texto: "No se pudo actualizar la oferta. Intentá nuevamente." });
      }
    });
  }
  const etiquetas = { publicada: estado === "pausada" ? "Reanudar" : "Publicar", pausada: "Pausar", rechazada: "Rechazar" };
  return (
    <div>
      <div className={styles.contenedor}>
        {(TRANSICIONES_OFERTA_DEL_ADMIN[estado] ?? []).map(destino => (
          <button key={destino} onClick={() => cambiar(destino)} disabled={estaEnviando}
            className={destino === "rechazada" ? styles.botonRechazar : destino === "pausada" ? styles.botonPausar : styles.botonAprobar}>
            {etiquetas[destino]}
          </button>
        ))}
      </div>
      {estaEnviando && <p role="status" className={styles.mensaje}>Actualizando…</p>}
      {mensaje && <p role={mensaje.error ? "alert" : "status"} className={styles.mensaje}>{mensaje.texto}</p>}
    </div>
  );
}
