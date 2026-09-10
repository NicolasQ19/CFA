import Link from "next/link";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { cerrarSesion } from "@/dominio/autenticacion/acciones";
import styles from "./BarraNavegacion.module.css";

export async function BarraNavegacion() {
  const usuario = await obtenerUsuarioActual();

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.marca}>
          CFA
        </Link>

        <div className={styles.acciones}>
          <Link href="/ofertas" className={styles.enlace}>
            Ofertas
          </Link>

          {!usuario && (
            <>
              <Link href="/iniciar-sesion" className={styles.enlace}>
                Iniciar sesión
              </Link>
              <Link href="/registrarse" className={styles.enlaceRegistro}>
                Registrarse
              </Link>
            </>
          )}

          {usuario?.rol === "candidato" && (
            <Link href="/perfil-publico" className={styles.enlace}>
              Mi perfil
            </Link>
          )}

          {usuario?.rol === "club" && (
            <>
              <Link href="/mi-club" className={styles.enlace}>
                Mi club
              </Link>
              <Link href="/mis-ofertas" className={styles.enlace}>
                Mis ofertas
              </Link>
            </>
          )}

          {usuario?.rol === "administrador" && (
            <Link href="/admin" className={styles.enlace}>
              Moderación
            </Link>
          )}

          {usuario && (
            <form action={cerrarSesion}>
              <button type="submit" className={styles.botonSalir}>
                Cerrar sesión
              </button>
            </form>
          )}
        </div>
      </nav>
    </header>
  );
}
