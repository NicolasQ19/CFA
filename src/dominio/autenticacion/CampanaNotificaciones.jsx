"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ETIQUETAS_PUESTO_PROFESIONAL } from "@/tipos/dominio";
import { claveAlmacenLecturas, interpretarLecturas, estaLeido, marcarAvisoLeido, contarSinLeer } from "@/lib/lectura-notificaciones";
import styles from "./CampanaNotificaciones.module.css";

export function CampanaNotificaciones({ rol = "administrador", usuarioId }) {
  const [abierta, setAbierta] = useState(false);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(false);
  const [lecturas, setLecturas] = useState([]);
  const [limite, setLimite] = useState(8);
  const [errorLecturas, setErrorLecturas] = useState(false);
  const claveAlmacen = claveAlmacenLecturas(usuarioId, rol);
  const contenedor = useRef(null);
  const boton = useRef(null);
  const pathname = usePathname();
  const parametros = useSearchParams();

  useEffect(() => {
    try { setLecturas(interpretarLecturas(localStorage.getItem(claveAlmacen))); }
    catch { setErrorLecturas(true); }
    function sincronizar(evento) {
      if (evento.key === claveAlmacen || evento.key === null) {
        setLecturas(interpretarLecturas(evento.key === null ? null : evento.newValue));
      }
    }
    window.addEventListener("storage", sincronizar);
    return () => window.removeEventListener("storage", sincronizar);
  }, [claveAlmacen]);

  function abrirAviso(aviso) {
    let guardadas = [];
    try { guardadas = interpretarLecturas(localStorage.getItem(claveAlmacen)); } catch { /* Mantener la lectura durante la sesión. */ }
    const nuevas = marcarAvisoLeido(aviso, [...lecturas, ...guardadas]);
    setLecturas(nuevas);
    try {
      localStorage.setItem(claveAlmacen, JSON.stringify(nuevas));
      setErrorLecturas(false);
    } catch { setErrorLecturas(true); }
    setAbierta(false);
  }

  useEffect(() => { setAbierta(false); }, [pathname, parametros]);

  useEffect(() => {
    const controlador = new AbortController();
    let consultando = false;
    async function actualizar() {
      if (document.hidden || consultando) return;
      consultando = true;
      try {
        const respuesta = await fetch(rol === "administrador" ? "/api/admin/notificaciones" : "/api/notificaciones", {
          cache: "no-store", signal: controlador.signal,
        });
        if (!respuesta.ok) throw new Error("No se pudieron cargar los avisos");
        const resultado = await respuesta.json();
        if (rol === "administrador") {
          resultado.notificaciones = resultado.notificaciones.map(oferta => ({
            id: oferta.id,
            origen: oferta.perfiles_club?.nombre_club ?? "Club sin nombre",
            mensaje: "creó una nueva oferta.",
            detalle: ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado,
            fecha: oferta.creada_en,
            href: `/admin?oferta=${oferta.id}#oferta-${oferta.id}`,
          }));
        }
        if (!controlador.signal.aborted) { setDatos(resultado); setError(false); }
      } catch (e) {
        if (!controlador.signal.aborted) setError(true);
      } finally { consultando = false; }
    }
    actualizar();
    const intervalo = setInterval(actualizar, 15000);
    window.addEventListener("focus", actualizar);
    document.addEventListener("visibilitychange", actualizar);
    return () => {
      controlador.abort();
      clearInterval(intervalo);
      window.removeEventListener("focus", actualizar);
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, [abierta, pathname, parametros, rol]);

  useEffect(() => {
    if (!abierta) return;
    function cerrarFuera(evento) {
      if (!contenedor.current?.contains(evento.target)) setAbierta(false);
    }
    function cerrarEscape(evento) {
      if (evento.key === "Escape") { setAbierta(false); boton.current?.focus(); }
    }
    document.addEventListener("pointerdown", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [abierta]);

  const avisos = datos?.notificaciones ?? [];
  const total = contarSinLeer(avisos, lecturas);
  const ordenados = [...avisos].sort((a, b) => Number(estaLeido(a, lecturas)) - Number(estaLeido(b, lecturas)));
  const textos = {
    administrador: { contador: "ofertas pendientes", ayuda: "Nuevas ofertas para revisar.", vacio: "No hay ofertas pendientes de revisión.", href: "/admin?estado=pendiente_moderacion", enlace: "Ver todas las ofertas pendientes" },
    club: { contador: "avisos del club", ayuda: "Verificación del club, novedades de ofertas y postulaciones pendientes de revisión.", vacio: "No hay novedades del club.", href: "/mi-club", enlace: "Ver mi club" },
    candidato: { contador: "postulaciones actualizadas", ayuda: "Último estado informado por el club en cada postulación actualizada.", vacio: "Todavía no hay cambios de estado en tus postulaciones.", href: "/mis-postulaciones", enlace: "Ver mis postulaciones" },
  }[rol];
  return (
    <div className={styles.contenedor} ref={contenedor} onBlur={(evento) => {
      if (!evento.currentTarget.contains(evento.relatedTarget)) setAbierta(false);
    }}>
      <button ref={boton} type="button" className={styles.campana}
        aria-label={`Notificaciones: ${datos ? `${total} sin leer` : "consultando"}`}
        aria-expanded={abierta} aria-controls="avisos-notificaciones"
        onClick={() => setAbierta(valor => !valor)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4M12 2V1" />
        </svg>
        {total > 0 && <span className={styles.contador} aria-hidden="true">{total > 99 ? "99+" : total}</span>}
        {error && <span className={styles.errorIndicador} aria-hidden="true">!</span>}
      </button>
      {abierta && <section id="avisos-notificaciones" className={styles.panel} aria-labelledby="titulo-avisos">
        <div className={styles.cabecera}>
          <h2 id="titulo-avisos">Notificaciones</h2>
          {datos && <span>{total} sin leer</span>}
        </div>
        <p className={styles.ayuda}>{textos.ayuda} Se actualiza cada 15 segundos.</p>
        {errorLecturas && <p className={styles.mensaje} role="status">No pudimos guardar las lecturas en este navegador. Se conservarán durante esta sesión.</p>}
        {error && <p className={styles.mensaje} role="alert">No pudimos actualizar los avisos. Volveremos a intentar automáticamente.</p>}
        {!datos && !error && <p className={styles.mensaje} role="status">Cargando notificaciones…</p>}
        {datos && avisos.length === 0 && <p className={styles.mensaje}>{textos.vacio}</p>}
        {datos && avisos.length > 0 && total === 0 && <p className={styles.ayuda}>Estás al día. Ya leíste todas las notificaciones.</p>}
        {datos && avisos.length > 0 && <ul className={styles.lista}>
          {ordenados.slice(0, limite).map(aviso => <li key={aviso.id}>
            <Link href={aviso.href} className={styles.aviso} data-leida={estaLeido(aviso, lecturas)} onClick={() => abrirAviso(aviso)} onAuxClick={evento => { if (evento.button === 1) abrirAviso(aviso); }}>
              <span className={styles.punto} aria-hidden="true" />
              <div>
                <p><strong>{aviso.origen}</strong> {aviso.mensaje}</p>
                <span className={styles.puesto}>{aviso.detalle}</span>
                <time dateTime={aviso.fecha}>{new Date(aviso.fecha).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</time>
                {estaLeido(aviso, lecturas) && <span className={styles.estadoLectura}>Leída</span>}
              </div>
            </Link>
          </li>)}
        </ul>}
        {avisos.length > limite && <button type="button" className={styles.verMas} onClick={() => setLimite(valor => valor + 8)}>Ver más notificaciones</button>}
        <Link className={styles.verTodas} href={textos.href} onClick={() => setAbierta(false)}>
          {textos.enlace} →
        </Link>
      </section>}
    </div>
  );
}
