"use client";

import { useState, useTransition } from "react";
import { actualizarEstadoUsuario } from "./acciones";
import styles from "./BotonEstadoCuenta.module.css";

export function BotonEstadoCuenta({ usuarioId, nombre, activa, esPropia = false }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState(null);

  if (esPropia) {
    return <span className={styles.etiquetaPropia}>Tu cuenta</span>;
  }

  function alternarEstado() {
    if (activa) {
      const confirmar = window.confirm(
        `¿Querés desactivar la cuenta de "${nombre}"?\n\nMientras esté inactiva no podrá iniciar sesión ni operar en la plataforma.`
      );
      if (!confirmar) return;
    }

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
        onClick={alternarEstado}
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
    </div>
  );
}
