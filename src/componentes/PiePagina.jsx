import Link from "next/link";
import styles from "./PiePagina.module.css";

export function PiePagina() {
  return (
    <footer className={styles.footer}>
      <div className={styles.contenido}>
        <div className={styles.marca}>
          <Link href="/" className={styles.logo} aria-label="CFA, ir al inicio">CFA<span aria-hidden="true">.</span></Link>
          <p className={styles.nombre}>Contrataciones de Fútbol Argentino</p>
          <p className={styles.descripcion}>Un espacio para conectar el talento con las oportunidades de los clubes. Jugadores, cuerpo técnico y staff, en una misma plataforma.</p>
        </div>
        <nav aria-label="Explorar CFA" className={styles.columna}>
          <h2>Explorá la plataforma</h2>
          <Link href="/ofertas">Ofertas laborales</Link>
          <Link href="/#sobre-cfa">Qué es CFA</Link>
          <Link href="/#como-funciona">Cómo funciona</Link>
        </nav>
        <nav aria-label="Información de CFA" className={styles.columna}>
          <h2>Empezá por acá</h2>
          <Link href="/#para-quien">Candidatos, clubes y representantes</Link>
          <Link href="/#preguntas-frecuentes">Preguntas frecuentes</Link>
          <Link href="/iniciar-sesion">Ingresar a mi cuenta</Link>
        </nav>
      </div>
      <div className={styles.base}>
        <p>© {new Date().getFullYear()} CFA · Proyecto académico de la UNAHUR.</p>
        <p>Desarrollado por Logan Casals y Nicolás Quintana.</p>
      </div>
    </footer>
  );
}
