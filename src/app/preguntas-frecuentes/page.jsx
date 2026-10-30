import Link from "next/link";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { PREGUNTAS } from "@/lib/contenido-institucional";
import styles from "./page.module.css";

export const metadata = {
  title: "Preguntas frecuentes — CFA",
  description: "Dudas habituales sobre cuentas, ofertas, postulaciones y planes en CFA.",
};

/** Página pública con todas las preguntas frecuentes de la plataforma. */
export default async function PaginaPreguntasFrecuentes() {
  const usuario = await obtenerUsuarioActual();

  return (
    <main className={styles.main}>
      <header className={styles.cabecera}>
        <div className={styles.contenedor}>
          <p className={styles.volanta}>ANTES DE EMPEZAR</p>
          <h1 className={styles.titulo}>Preguntas frecuentes</h1>
          <p className={styles.bajada}>
            Todo lo que suelen consultar candidatos, clubes y representantes sobre cuentas,
            ofertas, postulaciones y planes.
          </p>
        </div>
      </header>

      <section className={styles.seccion}>
        <div className={styles.contenedor}>
          <div className={styles.preguntas}>
            {PREGUNTAS.map((pregunta) => (
              <details key={pregunta.titulo} className={styles.pregunta}>
                <summary>{pregunta.titulo}<span aria-hidden="true">+</span></summary>
                <p>{pregunta.texto}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cierre}>
        <div className={`${styles.contenedor} ${styles.cierreInterno}`}>
          <div>
            <h2 className={styles.tituloSeccion}>¿Te quedó alguna duda?</h2>
            <p className={styles.parrafo}>
              Mirá el recorrido completo de la plataforma o empezá a explorar las búsquedas publicadas.
            </p>
          </div>
          <div className={styles.acciones}>
            <Link href="/como-funciona" className={styles.botonPrimario}>Cómo funciona</Link>
            <Link href={usuario ? "/ofertas" : "/registrarse"} className={styles.botonSecundario}>
              {usuario ? "Ver ofertas" : "Crear cuenta"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
