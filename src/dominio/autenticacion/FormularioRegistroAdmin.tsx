"use client";

import { useActionState } from "react";
import { registrarAdministrador, type ResultadoAccion } from "@/dominio/autenticacion/acciones";
import styles from "./FormularioRegistroAdmin.module.css";

const ESTADO_INICIAL: ResultadoAccion = { error: null };

export function FormularioRegistroAdmin({ claveSecreta }: { claveSecreta: string }) {
  const [estado, ejecutarRegistro, estaEnviando] = useActionState(registrarAdministrador, ESTADO_INICIAL);

  return (
    <form action={ejecutarRegistro} className={styles.formulario}>
      <input type="hidden" name="claveSecreta" value={claveSecreta} />

      <div className={styles.campo}>
        <label htmlFor="nombreCompleto" className={styles.etiqueta}>
          Nombre completo
        </label>
        <input
          id="nombreCompleto"
          name="nombreCompleto"
          type="text"
          required
          className={styles.entrada}
        />
      </div>

      <div className={styles.campo}>
        <label htmlFor="correoElectronico" className={styles.etiqueta}>
          Correo electrónico
        </label>
        <input
          id="correoElectronico"
          name="correoElectronico"
          type="email"
          required
          className={styles.entrada}
        />
      </div>

      <div className={styles.campo}>
        <label htmlFor="contrasena" className={styles.etiqueta}>
          Contraseña
        </label>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          required
          minLength={6}
          className={styles.entrada}
        />
      </div>

      {estado.error && <p className={styles.error}>{estado.error}</p>}

      <button type="submit" disabled={estaEnviando} className={styles.botonEnviar}>
        {estaEnviando ? "Creando cuenta..." : "Crear cuenta de administrador"}
      </button>
    </form>
  );
}
