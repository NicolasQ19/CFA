"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarRecuperacionContrasena } from "@/dominio/autenticacion/acciones";
import styles from "./page.module.css";

const ESTADO_INICIAL = { error: null, exito: false, mensaje: null };

/** CU-03 / RF-03: solicitud de correo electrónico para restablecer contraseña olvidada. */
export default function PaginaRecuperarContrasena() {
  const [estado, ejecutarSolicitud, estaEnviando] = useActionState(
    solicitarRecuperacionContrasena,
    ESTADO_INICIAL
  );

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Recuperar contraseña</h1>
      <p className={styles.subtitulo}>
        Ingresá el correo electrónico de tu cuenta y te enviaremos un enlace seguro para definir una nueva clave.
      </p>

      <form action={ejecutarSolicitud} className={styles.formulario}>
        <div className={styles.campo}>
          <label htmlFor="correoElectronico" className={styles.etiqueta}>
            Correo electrónico
          </label>
          <input
            id="correoElectronico"
            name="correoElectronico"
            type="email"
            required
            placeholder="tu-correo@ejemplo.com"
            className={styles.entrada}
          />
        </div>

        {estado?.error && (
          <p role="alert" className={styles.error}>
            {estado.error}
          </p>
        )}

        {estado?.exito && estado?.mensaje && (
          <p role="status" className={styles.exito}>
            {estado.mensaje}
          </p>
        )}

        <button
          type="submit"
          disabled={estaEnviando}
          className={styles.botonEnviar}
        >
          {estaEnviando ? "Enviando enlace..." : "Enviar enlace de recuperación"}
        </button>
      </form>

      <p className={styles.piePagina}>
        ¿Recordaste tu contraseña?{" "}
        <Link href="/iniciar-sesion" className={styles.enlace}>
          Volver a iniciar sesión
        </Link>
      </p>
    </main>
  );
}
