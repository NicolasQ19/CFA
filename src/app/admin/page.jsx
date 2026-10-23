import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import Link from "next/link";
import { redirect } from "next/navigation";//comentario
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { listarOfertasParaAdministracion } from "@/dominio/ofertas/consultas";
import { BotonesModeracion } from "@/dominio/ofertas/BotonesModeracion";
import { ETIQUETAS_ESTADO_OFERTA, ETIQUETAS_PUESTO_PROFESIONAL, ETIQUETAS_TIPO_CONTRATO } from "@/tipos/dominio";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function formatearFecha(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Dato({ etiqueta, valor }) {
  if (!valor) return null;
  return (
    <div className={styles.dato}>
      <dt className={styles.datoEtiqueta}>{etiqueta}</dt>
      <dd className={styles.datoValor}>{valor}</dd>
    </div>
  );
}

/** RF-25: el administrador modera las ofertas pendientes antes de publicarlas. */
export default async function PaginaAdministracion({ searchParams }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "administrador") redirect("/");

  const parametros = await searchParams;
  const estado = Object.hasOwn(ETIQUETAS_ESTADO_OFERTA, parametros?.estado ?? "") ? parametros.estado : "";
  const pagina = Math.min(100000, Math.max(1, Number.parseInt(parametros?.pagina, 10) || 1));
  const { ofertas, total, error } = await listarOfertasParaAdministracion(estado, pagina);
  const rutaPagina = (numero) => `/admin?estado=${estado}&pagina=${numero}`;

  return (
    <main className={styles.main}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Panel de Moderación</h1>
          <p className={styles.subtitulo}>
            Gestioná todas las búsquedas de los clubes, incluidas las publicadas, pausadas y rechazadas.
          </p>
        </div>
        <span className={styles.insigniaConteo}>
          {total ?? 0} ofertas
        </span>
      </div>

      <nav className={styles.filtros} aria-label="Filtrar ofertas por estado">
        {[["", "Todas"], ...Object.entries(ETIQUETAS_ESTADO_OFERTA)].map(([valor, etiqueta]) => (
          <Link key={valor} href={valor ? `/admin?estado=${valor}` : "/admin"} aria-current={estado === valor ? "page" : undefined} className={styles.filtro}>{etiqueta}</Link>
        ))}
      </nav>
      {error && <p role="alert" className={styles.itemVacio}>No se pudieron cargar las ofertas. Intentá nuevamente.</p>}
      <ul className={styles.lista}>
        {!error && ofertas.length === 0 && (
          <li className={styles.itemVacio}>
            <p className={styles.textoVacio}>No hay ofertas para mostrar en esta vista.</p>
            <p className={styles.subtextoVacio}>Las ofertas se conservan al cambiar su estado. Podés consultar también los otros filtros.</p>
          </li>
        )}

        {ofertas.map((oferta) => {
          const club = oferta.perfiles_club;
          return (
            <li key={oferta.id} className={styles.item}>
              {/* Encabezado con Escudo, Club y Botones */}
              <div className={styles.itemEncabezado}>
                <div className={styles.infoClub}>
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
                  <div>
                    <div className={styles.lineaClub}>
                      <span className={styles.clubNombre}>
                        {club?.nombre_club ?? "Club sin nombre"}
                      </span>
                      {oferta.club_id && (
                        <Link
                          href={`/perfil-publico-club?id=${oferta.club_id}`}
                          target="_blank"
                          className={styles.enlacePerfilClub}
                        >
                          Ver perfil institucional ↗
                        </Link>
                      )}
                    </div>
                    <h2 className={styles.itemTitulo}>
                      {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado}
                      {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
                    </h2>
                    <span className={styles.etiquetaPendiente} data-estado={oferta.estado}>
                      {ETIQUETAS_ESTADO_OFERTA[oferta.estado] ?? oferta.estado}
                    </span>
                  </div>
                </div>

                <div className={styles.accionesModeracion}>
                  <BotonesModeracion ofertaId={oferta.id} estado={oferta.estado} />
                </div>
              </div>

              {/* Ficha técnica con todos los detalles */}
              <div className={styles.seccionDetalle}>
                <h3 className={styles.subtituloSeccion}>Ficha de la búsqueda</h3>
                <dl className={styles.grillaDatos}>
                  <Dato
                    etiqueta="Puesto solicitado"
                    valor={ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado}
                  />
                  <Dato etiqueta="Posición de juego" valor={oferta.posicion_juego} />
                  <Dato etiqueta="Categoría de competencia" valor={oferta.categoria} />
                  <Dato
                    etiqueta="Tipo de contrato"
                    valor={ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato] ?? oferta.tipo_contrato}
                  />
                  <Dato etiqueta="Provincia" valor={oferta.provincia} />
                  <Dato etiqueta="Localidad del club" valor={club?.localidad} />
                  <Dato etiqueta="Fecha de creación" valor={formatearFecha(oferta.creada_en)} />
                  <Dato etiqueta="Última actualización" valor={formatearFecha(oferta.actualizada_en)} />
                  <Dato etiqueta="Identificador de oferta" valor={oferta.id} />
                  <Dato etiqueta="Categoría del club" valor={club?.categoria} />
                  <Dato etiqueta="Provincia del club" valor={club?.provincia} />
                </dl>
              </div>

              {/* Descripción completa */}
              <div className={styles.seccionDescripcion}>
                <h3 className={styles.subtituloSeccion}>Descripción del puesto</h3>
                <p className={styles.descripcion}>{oferta.descripcion}</p>
              </div>

              {/* Información institucional del club si existe */}
              {club && (club.descripcion || club.instalaciones || club.sitio_web || club.instagram || club.facebook) && (
                <div className={styles.seccionClub}>
                  <h3 className={styles.subtituloSeccion}>Información del club solicitante</h3>
                  {club.instagram && <p className={styles.datoClub}><strong>Instagram:</strong> {club.instagram}</p>}
                  {club.facebook && <p className={styles.datoClub}><strong>Facebook:</strong> {club.facebook}</p>}
                  {club.descripcion && (
                    <p className={styles.datoClub}>
                      <strong>Reseña:</strong> {club.descripcion}
                    </p>
                  )}
                  {club.instalaciones && (
                    <p className={styles.datoClub}>
                      <strong>Instalaciones:</strong> {club.instalaciones}
                    </p>
                  )}
                  {club.sitio_web && (
                    <p className={styles.datoClub}>
                      <strong>Sitio web:</strong>{" "}
                      <a href={club.sitio_web} target="_blank" rel="noreferrer" className={styles.enlaceExterno}>
                        {club.sitio_web} ↗
                      </a>
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!error && <nav className={styles.filtros} aria-label="Paginación">
        {pagina > 1 && <Link className={styles.filtro} href={rutaPagina(pagina - 1)}>← Anterior</Link>}
        <span className={styles.subtitulo}>Página {pagina} · {total} ofertas</span>
        {pagina * 20 < total && <Link className={styles.filtro} href={rutaPagina(pagina + 1)}>Siguiente →</Link>}
      </nav>}
    </main>
  );
}
