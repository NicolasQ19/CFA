"use client";

import { useState, useTransition } from "react";
import { actualizarEstadoUsuario } from "./acciones";
import { DialogoConfirmacion } from "@/componentes/DialogoConfirmacion";
import styles from "./BotonEstadoCuenta.module.css";

export function BotonEstadoCuenta({ usuarioId, nombre, activa, esPropia = false }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  if (esPropia) {
    return <span className={styles.etiquetaPropia}>Tu cuenta</span>;
  }

  function alternarEstado() {
    setConfirmando(false);
    setError(null);
    iniciarTransicion(async () => {
      const respuesta = await actualizarEstadoUsuario(usuarioId, !activa);
      if (respuesta?.error) {
        setError(respuesta.error);
      }
    });
  }

  return (
    <div className={styles.contenedor}>
      <button
        type="button"
        disabled={pendiente}
        onClick={() => (activa ? setConfirmando(true) : alternarEstado())}
        className={activa ? styles.botonDesactivar : styles.botonActivar}
      >
        {pendiente
          ? activa
            ? "Desactivando..."
            : "Activando..."
          : activa
            ? "Desactivar"
            : "Activar cuenta"}
      </button>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <DialogoConfirmacion
        abierto={confirmando}
        titulo={`Desactivar la cuenta de ${nombre}`}
        descripcion="Mientras esté inactiva no va a poder iniciar sesión ni operar en la plataforma."
        detalle="Sus datos se conservan y podés reactivarla cuando quieras."
        textoConfirmar="Desactivar"
        peligro
        onConfirmar={alternarEstado}
        onCancelar={() => setConfirmando(false)}
      />
    </div>
  );
}
