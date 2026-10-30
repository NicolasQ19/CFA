import Link from "next/link";
import { Suspense } from "react";
import { CampanaNotificaciones } from "./CampanaNotificaciones";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { cerrarSesion } from "@/dominio/autenticacion/acciones";
import styles from "./BarraNavegacion.module.css";
import { clubEstaVerificado } from "@/lib/verificacion-club";

/** Secciones públicas de la plataforma: tienen página propia y se ven siempre. */
const SECCIONES_PUBLICAS = [
  { href: "/ofertas", texto: "Ofertas" },
  { href: "/como-funciona", texto: "Cómo funciona" },
  { href: "/planes", texto: "Planes" },
  { href: "/preguntas-frecuentes", texto: "Preguntas frecuentes" },
];

export async function BarraNavegacion() {
  const usuario = await obtenerUsuarioActual();

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href={usuario?.rol === "administrador" ? "/admin" : "/"} className={styles.marca}>
          CFA
        </Link>

        {/* Las secciones públicas son la navegación de la visita: con sesión
            iniciada las reemplaza la barra propia del rol. */}
        {!usuario && (
          <div className={styles.secciones}>
            {SECCIONES_PUBLICAS.map((seccion) => (
              <Link key={seccion.href} href={seccion.href} className={styles.enlaceSeccion}>
                {seccion.texto}
              </Link>
            ))}
          </div>
        )}

        <div className={styles.acciones}>
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
            <>
              <Link href="/ofertas" className={styles.enlace}>Ofertas</Link>
              <Link href="/mis-postulaciones" className={styles.enlace}>
                Mis postulaciones
              </Link>
              <Link href="/mi-perfil" className={styles.enlace}>
                Mi perfil
              </Link>
              <Link href="/perfil-publico" className={styles.enlace}>
                Mi perfil público
              </Link>
            </>
          )}

          {usuario?.rol === "club" && (
            <>
              <Link href="/ofertas" className={styles.enlace}>Ofertas</Link>
              <Link href="/mi-club" className={styles.enlace}>
                Mi club
              </Link>
              <Link href="/perfil-publico-club" className={styles.enlace}>
                Mi perfil público
              </Link>
              <Link href="/mis-ofertas" className={styles.enlace}>
                Mis ofertas
              </Link>
              {clubEstaVerificado(usuario) && <Link href="/buscar-candidatos" className={styles.enlace}>
                Buscar candidatos
              </Link>}
            </>
          )}

          {usuario?.rol === "representante" && (
            <>
            <Link href="/ofertas" className={styles.enlace}>Ofertas</Link>
            <Link href="/mi-perfil" className={styles.enlace}>Mi perfil</Link>
            <Link href={`/perfil-publico-representante?id=${usuario.id}`} className={styles.enlace}>Mi perfil público</Link>
            <Link href="/mi-cartera" className={styles.enlace}>
              Mi cartera
            </Link>
            </>
          )}

          {usuario?.rol === "administrador" && (
            <>
            <Link href="/admin" className={styles.enlace}>
              Moderación
            </Link>
            <Link href="/admin/usuarios" className={styles.enlace}>
              Usuarios
            </Link>
            <Link href="/admin/metricas" className={styles.enlace}>
              Métricas
            </Link>
            <Link href="/admin/suscripciones" className={styles.enlace}>Suscripciones</Link>
            <Link href="/admin/clubes" className={styles.enlace}>Verificación de clubes</Link>
            </>
          )}

          {["club", "candidato", "representante"].includes(usuario?.rol) && (
            <Link href="/planes" className={styles.enlace}>
              Planes
            </Link>
          )}

          {["administrador", "club", "candidato", "representante"].includes(usuario?.rol) && (
            <Suspense fallback={null}><CampanaNotificaciones key={usuario.id} usuarioId={usuario.id} rol={usuario.rol} /></Suspense>
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
