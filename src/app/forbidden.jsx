import Link from "next/link";
import { ETIQUETAS_ROL_USUARIO } from "@/tipos/dominio";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import styles from "./estados.module.css";

export const metadata = { title: "Sección no disponible para tu rol | CFA" };

/**
 * 403 de la aplicación: la ruta existe, pero pertenece a otro rol.
 *
 * Antes estos casos redirigían al inicio y parecía que el enlace estaba roto.
 * Ahora la URL se mantiene y la respuesta sale con estado 403, de modo que
 * quede claro que el acceso se denegó y no que la página no exista.
 *
 * La renderiza `forbidden()`, al que llaman el guard de cada página y la
 * reescritura del middleware (`/sin-permiso`).
 */

/** A dónde sí puede ir cada rol. Evita dejar a la persona sin salida. */
const DESTINOS_POR_ROL = {
  candidato: [
    { href: "/mis-postulaciones", texto: "Mis postulaciones" },
    { href: "/mi-perfil", texto: "Mi perfil" },
  ],
  representante: [
    { href: "/mi-cartera", texto: "Mi cartera" },
    { href: "/mi-perfil", texto: "Mi perfil" },
  ],
  club: [
    { href: "/mis-ofertas", texto: "Mis ofertas" },
    { href: "/mi-club", texto: "Mi club" },
  ],
  administrador: [
    { href: "/admin", texto: "Moderación" },
    { href: "/admin/usuarios", texto: "Usuarios" },
  ],
};

export default async function SinPermiso() {
  // Si la sesión no se puede leer, la pantalla igual tiene que salir: el 403
  // nunca debe convertirse en un error de aplicación.
  let usuario = null;
  try {
    usuario = await obtenerUsuarioActual();
  } catch {
    usuario = null;
  }

  const etiquetaRol = usuario?.rol ? ETIQUETAS_ROL_USUARIO[usuario.rol] : null;
  const destinos = usuario?.rol ? DESTINOS_POR_ROL[usuario.rol] ?? [] : [];

  return (
    <main className={styles.main}>
      <p className={styles.codigo}>Error 403</p>
      <h1 className={styles.titulo}>Esta sección no está disponible para tu rol</h1>
      <p className={styles.detalle}>
        {etiquetaRol
          ? `Tu cuenta es de tipo ${etiquetaRol} y esta página pertenece a otro rol de la
             plataforma. No es un problema del enlace: el acceso está restringido.`
          : `Esta página pertenece a otro rol de la plataforma. Iniciá sesión con una
             cuenta habilitada para verla.`}
      </p>

      <div className={styles.acciones}>
        {destinos.map(({ href, texto }, indice) => (
          <Link
            key={href}
            href={href}
            className={`botonBase ${indice === 0 ? "botonPrimarioApp" : "botonSecundarioApp"}`}
          >
            {texto}
          </Link>
        ))}
        {!usuario && (
          <Link href="/iniciar-sesion" className="botonBase botonPrimarioApp">
            Iniciar sesión
          </Link>
        )}
        <Link href="/ofertas" className="botonBase botonSecundarioApp">Ver ofertas</Link>
      </div>
    </main>
  );
}
