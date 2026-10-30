"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./DialogoConfirmacion.module.css";

/**
 * Confirmación propia para las acciones que no se pueden deshacer, en lugar de
 * `window.confirm`: respeta la paleta del sitio y se puede leer en pantallas chicas.
 *
 * Se apoya en <dialog> nativo, así que el navegador ya resuelve el foco atrapado,
 * la capa superior y el cierre con Escape.
 *
 * Con `palabraConfirmacion` el botón de confirmar queda bloqueado hasta que la
 * persona escribe esa palabra: se usa para los borrados definitivos.
 */
export function DialogoConfirmacion({
  abierto,
  titulo,
  descripcion,
  detalle = null,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  peligro = false,
  palabraConfirmacion = null,
  onConfirmar,
  onCancelar,
}) {
  const id = useId();
  const dialogoRef = useRef(null);
  const [escrito, setEscrito] = useState("");

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;

    if (abierto && !dialogo.open) {
      setEscrito("");
      dialogo.showModal();
    } else if (!abierto && dialogo.open) {
      dialogo.close();
    }
  }, [abierto]);

  const puedeConfirmar =
    !palabraConfirmacion || escrito.trim().toUpperCase() === palabraConfirmacion.toUpperCase();

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={`${id}-titulo`}
      className={styles.dialogo}
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
      onClick={(evento) => {
        // Clic en el fondo oscuro, fuera del panel.
        if (evento.target === dialogoRef.current) onCancelar();
      }}
    >
      <div className={styles.panel}>
        <h2 id={`${id}-titulo`} className={styles.titulo}>{titulo}</h2>
        <p className={styles.descripcion}>{descripcion}</p>
        {detalle && <p className={styles.detalle}>{detalle}</p>}

        {palabraConfirmacion && (
          <label className={styles.campo}>
            <span>Escribí <strong>{palabraConfirmacion}</strong> para confirmar</span>
            <input
              type="text"
              value={escrito}
              autoComplete="off"
              onChange={(evento) => setEscrito(evento.target.value)}
              className={styles.entrada}
            />
          </label>
        )}

        <div className={styles.acciones}>
          <button type="button" onClick={onCancelar} className={styles.botonCancelar}>
            {textoCancelar}
          </button>
          <button
            type="button"
            disabled={!puedeConfirmar}
            onClick={onConfirmar}
            className={peligro ? styles.botonPeligro : styles.botonConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}
