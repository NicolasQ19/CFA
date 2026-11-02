"use client";

import Link from "next/link";
import styles from "../estados.module.css";

/** Error acotado al perfil público del representante; el resto usa /src/app/error.jsx. */
export default function ErrorPerfilRepresentante({ error, reset }) {
  return (
    <main className={styles.main}>
      <p className={styles.codigo}>Algo falló</p>
      <h1 className={styles.titulo}>No pudimos cargar el perfil</h1>
      <p className={styles.detalle}>Volvé a intentar en unos minutos.</p>
      <div className={styles.acciones}>
        <button type="button" onClick={reset} className="botonBase botonPrimarioApp">
          Reintentar
        </button>
        <Link href="/" className="botonBase botonSecundarioApp">Ir al inicio</Link>
      </div>
      {error?.digest && (
        <p className={styles.referencia}>Código de referencia: {error.digest}</p>
      )}
    </main>
  );
}
