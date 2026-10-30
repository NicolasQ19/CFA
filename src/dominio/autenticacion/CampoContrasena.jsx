"use client";

import { useId, useState } from "react";
import styles from "./CampoContrasena.module.css";

/**
 * Campo de contraseña con interruptor para mostrarla, compartido por el alta y el ingreso.
 * El botón queda fuera del tab natural del formulario para no estorbar el envío con teclado.
 */
export function CampoContrasena({
  nombre = "contrasena",
  etiqueta = "Contraseña",
  autoComplete = "current-password",
  minLength,
  ayuda = null,
  accion = null,
}) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.campo}>
      <div className={styles.filaEtiqueta}>
        <label htmlFor={id} className={styles.etiqueta}>{etiqueta}</label>
        {accion}
      </div>
      <div className={styles.contenedorEntrada}>
        <input
          id={id}
          name={nombre}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-describedby={ayuda ? idAyuda : undefined}
          className={styles.entrada}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((actual) => !actual)}
          aria-pressed={visible}
          className={styles.boton}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {ayuda && <p id={idAyuda} className={styles.ayuda}>{ayuda}</p>}
    </div>
  );
}
