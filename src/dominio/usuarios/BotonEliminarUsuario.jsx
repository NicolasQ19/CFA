"use client";

import { useState, useTransition } from "react";
import { eliminarUsuario } from "./acciones";
import { DialogoConfirmacion } from "@/componentes/DialogoConfirmacion";
import styles from "./BotonEstadoCuenta.module.css";

const CONSECUENCIAS = {
  club: "Se eliminan también su perfil institucional, sus ofertas y las postulaciones recibidas.",
  candidato: "Se eliminan también su perfil profesional, su currículum y sus postulaciones.",
  representante: "Se eliminan también su perfil, su cartera de representados y las postulaciones que envió.",
};

/**
 * Eliminación definitiva de una cuenta desde el panel de administración.
 * Pide escribir ELIMINAR porque la acción no se puede deshacer.
 */
export function BotonEliminarUsuario({ usuarioId, nombre, rol, esFicha = false }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const detalle = esFicha
    ? "Se elimina la ficha de cartera y sus postulaciones."
    : (CONSECUENCIAS[rol] ?? "Se eliminan también sus datos asociados.");

  function eliminar() {
    setConfirmando(false);
    setError(null);
    iniciarTransicion(async () => {
      const respuesta = await eliminarUsuario(usuarioId);
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
        onClick={() => setConfirmando(true)}
        className={styles.botonEliminar}
      >
        {pendiente ? "Eliminando..." : "Eliminar"}
      </button>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <DialogoConfirmacion
        abierto={confirmando}
        titulo={`Eliminar la cuenta de ${nombre}`}
        descripcion={`${detalle} Esta acción no se puede deshacer: si solo querés impedirle el acceso, usá "Desactivar".`}
        palabraConfirmacion="ELIMINAR"
        textoConfirmar="Eliminar definitivamente"
        peligro
        onConfirmar={eliminar}
        onCancelar={() => setConfirmando(false)}
      />
    </div>
  );
}
