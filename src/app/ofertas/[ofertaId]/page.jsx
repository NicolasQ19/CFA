import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerOfertaPublicadaPorId } from "@/dominio/ofertas/consultas";
import { yaSePostuloAOferta } from "@/dominio/postulaciones/consultas";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { BotonPostularse } from "@/dominio/postulaciones/BotonPostularse";
import { ETIQUETAS_PUESTO_PROFESIONAL, ETIQUETAS_TIPO_CONTRATO } from "@/tipos/dominio";
import styles from "./page.module.css";

/** RF-19: ficha de detalle de una oferta, con botón de postulación. */
export default async function PaginaDetalleOferta({ params }) {
  const { ofertaId } = await params;
  const oferta = await obtenerOfertaPublicadaPorId(ofertaId);

  if (!oferta) {
    notFound();
  }

  const usuario = await obtenerUsuarioActual();
  const yaPostulado =
    usuario?.rol === "candidato" ? await yaSePostuloAOferta(ofertaId, usuario.id) : false;

  return (
    <main className={styles.main}>
      <Link href={`/perfil-publico-club?id=${oferta.club_id}`} className={styles.clubNombre}>
        {oferta.perfiles_club?.nombre_club}
      </Link>
      <h1 className={styles.titulo}>
        {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado]}
        {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
      </h1>
      <p className={styles.subtitulo}>
        {oferta.categoria} · {oferta.provincia} · {ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato]}
      </p>

      <p className={styles.descripcion}>{oferta.descripcion}</p>

      <div className={styles.accion}>
        {usuario?.rol === "candidato" ? (
          <BotonPostularse ofertaId={oferta.id} yaPostulado={yaPostulado} />
        ) : (
          <p className={styles.avisoIngreso}>
            Iniciá sesión como candidato para postularte a esta oferta.
          </p>
        )}
      </div>
    </main>
  );
}