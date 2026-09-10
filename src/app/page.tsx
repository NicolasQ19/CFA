import Link from "next/link";
import styles from "./page.module.css";

export default function PaginaInicio() {
  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>
        Contrataciones de Fútbol Argentino
      </h1>
      <p className={styles.descripcion}>
        La plataforma que conecta candidatos, representantes y clubes de fútbol argentino —
        para jugadores, cuerpo técnico y staff deportivo, en todas las categorías.
      </p>

      <div className={styles.acciones}>
        <Link href="/ofertas" className={styles.botonPrimario}>
          Ver ofertas
        </Link>
        <Link href="/registrarse" className={styles.botonSecundario}>
          Crear cuenta
        </Link>
      </div>
    </main>
  );
}
