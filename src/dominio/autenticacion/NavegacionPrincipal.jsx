"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import styles from "./BarraNavegacion.module.css";

/**
 * Elige el enlace de la sección actual. Gana el más específico: en
 * /admin/usuarios se marca "Usuarios" y no "Moderación" (/admin).
 */
function enlaceActivo(enlaces, ruta) {
  let elegido = null;
  for (const { href } of enlaces) {
    const base = href.split("?")[0];
    const coincide = ruta === base || ruta.startsWith(`${base}/`);
    if (coincide && (!elegido || base.length > elegido.split("?")[0].length)) elegido = href;
  }
  return elegido;
}

/** Enlaces centrales de la barra en escritorio, con la sección actual marcada. */
export function EnlacesNavegacion({ enlaces }) {
  const activo = enlaceActivo(enlaces, usePathname());
  return (
    <ul className={styles.secciones}>
      {enlaces.map((enlace) => (
        <li key={enlace.href}>
          <Link href={enlace.href} className={styles.enlaceSeccion}
            aria-current={enlace.href === activo ? "page" : undefined}>
            {enlace.texto}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Botón de menú y panel desplegable para celulares y tablets. */
export function MenuMovil({ enlaces, children }) {
  const ruta = usePathname();
  const activo = enlaceActivo(enlaces, ruta);
  const [abierto, setAbierto] = useState(false);
  const idPanel = useId();

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarConEscape = (evento) => { if (evento.key === "Escape") setAbierto(false); };
    document.addEventListener("keydown", cerrarConEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <>
      <button type="button" className={styles.botonMenu} aria-expanded={abierto} aria-controls={idPanel}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"} onClick={() => setAbierto((valor) => !valor)}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
          {abierto ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {abierto && (
        // Al tocar un enlace o el botón de salir, el menú se cierra.
        <div id={idPanel} className={styles.panelMovil}
          onClick={(evento) => { if (evento.target.closest("a, button")) setAbierto(false); }}>
          <ul className={styles.listaMovil}>
            {enlaces.map((enlace) => (
              <li key={enlace.href}>
                <Link href={enlace.href} aria-current={enlace.href === activo ? "page" : undefined}>
                  {enlace.texto}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.panelAcciones}>{children}</div>
        </div>
      )}
    </>
  );
}
