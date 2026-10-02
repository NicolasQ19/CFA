import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerOfertaPublicadaPorId } from "@/dominio/ofertas/consultas";
import { obtenerPostulacionDelCandidato } from "@/dominio/postulaciones/consultas";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { BotonPostularse } from "@/dominio/postulaciones/BotonPostularse";
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
      <div className={styles.encabezado}>
        {club?.escudo_url && (
          <img
            src={club.escudo_url}
            alt={`Escudo de ${club.nombre_club}`}
            className={styles.escudo}
          />
        )}
        <div>
          <Link
            href={`/perfil-publico-club?id=${oferta.club_id}`}
            className={styles.clubNombre}
          >
            {club?.nombre_club}
          </Link>
          <h1 className={styles.titulo}>
            {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado]}
            {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
          </h1>
          <p className={styles.subtitulo}>
            {oferta.categoria} · {oferta.provincia} ·{" "}
            {ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato]}
          </p>
        </div>
      </div>

      <section className={styles.tarjeta}>
        <h2 className={styles.tituloSeccion}>Detalle de la búsqueda</h2>
        <div className={styles.grilla}>
          <Dato
            etiqueta="Puesto buscado"
            valor={ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado]}
          />
          <Dato etiqueta="Posición de juego" valor={oferta.posicion_juego} />
          <Dato etiqueta="Categoría" valor={oferta.categoria} />
          <Dato
            etiqueta="Tipo de contrato"
            valor={ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato]}
          />
          <Dato etiqueta="Provincia" valor={oferta.provincia} />
          <Dato etiqueta="Publicada el" valor={formatearFecha(oferta.creada_en)} />
        </div>
      </section>

      <section className={styles.tarjeta}>
        <h2 className={styles.tituloSeccion}>Descripción de la oferta</h2>
        <p className={styles.texto}>{oferta.descripcion}</p>
      </section>

      {club && (
        <section className={styles.tarjeta}>
          <h2 className={styles.tituloSeccion}>Sobre el club</h2>
          <div className={styles.grilla}>
            <Dato etiqueta="Club" valor={club.nombre_club} />
            <Dato etiqueta="Localidad" valor={club.localidad} />
            <Dato etiqueta="Provincia" valor={club.provincia} />
            <Dato etiqueta="Categoría" valor={club.categoria} />
          </div>
          {club.descripcion && <p className={styles.texto}>{club.descripcion}</p>}
          <Link
            href={`/perfil-publico-club?id=${oferta.club_id}`}
            className={styles.enlaceClub}
          >
            Ver perfil completo del club ↗
          </Link>
        </section>
      )}

      <div className={styles.accion}>
        {usuario?.rol === "candidato" ? (
          postulacion ? (
            <div className={styles.estadoPostulacion}>
              <p className={styles.estadoTitulo}>
                ✓ Ya te postulaste a esta oferta
              </p>
              <div className={styles.grilla}>
                <Dato
                  etiqueta="Estado de tu postulación"
                  valor={ETIQUETAS_ESTADO_POSTULACION[postulacion.estado]}
                />
                <Dato
                  etiqueta="Te postulaste el"
                  valor={formatearFecha(postulacion.creada_en)}
                />
              </div>
              <Link href="/mis-postulaciones" className={styles.enlaceClub}>
                Ver todas mis postulaciones →
              </Link>
            </div>
          ) : (
            <BotonPostularse ofertaId={oferta.id} />
          )
        ) : usuario?.rol === "representante" ? (
          <PostularRepresentado
            ofertaId={oferta.id}
            cartera={cartera}
            postulacionesExistentes={postulacionesRepresentante}
          />
        ) : !usuario ? (
          <p className={styles.avisoIngreso}>
            Iniciá sesión como candidato o representante para postularte a esta oferta.
          </p>
        ) : null}
      </div>
    </main>
  );
}

function Dato({ etiqueta, valor }) {
  if (!valor) return null;
  return (
    <div className={styles.dato}>
      <span className={styles.etiqueta}>{etiqueta}</span>
      <span className={styles.valor}>{valor}</span>
    </div>
  );
}
