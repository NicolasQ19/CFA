"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { iniciarSesion } from "@/dominio/autenticacion/acciones";

const ESTADO_INICIAL = { error: null };

function AvisoContrasenaRestablecida() {
  const parametros = useSearchParams();
  if (parametros.get("restablecida") !== "1") return null;
  return (
    <p role="status" className={styles.exito}>
      Tu contraseña se actualizó correctamente. Ya podés iniciar sesión con tu nueva clave.
    </p>
  );
}

export default function PaginaInicioSesion() {
  const [estado, ejecutarInicioSesion, estaEnviando] = useActionState(
    iniciarSesion,
    ESTADO_INICIAL
  );

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Iniciar sesión en CFA</h1>
      <p className={styles.subtitulo}>Contrataciones de Fútbol Argentino</p>

      <Suspense fallback={null}>
        <AvisoContrasenaRestablecida />
      </Suspense>

      <form action={ejecutarInicioSesion} className={styles.formulario}>
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
          <div className={styles.filaEtiqueta}>
            <label htmlFor="contrasena" className={styles.etiqueta}>
              Contraseña
            </label>
            <Link href="/recuperar-contrasena" className={styles.enlaceOlvido}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <input
            id="contrasena"
            name="contrasena"
            type="password"
            required
            className={styles.entrada}
          />
        </div>

        {estado.error && (
          <p className={styles.error}>{estado.error}</p>
        )}

        <button
          type="submit"
          disabled={estaEnviando}
          className={styles.botonEnviar}
        >
          {estaEnviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className={styles.piePagina}>
        ¿No tenés cuenta?{" "}
        <Link href="/registrarse" className={styles.enlace}>
          Registrarse
        </Link>
      </p>
    </main>
  );
}
