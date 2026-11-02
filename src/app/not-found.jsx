import Link from "next/link";
import styles from "./estados.module.css";

export const metadata = { title: "Página no encontrada | CFA" };

/**
 * 404 de toda la aplicación: cubre las URL inexistentes y las cinco páginas que
 * llaman a `notFound()` (oferta, postulantes, edición de oferta, edición de
 * representado y el alta de administrador).
 */
export default function NoEncontrado() {
  return (
    <main className={styles.main}>
      <p className={styles.codigo}>Error 404</p>
      <h1 className={styles.titulo}>No encontramos esta página</h1>
      <p className={styles.detalle}>
        El enlace puede estar vencido, la oferta pudo haberse cerrado o quizás no tengas
        permiso para ver este contenido.
      </p>
      <div className={styles.acciones}>
        <Link href="/" className="botonBase botonPrimarioApp">Ir al inicio</Link>
        <Link href="/ofertas" className="botonBase botonSecundarioApp">Ver ofertas</Link>
      </div>
    </main>
  );
}
