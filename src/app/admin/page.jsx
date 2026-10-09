import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { listarOfertasPendientesDeModeracion } from "@/dominio/ofertas/consultas";
import { BotonesModeracion } from "@/dominio/ofertas/BotonesModeracion";
import { ETIQUETAS_PUESTO_PROFESIONAL, ETIQUETAS_TIPO_CONTRATO } from "@/tipos/dominio";
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
export default async function PaginaAdministracion() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "administrador") redirect("/");

  const ofertas = await listarOfertasPendientesDeModeracion();

  return (
    <main className={styles.main}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Panel de Moderación</h1>
          <p className={styles.subtitulo}>
            Revisión y aprobación de ofertas laborales publicadas por los clubes.
          </p>
        </div>
        <span className={styles.insigniaConteo}>
          {ofertas.length} {ofertas.length === 1 ? "pendiente" : "pendientes"}
        </span>
      </div>

      <ul className={styles.lista}>
        {ofertas.length === 0 && (
          <li className={styles.itemVacio}>
            <p className={styles.textoVacio}>No hay ofertas pendientes de moderación en este momento.</p>
            <p className={styles.subtextoVacio}>Las nuevas búsquedas creadas por los clubes aparecerán aquí automáticamente.</p>
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
                    <span className={styles.etiquetaPendiente}>
                      ⏳ Pendiente de moderación
                    </span>
                  </div>
                </div>

                <div className={styles.accionesModeracion}>
                  <BotonesModeracion ofertaId={oferta.id} />
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
                </dl>
              </div>

              {/* Descripción completa */}
              <div className={styles.seccionDescripcion}>
                <h3 className={styles.subtituloSeccion}>Descripción del puesto</h3>
                <p className={styles.descripcion}>{oferta.descripcion}</p>
              </div>

              {/* Información institucional del club si existe */}
              {club && (club.descripcion || club.instalaciones || club.sitio_web) && (
                <div className={styles.seccionClub}>
                  <h3 className={styles.subtituloSeccion}>Información del club solicitante</h3>
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
    </main>
  );
}
