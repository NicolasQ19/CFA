import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerOfertaPublicadaPorId } from "@/dominio/ofertas/consultas";
import { obtenerPostulacionDelCandidato } from "@/dominio/postulaciones/consultas";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { BotonPostularse } from "@/dominio/postulaciones/BotonPostularse";
import { CancelarMiPostulacion } from "@/dominio/postulaciones/CancelarMiPostulacion";
import { PostularRepresentado } from "@/dominio/representantes/PostularRepresentado";
import {
  listarCarteraCandidatos,
  listarPostulacionesDeRepresentante,
} from "@/dominio/representantes/consultas";
import {
  ETIQUETAS_ESTADO_POSTULACION,
  ETIQUETAS_PUESTO_PROFESIONAL,
  ETIQUETAS_TIPO_CONTRATO,
} from "@/tipos/dominio";
import styles from "./page.module.css";

function formatearFecha(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** RF-19: ficha de detalle de una oferta, con botón de postulación. */
export default async function PaginaDetalleOferta({ params }) {
  const { ofertaId } = await params;
  const oferta = await obtenerOfertaPublicadaPorId(ofertaId);

  if (!oferta) {
    notFound();
  }

  const usuario = await obtenerUsuarioActual();
  const postulacion =
    usuario?.rol === "candidato"
      ? await obtenerPostulacionDelCandidato(ofertaId, usuario.id)
      : null;

  const cartera =
    usuario?.rol === "representante"
      ? await listarCarteraCandidatos(usuario.id)
      : [];

  const postulacionesRepresentante =
    usuario?.rol === "representante"
      ? (await listarPostulacionesDeRepresentante(usuario.id)).filter(
          (p) => p.oferta_id === ofertaId
        )
      : [];

  const club = oferta.perfiles_club;

  return (
    <main className={styles.main}>
      <nav aria-label="Ruta de navegación" className={styles.navegacion}>
        <Link href="/ofertas">← Volver a ofertas</Link>
        <span aria-hidden="true">/</span><span>Detalle de la oferta</span>
      </nav>
      <header className={styles.hero}>
      <div className={styles.lineaEstado}>
        <span className={styles.insigniaAbierta}><span aria-hidden="true" />Búsqueda abierta</span>
        <span>Creada el {formatearFecha(oferta.creada_en)}</span>
      </div>
      <div className={styles.encabezado}>
        {club?.escudo_url && (
          <ImagenAmpliable
            src={club.escudo_url}
            alt={`Escudo de ${club.nombre_club}`}
            className={styles.escudo}
          />
        )}
        {!club?.escudo_url && <div className={styles.escudoFallback} aria-hidden="true">{club?.nombre_club?.charAt(0).toUpperCase() || "C"}</div>}
        <div>
          <Link
            href={`/perfil-publico-club?id=${oferta.club_id}`}
            className={styles.clubNombre}
          >
            {club?.nombre_club ?? "Club"}
          </Link>
          <h1 className={styles.titulo}>
            {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado}
            {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
          </h1>
          <p className={styles.subtitulo}>
            {oferta.provincia} · {oferta.categoria}
          </p>
          <span className={styles.tipoContrato}>{ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato] ?? oferta.tipo_contrato}</span>
        </div>
      </div>
      </header>

      <div className={styles.distribucion}>
      <div className={styles.contenido}>
      <section className={styles.tarjeta}>
        <p className={styles.sobretitulo}>LA OPORTUNIDAD</p>
        <h2 className={styles.tituloSeccion}>Sobre esta búsqueda</h2>
        <p className={styles.texto}>{oferta.descripcion}</p>
      </section>

      {club && (
        <section className={styles.tarjeta}>
          <h2 className={styles.tituloSeccion}>Sobre el club</h2>
          <dl className={styles.grilla}>
            <Dato etiqueta="Club" valor={club.nombre_club} />
            <Dato etiqueta="Localidad" valor={club.localidad} />
            <Dato etiqueta="Provincia" valor={club.provincia} />
            <Dato etiqueta="Categoría" valor={club.categoria} />
          </dl>
          {club.descripcion && <p className={styles.texto}>{club.descripcion}</p>}
          <Link
            href={`/perfil-publico-club?id=${oferta.club_id}`}
            className={styles.enlaceClub}
          >
            Ver perfil completo del club ↗
          </Link>
        </section>
      )}
      </div>
      <aside className={styles.resumen} aria-labelledby="tituloResumen">
        <h2 id="tituloResumen" className={styles.tituloSeccion}>La oferta en un vistazo</h2>
        <dl className={styles.datosResumen}>
          <Dato etiqueta="Puesto" valor={ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado} />
          <Dato etiqueta="Posición" valor={oferta.posicion_juego} />
          <Dato etiqueta="Ubicación" valor={oferta.provincia} />
          <Dato etiqueta="Competencia" valor={oferta.categoria} />
          <Dato etiqueta="Tipo de contrato" valor={ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato] ?? oferta.tipo_contrato} />
        </dl>
        {(usuario?.rol === "candidato" || usuario?.rol === "representante") && <>
          <a href="#postulacion" className={styles.botonAccion}>{usuario.rol === "representante" ? "Gestionar candidatos" : postulacion ? "Ver mi postulación" : "Quiero postularme"}<span aria-hidden="true">↓</span></a>
          <p className={styles.ayuda}>El puesto del candidato debe coincidir con el solicitado.</p>
        </>}
        {!usuario && <>
          <Link href="/iniciar-sesion" className={styles.botonAccion}>Iniciar sesión para postularme</Link>
          <p className={styles.ayuda}>Ingresá como candidato o representante para enviar una postulación.</p>
        </>}
      </aside>
      </div>

      <section id="postulacion" className={styles.accion} aria-label="Postulación a la oferta">
        {usuario?.rol === "candidato" ? (
          postulacion ? (
            <div className={styles.estadoPostulacion}>
              <p className={styles.estadoTitulo}>
                ✓ Ya te postulaste a esta oferta
              </p>
              <dl className={styles.grilla}>
                <Dato
                  etiqueta="Estado de tu postulación"
                  valor={ETIQUETAS_ESTADO_POSTULACION[postulacion.estado]}
                />
                <Dato
                  etiqueta="Te postulaste el"
                  valor={formatearFecha(postulacion.creada_en)}
                />
              </dl>
              <CancelarMiPostulacion postulacionId={postulacion.id} nombreOferta={ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado]} />
              <Link href="/mis-postulaciones" className={styles.enlaceClub}>
                Ver todas mis postulaciones →
              </Link>
            </div>
          ) : (
            <div className={styles.panelPostulacion}>
            <h2 className={styles.tituloSeccion}>Postulate a esta búsqueda</h2>
            <p className={styles.ayuda}>El club recibirá tu perfil profesional y podrá evaluar tu candidatura.</p>
            <BotonPostularse ofertaId={oferta.id} />
            </div>
          )
        ) : usuario?.rol === "representante" ? (
          <PostularRepresentado
            ofertaId={oferta.id}
            puestoOferta={oferta.puesto_buscado}
            cartera={cartera}
            postulacionesExistentes={postulacionesRepresentante}
          />
        ) : !usuario ? (
          <p className={styles.avisoIngreso}>
            Iniciá sesión como candidato o representante para postularte a esta oferta.
          </p>
        ) : null}
      </section>
    </main>
  );
}

function Dato({ etiqueta, valor }) {
  if (!valor) return null;
  return (
    <div className={styles.dato}>
      <dt className={styles.etiqueta}>{etiqueta}</dt>
      <dd className={styles.valor}>{valor}</dd>
    </div>
  );
}
