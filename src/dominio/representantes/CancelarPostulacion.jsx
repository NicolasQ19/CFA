"use client";

import { useState, useTransition } from "react";
import { cancelarPostulacionRepresentado } from "@/dominio/representantes/acciones";
import { DialogoConfirmacion } from "@/componentes/DialogoConfirmacion";
import styles from "./CancelarPostulacion.module.css";

export function CancelarPostulacion({ postulacionId, nombreCandidato = "este candidato" }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  function cancelar() {
    setConfirmando(false);
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
    <button type="button" className={styles.boton} disabled={pendiente} onClick={() => setConfirmando(true)} aria-label={`Cancelar postulación de ${nombreCandidato}`}>
      {pendiente ? "Cancelando..." : "Cancelar postulación"}
    </button>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <DialogoConfirmacion
      abierto={confirmando}
      titulo="Cancelar la postulación"
      descripcion={`Vas a retirar la postulación de ${nombreCandidato} de esta oferta.`}
      detalle="Podés volver a postularlo mientras la búsqueda siga publicada."
      textoConfirmar="Cancelar postulación"
      textoCancelar="Volver"
      peligro
      onConfirmar={cancelar}
      onCancelar={() => setConfirmando(false)}
    />
  </div>;
}
