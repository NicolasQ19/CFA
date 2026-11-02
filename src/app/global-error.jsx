"use client";

import { useEffect } from "react";
import "./globals.css";
import styles from "./estados.module.css";

/**
 * Último recurso: se usa cuando falla el propio layout raíz (por ejemplo, la
 * barra de navegación al leer la sesión). En ese caso `error.jsx` no alcanza,
 * porque vive dentro del layout que se rompió.
 *
 * Reemplaza al layout por completo, así que tiene que declarar `<html>` y
 * `<body>` e importar los estilos globales por su cuenta. Sin este archivo,
 * un fallo acá es la pantalla blanca de Next.
 */
export default function ErrorGlobal({ error, reset }) {
  useEffect(() => {
    console.error("Error en el layout raíz:", error);
  }, [error]);

  return (
    <html lang="es-AR">
      <body>
        <main className={styles.main}>
          <p className={styles.codigo}>CFA</p>
          <h1 className={styles.titulo}>La aplicación no pudo iniciarse</h1>
          <p className={styles.detalle}>
            Hubo un problema al cargar la página. Volvé a intentar en unos minutos.
          </p>
          <div className={styles.acciones}>
            <button type="button" onClick={reset} className="botonBase botonPrimarioApp">
              Reintentar
            </button>
            {/* Enlace nativo a propósito: <Link> haría navegación suave y volvería a
                montar el árbol que acaba de fallar. Acá hace falta recarga completa. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="botonBase botonSecundarioApp">Ir al inicio</a>
          </div>
          {error?.digest && (
            <p className={styles.referencia}>Código de referencia: {error.digest}</p>
          )}
        </main>
      </body>
    </html>
  );
}
