"use client";

import { useState, useTransition } from "react";
import { cancelarMiPostulacion } from "./acciones";
import { DialogoConfirmacion } from "@/componentes/DialogoConfirmacion";
import styles from "./CancelarMiPostulacion.module.css";

export function CancelarMiPostulacion({ postulacionId, nombreOferta, onCancelada }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  function cancelar() {
    setConfirmando(false);
    if (pendiente) return;
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
    <button type="button" disabled={pendiente} onClick={() => setConfirmando(true)} className={styles.boton}
      aria-label={nombreOferta ? `Cancelar mi postulación a ${nombreOferta}` : "Cancelar mi postulación"}>
      {pendiente ? "Cancelando..." : "Cancelar postulación"}
    </button>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <DialogoConfirmacion
      abierto={confirmando}
      titulo="Cancelar tu postulación"
      descripcion={nombreOferta ? `Vas a retirar tu postulación a ${nombreOferta}.` : "Vas a retirar tu postulación de esta oferta."}
      detalle="Podés volver a postularte mientras la búsqueda siga publicada."
      textoConfirmar="Cancelar postulación"
      textoCancelar="Volver"
      peligro
      onConfirmar={cancelar}
      onCancelar={() => setConfirmando(false)}
    />
  </div>;
}
