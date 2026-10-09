import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilRepresentante, obtenerPerfilPublicoRepresentante } from "@/dominio/representantes/consultas";
import { urlPublica } from "@/lib/club";
import styles from "./page.module.css";

export const metadata = { title: "Perfil del representante | CFA", description: "Presentación profesional, especialización y contacto del representante en CFA." };

export default async function PaginaPerfilPublicoRepresentante({ searchParams }) {
  const parametros = await searchParams;
  const usuario = await obtenerUsuarioActual();
  if (!parametros?.id && !usuario) redirect("/iniciar-sesion");
  if (!parametros?.id && usuario?.rol !== "representante") redirect("/");
  if (!parametros?.id) redirect(`/perfil-publico-representante?id=${usuario.id}`);
  const id = parametros?.id ?? usuario.id;
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const esPropio = usuario?.id === id && usuario.rol === "representante" && usuario.cuenta_activa;
  // El dueño puede revisar su perfil con RLS incluso antes de habilitar la lectura pública.
  const perfil = esPropio ? await obtenerPerfilRepresentante(id) : await obtenerPerfilPublicoRepresentante(id);
  if (!perfil && !esPropio) notFound();
  const nombre = perfil?.nombre_agencia || (esPropio ? usuario.nombre_completo : "Representante");
  const sitioWeb = urlPublica(perfil?.sitio_web);
  const correo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil?.correo_contacto ?? "") ? perfil.correo_contacto : null;
  const telefono = /^[+\d\s().-]+$/.test(perfil?.telefono ?? "") ? perfil.telefono.replace(/[^+\d]/g, "") : null;

  return <main className={styles.main}>
    {esPropio && <div className={styles.avisoPropio}><p>Mi perfil público · Esta vista muestra tus datos guardados.</p><Link href="/mi-perfil">Editar mi perfil →</Link></div>}
    <header className={styles.hero}>
      {perfil?.foto_url ? <ImagenAmpliable src={perfil.foto_url} alt={`Foto o logo de ${nombre}`} className={styles.foto} /> : <div className={styles.avatar} aria-hidden="true">{nombre.trim().charAt(0).toUpperCase()}</div>}
      <div><p className={styles.volanta}>REPRESENTANTE / AGENCIA</p><h1>{nombre}</h1>
        <div className={styles.insignias}>{perfil?.nacionalidad && <span>{perfil.nacionalidad}</span>}{perfil?.zona_trabajo && <span>{perfil.zona_trabajo}</span>}</div>
      </div>
    </header>
    <div className={styles.distribucion}>
      <div className={styles.informacion}>
        <section className={styles.tarjeta}><h2>Presentación profesional</h2><p>{perfil?.presentacion || "Este representante todavía no agregó una presentación."}</p></section>
        <section className={styles.tarjeta}><h2>Especialización y alcance</h2><dl className={styles.datos}>
          <div><dt>Especialización</dt><dd>{perfil?.especializacion || "Sin informar"}</dd></div>
          <div><dt>Zona de trabajo</dt><dd>{perfil?.zona_trabajo || "Sin informar"}</dd></div>
          <div><dt>País de radicación</dt><dd>{perfil?.nacionalidad || "Sin informar"}</dd></div>
        </dl></section>
      </div>
      <aside className={styles.tarjeta} aria-labelledby="tituloContacto"><h2 id="tituloContacto">Contacto profesional</h2><p className={styles.ayuda}>Contactá al representante para conocer su trabajo y servicios.</p>
        {perfil?.correo_contacto && <div className={styles.contacto}><span>Correo electrónico</span>{correo ? <a href={`mailto:${encodeURIComponent(correo)}`}>{correo}</a> : <p>{perfil.correo_contacto}</p>}</div>}
        {perfil?.telefono && <div className={styles.contacto}><span>Teléfono</span>{telefono ? <a href={`tel:${telefono}`}>{perfil.telefono}</a> : <p>{perfil.telefono}</p>}</div>}
        {sitioWeb && <a className={styles.botonSitio} href={sitioWeb} target="_blank" rel="noopener noreferrer">Sitio web / redes ↗</a>}
        {!perfil?.correo_contacto && !perfil?.telefono && !sitioWeb && <p className={styles.ayuda}>Todavía no hay datos de contacto publicados.</p>}
      </aside>
    </div>
    {esPropio && <p className={styles.nota}>Para compartir este perfil, copiá la dirección de esta página. La cartera y las postulaciones se gestionan de forma privada desde <Link href="/mi-cartera">Mi cartera</Link>.</p>}
  </main>;
}
