import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import Link from "next/link";
import { listarOfertasPublicadas } from "@/dominio/ofertas/consultas";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  ETIQUETAS_TIPO_CONTRATO,
  PROVINCIAS_ARGENTINA,
} from "@/tipos/dominio";
import styles from "./page.module.css";

/** RF-18: listado público de ofertas con filtros por puesto, provincia y categoría. */
export default async function PaginaListadoOfertas({ searchParams }) {
  const parametros = await searchParams;
  const filtros = Object.fromEntries(["puesto", "provincia", "categoria", "tipoContrato"].map(campo => [campo, typeof parametros?.[campo] === "string" ? parametros[campo].trim() : ""]));

  const ofertas = await listarOfertasPublicadas({
    puesto: filtros?.puesto || undefined,
    provincia: filtros?.provincia || undefined,
    categoria: filtros?.categoria,
    tipoContrato: filtros?.tipoContrato || undefined,
  });
  const hayFiltros = Boolean(filtros?.puesto || filtros?.provincia || filtros?.categoria || filtros?.tipoContrato);

  return (
    <main className={styles.main}>
      <header className={styles.cabecera}>
        <div>
          <p className={styles.sobretitulo}>OPORTUNIDADES EN EL FÚTBOL ARGENTINO</p>
          <h1 className={styles.titulo}>Ofertas laborales</h1>
          <p className={styles.subtitulo}>Explorá búsquedas de clubes para jugadores, cuerpo técnico y staff. Encontrá una oferta acorde a tu perfil.</p>
        </div>
        <a href="#resultados" className={styles.enlaceCabecera}>Explorar ofertas <span aria-hidden="true">↗</span></a>
      </header>

      <div className={styles.distribucion}>
      <aside className={styles.panelFiltros} aria-labelledby="tituloFiltros">
        <div className={styles.encabezadoFiltros}>
          <h2 id="tituloFiltros">Encontrá tu oportunidad</h2>
          <p>Elegí los criterios y aplicá los filtros.</p>
        </div>
      <form className={styles.formularioFiltros} method="get" key={JSON.stringify(filtros)}>
        <label htmlFor="filtroPuesto" className={styles.etiquetaFiltro}>Puesto profesional</label>
        <select id="filtroPuesto" name="puesto" defaultValue={filtros?.puesto ?? ""} className={styles.entradaFiltro}>
          <option value="">Todos los puestos</option>
          {Object.entries(ETIQUETAS_PUESTO_PROFESIONAL).map(([clave, texto]) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
        <label htmlFor="filtroProvincia" className={styles.etiquetaFiltro}>Provincia</label>
        <select id="filtroProvincia" name="provincia" defaultValue={filtros?.provincia ?? ""} className={styles.entradaFiltro}>
          <option value="">Todas las provincias</option>
          {PROVINCIAS_ARGENTINA.map((provincia) => (
            <option key={provincia} value={provincia}>
              {provincia}
            </option>
          ))}
        </select>
        <label htmlFor="filtroCategoria" className={styles.etiquetaFiltro}>Categoría de competencia</label>
        <input
          id="filtroCategoria"
          name="categoria"
          placeholder="Ej: Primera División"
          defaultValue={filtros?.categoria ?? ""}
          className={styles.entradaFiltro}
        />
        <label htmlFor="filtroContrato" className={styles.etiquetaFiltro}>Tipo de contrato</label>
        <select id="filtroContrato" name="tipoContrato" defaultValue={filtros?.tipoContrato ?? ""} className={styles.entradaFiltro}>
          <option value="">Todos los tipos</option>
          {Object.entries(ETIQUETAS_TIPO_CONTRATO).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
        </select>
        <button type="submit" className={styles.botonFiltrar}>
          Aplicar filtros
        </button>
        {hayFiltros && <Link href="/ofertas" className={styles.limpiarFiltros}>Limpiar filtros</Link>}
      </form>
        <p className={styles.notaFiltros}>Solo se muestran ofertas publicadas y abiertas a postulaciones.</p>
      </aside>

      <section id="resultados" className={styles.resultados} aria-labelledby="tituloResultados">
        <div className={styles.cabeceraResultados}>
          <div>
            <h2 id="tituloResultados">{hayFiltros ? "Resultados de tu búsqueda" : "Ofertas disponibles"}</h2>
            <p>{ofertas.length} {ofertas.length === 1 ? "oportunidad encontrada" : "oportunidades encontradas"}</p>
          </div>
          <span className={styles.orden}>Más recientes primero</span>
        </div>
        {hayFiltros && <div className={styles.filtrosActivos} aria-label="Filtros aplicados">
          {filtros.puesto && <span>{ETIQUETAS_PUESTO_PROFESIONAL[filtros.puesto] ?? filtros.puesto}</span>}
          {filtros.provincia && <span>{filtros.provincia}</span>}
          {filtros.categoria && <span>{filtros.categoria}</span>}
          {filtros.tipoContrato && <span>{ETIQUETAS_TIPO_CONTRATO[filtros.tipoContrato] ?? filtros.tipoContrato}</span>}
        </div>}
      <ul className={styles.lista}>
        {ofertas.length === 0 && (
          <li className={styles.itemVacio}>
            <span className={styles.iconoVacio} aria-hidden="true">⌕</span>
            <h3>{hayFiltros ? "No encontramos ofertas con esos criterios" : "Todavía no hay ofertas disponibles"}</h3>
            <p>{hayFiltros ? "Probá con otro puesto, provincia o categoría para ampliar la búsqueda." : "Las nuevas búsquedas de los clubes aparecerán acá cuando sean publicadas."}</p>
            {hayFiltros && <Link href="/ofertas" className={styles.botonFiltrar}>Ver todas las ofertas</Link>}
          </li>
        )}
        {ofertas.map((oferta) => {
          const club = oferta.perfiles_club;
          return (
            <li key={oferta.id}>
              <Link
                href={`/ofertas/${oferta.id}`}
                className={styles.tarjeta}
              >
                <div className={styles.lineaSuperior}>
                  <span className={styles.estado}><span aria-hidden="true" />Búsqueda abierta</span>
                  {oferta.creada_en && <time dateTime={oferta.creada_en} title="Fecha de creación de la oferta">{new Date(oferta.creada_en).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</time>}
                </div>
                <div className={styles.tarjetaContenido}>
                  {club?.escudo_url ? (
                    <ImagenAmpliable
                      src={club.escudo_url}
                      alt={`Escudo de ${club.nombre_club ?? "club"}`}
                      className={styles.escudo}
                    />
                  ) : (
                    <div className={styles.escudoFallback}>
                      {club?.nombre_club ? club.nombre_club.charAt(0).toUpperCase() : "⚽"}
                    </div>
                  )}
                  <div className={styles.datosOferta}>
                    <p className={styles.clubNombre}>
                      {club?.nombre_club ?? "Club"}
                    </p>
                    <h3 className={styles.ofertaTitulo}>
                      {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado}
                      {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
                    </h3>
                  </div>
                </div>
                <div className={styles.datosResumen}>
                  <p><span>Ubicación</span><strong>{oferta.provincia || "Sin especificar"}</strong></p>
                  <p><span>Competencia</span><strong>{oferta.categoria || "Sin especificar"}</strong></p>
                </div>
                <p className={styles.descripcion}>{oferta.descripcion || "Conocé los detalles y requisitos de esta búsqueda."}</p>
                <div className={styles.pieTarjeta}>
                  <span className={styles.contrato}>{ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato] ?? oferta.tipo_contrato}</span>
                  <span className={styles.verOferta}>Ver oferta <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      </section>
      </div>
    </main>
  );
}
