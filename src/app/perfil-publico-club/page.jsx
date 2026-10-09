import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import { urlPublica } from "@/lib/club";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilClub } from "@/dominio/perfiles/consultas";
import { listarOfertasPublicadasDelClub } from "@/dominio/ofertas/consultas";
import { ETIQUETAS_PUESTO_PROFESIONAL, ETIQUETAS_TIPO_CONTRATO } from "@/tipos/dominio";
import styles from "./page.module.css";

export const metadata = {
  title: "Perfil del club | CFA",
  description: "Conocé la presentación institucional, instalaciones y ofertas laborales del club.",
};

export default async function PaginaPerfilPublicoClub({ searchParams }) {
  const parametros = await searchParams;
  const clubIdParam = parametros?.id;
  const usuario = await obtenerUsuarioActual();
  const esVistaPropia = !clubIdParam || clubIdParam === usuario?.id;

  if (esVistaPropia) {
    if (!usuario) redirect("/iniciar-sesion");
    if (usuario.rol !== "club") redirect("/");
  }

  const clubId = esVistaPropia ? usuario.id : clubIdParam;
  if (typeof clubId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubId)) notFound();
  const perfil = await obtenerPerfilClub(clubId);
  if (!perfil && !esVistaPropia) notFound();

  const ofertas = perfil ? await listarOfertasPublicadasDelClub(clubId) : [];
  const redes = [["sitio_web", "Sitio web"], ["instagram", "Instagram"], ["facebook", "Facebook"]]
    .map(([campo, etiqueta]) => ({ etiqueta, url: urlPublica(perfil?.[campo]) })).filter(red => red.url);
  const nombreClub = perfil?.nombre_club || "Perfil público del club";
  const ubicacion = [perfil?.localidad, perfil?.provincia].filter(Boolean).join(", ");

  return (
    <main className={styles.main}>
      <nav aria-label="Ruta de navegación" className={styles.navegacion}>
        <Link href="/ofertas">← Explorar ofertas</Link><span aria-hidden="true">/</span><span>Perfil del club</span>
      </nav>

      {esVistaPropia && <div className={styles.avisoPropio}>
        <p>Esta es la información de tu club que pueden consultar los candidatos.</p>
        <Link href="/mi-club" className={styles.enlaceEditar}>Editar perfil del club →</Link>
      </div>}

      <header className={styles.hero}>
        <div className={styles.identidad}>
          {perfil?.escudo_url ? <ImagenAmpliable src={perfil.escudo_url} alt={`Escudo de ${nombreClub}`} className={styles.escudo} /> : <div className={styles.escudoFallback} aria-hidden="true">{nombreClub.charAt(0).toUpperCase()}</div>}
          <div className={styles.identidadTexto}>
            <p className={styles.volanta}>PERFIL INSTITUCIONAL</p>
            <h1 className={styles.titulo}>{nombreClub}</h1>
            <p className={styles.subtitulo}>Conocé el club, sus espacios y las oportunidades para sumarte a su equipo.</p>
            <div className={styles.insignias}>
              {ubicacion && <span>{ubicacion}</span>}
              {perfil?.categoria && <span>{perfil.categoria}</span>}
            </div>
          </div>
        </div>
        {perfil && <a href="#ofertas" className={styles.botonPrimario}>Ver ofertas abiertas <span>{ofertas.length}</span><span aria-hidden="true">↓</span></a>}
      </header>

      {!perfil ? (
        <section className={styles.vacio}>
          <h2>Empezá por presentar tu club</h2>
          <p>Completá el nombre, la ubicación y la categoría. También podés sumar el escudo, la historia y las instalaciones.</p>
          <Link href="/mi-club" className={styles.botonPrimario}>Completar perfil del club →</Link>
        </section>
      ) : (
        <>
          <nav className={styles.secciones} aria-label="Secciones del perfil del club">
            <a href="#presentacion">Acerca del club</a><a href="#instalaciones">Instalaciones</a><a href="#contacto">Sitio web y redes</a><a href="#ofertas">Ofertas abiertas <span>{ofertas.length}</span></a>
          </nav>

          <div className={styles.distribucion}>
            <div className={styles.contenido}>
              <section id="presentacion" className={styles.tarjeta} aria-labelledby="tituloPresentacion">
                <p className={styles.volanta}>IDENTIDAD Y PROYECTO</p>
                <h2 id="tituloPresentacion" className={styles.tituloSeccion}>Acerca del club</h2>
                {perfil.descripcion ? <p className={styles.texto}>{perfil.descripcion}</p> : <p className={styles.sinInformacion}>Este club todavía no agregó una presentación institucional.</p>}
                {esVistaPropia && !perfil.descripcion && <Link href="/mi-club" className={styles.enlaceTexto}>Agregar presentación →</Link>}
              </section>

              <section id="instalaciones" className={styles.tarjeta} aria-labelledby="tituloInstalaciones">
                <p className={styles.volanta}>ESPACIOS DEL CLUB</p>
                <h2 id="tituloInstalaciones" className={styles.tituloSeccion}>Instalaciones</h2>
                <p className={styles.ayuda}>Información sobre los espacios y recursos que el club eligió compartir.</p>
                {perfil.instalaciones ? <p className={styles.texto}>{perfil.instalaciones}</p> : <p className={styles.sinInformacion}>Todavía no hay información publicada sobre las instalaciones.</p>}
                {esVistaPropia && !perfil.instalaciones && <Link href="/mi-club" className={styles.enlaceTexto}>Completar instalaciones →</Link>}
              </section>
            </div>

            <aside className={styles.lateral} aria-label="Información institucional y enlaces del club">
              <section className={styles.tarjeta} aria-labelledby="tituloDatos">
                <h2 id="tituloDatos" className={styles.tituloSeccion}>Datos institucionales</h2>
                <dl className={styles.datos}>
                  <Dato etiqueta="Nombre del club" valor={perfil.nombre_club} />
                  <Dato etiqueta="Localidad" valor={perfil.localidad} />
                  <Dato etiqueta="Provincia" valor={perfil.provincia} />
                  <Dato etiqueta="Categoría de competencia" valor={perfil.categoria} />
                </dl>
              </section>
              <section id="contacto" className={styles.tarjeta} aria-labelledby="tituloContacto">
                <h2 id="tituloContacto" className={styles.tituloSeccion}>Sitio web y redes</h2>
                <p className={styles.ayuda}>Visitá los enlaces publicados por el club para conocer más sobre su actividad.</p>
                {redes.length ? <ul className={styles.redes}>{redes.map(red => <li key={red.etiqueta}><a href={red.url} target="_blank" rel="noopener noreferrer">{red.etiqueta}<span aria-hidden="true">↗</span><span className={styles.soloLectores}> (abre en otra pestaña)</span></a></li>)}</ul> : <p className={styles.sinInformacion}>El club todavía no publicó enlaces a su sitio web o redes.</p>}
              </section>
            </aside>
          </div>

          <section className={styles.seccionOfertas} id="ofertas" aria-labelledby="tituloOfertas">
            <div className={styles.encabezadoOfertas}>
              <div><p className={styles.volanta}>OPORTUNIDADES EN ESTE CLUB</p><h2 id="tituloOfertas" className={styles.tituloSeccion}>Ofertas abiertas</h2><p className={styles.ayuda}>Abrí una búsqueda para conocer sus requisitos y las opciones de postulación.</p></div>
              <span className={styles.conteo}>{ofertas.length} {ofertas.length === 1 ? "oferta disponible" : "ofertas disponibles"}</span>
            </div>
            {ofertas.length === 0 ? (
              <div className={styles.vacio}><h3>Sin búsquedas abiertas por el momento</h3><p>Este club no tiene ofertas publicadas actualmente. Podés explorar oportunidades en otros clubes.</p><Link href="/ofertas" className={styles.enlaceTexto}>Ver todas las ofertas →</Link>{esVistaPropia && <Link href="/mis-ofertas/nueva" className={styles.enlaceTexto}>Crear una oferta para mi club →</Link>}</div>
            ) : (
              <ul className={styles.listaOfertas}>
                {ofertas.map(oferta => <li key={oferta.id}>
                  <Link href={`/ofertas/${oferta.id}`} className={styles.oferta}>
                    <span className={styles.estado}><span aria-hidden="true" />Búsqueda abierta</span>
                    <h3 className={styles.ofertaTitulo}>{ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado}{oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}</h3>
                    <div className={styles.ofertaDatos}><p><span>Ubicación</span><strong>{oferta.provincia || "Sin informar"}</strong></p><p><span>Competencia</span><strong>{oferta.categoria || "Sin informar"}</strong></p></div>
                    {oferta.descripcion && <p className={styles.resumenOferta}>{oferta.descripcion}</p>}
                    <div className={styles.pieOferta}><span className={styles.contrato}>{ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato] ?? oferta.tipo_contrato}</span><span className={styles.llamada}>Ver oferta <span aria-hidden="true">→</span></span></div>
                  </Link>
                </li>)}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Dato({ etiqueta, valor }) {
  return <div className={styles.dato}><dt>{etiqueta}</dt><dd>{valor || "Sin informar"}</dd></div>;
}
