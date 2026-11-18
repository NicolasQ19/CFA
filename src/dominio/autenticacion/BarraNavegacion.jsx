import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CampanaNotificaciones } from "./CampanaNotificaciones";
import { EnlacesNavegacion, MenuMovil } from "./NavegacionPrincipal";
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

const NOMBRE_ROL = {
  candidato: "Candidato",
  club: "Club",
  representante: "Representante",
  administrador: "Administrador",
};

/** Enlaces de la barra: los de la visita sin sesión, o los propios del rol. */
function enlacesSegunUsuario(usuario) {
  switch (usuario?.rol) {
    case "candidato":
      return [
        { href: "/ofertas", texto: "Ofertas" },
        { href: "/mis-postulaciones", texto: "Mis postulaciones" },
        { href: "/mi-perfil", texto: "Mi perfil" },
        { href: "/perfil-publico", texto: "Mi perfil público" },
        { href: "/planes", texto: "Planes" },
      ];
    case "club":
      return [
        { href: "/ofertas", texto: "Ofertas" },
        { href: "/mi-club", texto: "Mi club" },
        { href: "/perfil-publico-club", texto: "Mi perfil público" },
        { href: "/mis-ofertas", texto: "Mis ofertas" },
        ...(clubEstaVerificado(usuario) ? [{ href: "/buscar-candidatos", texto: "Buscar candidatos" }] : []),
        { href: "/planes", texto: "Planes" },
      ];
    case "representante":
      return [
        { href: "/ofertas", texto: "Ofertas" },
        { href: "/mi-perfil", texto: "Mi perfil" },
        { href: `/perfil-publico-representante?id=${usuario.id}`, texto: "Mi perfil público" },
        { href: "/mi-cartera", texto: "Mi cartera" },
        { href: "/planes", texto: "Planes" },
      ];
    case "administrador":
      return [
        { href: "/admin", texto: "Moderación" },
        { href: "/admin/usuarios", texto: "Usuarios" },
        { href: "/admin/metricas", texto: "Métricas" },
        { href: "/admin/suscripciones", texto: "Suscripciones" },
        { href: "/admin/clubes", texto: "Verificación de clubes" },
      ];
    default:
      return SECCIONES_PUBLICAS;
  }
}

function iniciales(nombre) {
  const palabras = String(nombre ?? "").trim().split(/\s+/).filter(Boolean);
  return palabras.slice(0, 2).map((palabra) => palabra[0].toUpperCase()).join("") || "?";
}

function DatosUsuario({ usuario, className }) {
  return (
    <div className={className}>
      <span className={styles.avatar} aria-hidden="true">{iniciales(usuario.nombre_completo)}</span>
      <span className={styles.usuarioDatos}>
        <span className={styles.usuarioNombre}>{usuario.nombre_completo}</span>
        <span className={styles.usuarioRol}>{NOMBRE_ROL[usuario.rol]}</span>
      </span>
    </div>
  );
}

export async function BarraNavegacion() {
  const usuario = await obtenerUsuarioActual();
  return <BarraNavegacionVista usuario={usuario} />;
}

/** Parte visual de la barra: recibe el usuario ya resuelto (o null si no hay sesión). */
export function BarraNavegacionVista({ usuario }) {
  const enlaces = enlacesSegunUsuario(usuario);
  // Con sesión hay más enlaces: el menú de escritorio necesita una pantalla más ancha.
  const claseNav = `${styles.nav} ${usuario ? styles.conSesion : ""}`;

  return (
    <header className={styles.header}>
      <nav className={claseNav} aria-label="Navegación principal">
        <Link href={usuario?.rol === "administrador" ? "/admin" : "/"} className={styles.marca}
          aria-label="CFA, Contrataciones de Fútbol Argentino. Ir al inicio">
          <Image src="/logo-cfa.png" alt="" width={225} height={112} priority className={styles.logo} />
          <span className={styles.marcaLema}>Contrataciones de<br />Fútbol Argentino</span>
        </Link>

        <EnlacesNavegacion enlaces={enlaces} />

        <div className={styles.acciones}>
          {!usuario && (
            <>
              <Link href="/iniciar-sesion" className={`${styles.enlace} ${styles.soloAmplia}`}>Iniciar sesión</Link>
              <Link href="/registrarse" className={`${styles.enlaceRegistro} ${styles.soloAmplia}`}>Registrarse</Link>
            </>
          )}

          {usuario && (
            <>
              <Suspense fallback={null}>
                <CampanaNotificaciones key={usuario.id} usuarioId={usuario.id} rol={usuario.rol} />
              </Suspense>
              <span className={`${styles.separador} ${styles.soloEscritorio}`} aria-hidden="true" />
              <DatosUsuario usuario={usuario} className={`${styles.usuario} ${styles.soloEscritorio}`} />
              <form action={cerrarSesion} className={styles.soloEscritorio}>
                <button type="submit" className={styles.botonSalir}>Cerrar sesión</button>
              </form>
            </>
          )}

          <MenuMovil enlaces={enlaces}>
            {!usuario && (
              <>
                <Link href="/registrarse" className={styles.botonMovilPrimario}>Registrarse</Link>
                <Link href="/iniciar-sesion" className={styles.botonMovilSecundario}>Iniciar sesión</Link>
              </>
            )}
            {usuario && (
              <>
                <DatosUsuario usuario={usuario} className={`${styles.usuario} ${styles.usuarioMovil}`} />
                <form action={cerrarSesion}>
                  <button type="submit" className={styles.botonMovilSecundario}>Cerrar sesión</button>
                </form>
              </>
            )}
          </MenuMovil>
        </div>
      </nav>
    </header>
  );
}
