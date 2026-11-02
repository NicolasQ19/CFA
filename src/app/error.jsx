"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./estados.module.css";

/**
 * Error de cualquier página de la aplicación: reemplaza la pantalla blanca de
 * Next cuando falla una consulta a Supabase o una acción del servidor.
 *
 * La barra de navegación sigue visible porque este archivo se renderiza dentro
 * del layout raíz. Si lo que falla es el layout, el que responde es
 * `global-error.jsx`.
 */
export default function ErrorDeAplicacion({ error, reset }) {
  useEffect(() => {
    // En producción el mensaje real no llega al navegador: Next solo manda
    // `digest`, y el detalle queda en los logs del servidor.
    console.error("Error en la página:", error);
  }, [error]);

  return (
    <main className={styles.main}>
      <p className={styles.codigo}>Algo falló</p>
      <h1 className={styles.titulo}>No pudimos cargar esta página</h1>
      <p className={styles.detalle}>
        Puede ser una caída momentánea de la conexión con el servidor. Volvé a intentar;
        si sigue pasando, avisale al administrador.
      </p>
      <div className={styles.acciones}>
        <button type="button" onClick={reset} className="botonBase botonPrimarioApp">
          Reintentar
        </button>
        <Link href="/" className="botonBase botonSecundarioApp">Ir al inicio</Link>
      </div>
      {error?.digest && (
        <p className={styles.referencia}>
          Código de referencia: {error.digest}
        </p>
      )}
    </main>
  );
}
