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
      } catch (error) {
        const requiereRecarga = /failed to find server action|server action .*was not found on the server/i.test(error?.message ?? "");
        setMensaje({
          error: true,
          requiereRecarga,
          texto: requiereRecarga
            ? "La página quedó desactualizada. Recargala para continuar con la moderación."
            : "No se pudo actualizar la oferta. Intentá nuevamente.",
        });
      }
    });
  }
  const etiquetas = { publicada: estado === "pausada" ? "Reanudar" : "Publicar", pausada: "Pausar", rechazada: "Rechazar" };
  return (
    <div>
      <div className={styles.contenedor}>
        {(TRANSICIONES_OFERTA_DEL_ADMIN[estado] ?? []).map(destino => (
          <button key={destino} onClick={() => cambiar(destino)} disabled={estaEnviando || mensaje?.requiereRecarga}
            className={destino === "rechazada" ? styles.botonRechazar : destino === "pausada" ? styles.botonPausar : styles.botonAprobar}>
            {etiquetas[destino]}
          </button>
        ))}
      </div>
      {estaEnviando && <p role="status" className={styles.mensaje}>Actualizando…</p>}
      {mensaje && <p role={mensaje.error ? "alert" : "status"} className={styles.mensaje}>{mensaje.texto}</p>}
      {mensaje?.requiereRecarga && <button type="button" className={styles.botonAprobar} onClick={() => window.location.reload()}>Recargar página</button>}
    </div>
  );
}
