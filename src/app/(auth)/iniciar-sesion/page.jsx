"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { iniciarSesion } from "@/dominio/autenticacion/acciones";
import { CampoContrasena } from "@/dominio/autenticacion/CampoContrasena";

const ESTADO_INICIAL = { error: null };

const VENTAJAS = [
  "Seguí el estado de cada postulación desde tu panel.",
  "Recibí avisos cuando una búsqueda cambia de etapa.",
  "Gestioná tu perfil, tus ofertas o tu cartera en un solo lugar.",
];

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
      <div className={styles.columnaFormulario}>
        <div className={styles.panel}>
          <p className={styles.volanta}>ACCESO A TU CUENTA</p>
          <h1 className={styles.titulo}>Iniciar sesión</h1>
          <p className={styles.subtitulo}>
            Ingresá con el correo con el que te registraste en CFA.
          </p>

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
                autoComplete="email"
                autoFocus
                placeholder="nombre@correo.com"
                className={styles.entrada}
              />
            </div>

            <CampoContrasena
              etiqueta="Contraseña"
              autoComplete="current-password"
              accion={
                <Link href="/recuperar-contrasena" className={styles.enlaceOlvido}>
                  ¿Olvidaste tu contraseña?
                </Link>
              }
            />

            {estado.error && (
              <p role="alert" className={styles.error}>{estado.error}</p>
            )}

            <button type="submit" disabled={estaEnviando} className={styles.botonEnviar}>
              {estaEnviando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className={styles.piePagina}>
            ¿No tenés cuenta?{" "}
            <Link href="/registrarse" className={styles.enlace}>Creá una gratis</Link>
          </p>
        </div>
      </div>

      <aside className={styles.columnaInfo} aria-label="Qué podés hacer con tu cuenta">
        <p className={styles.volantaInfo}>CFA</p>
        <h2 className={styles.tituloInfo}>Tu carrera en el fútbol, organizada.</h2>
        <ul className={styles.ventajas}>
          {VENTAJAS.map((ventaja) => (
            <li key={ventaja}><span aria-hidden="true">✓</span>{ventaja}</li>
          ))}
        </ul>
        <div className={styles.enlacesInfo}>
          <Link href="/ofertas">Ver ofertas publicadas →</Link>
          <Link href="/como-funciona">Cómo funciona la plataforma →</Link>
        </div>
      </aside>
    </main>
  );
}
