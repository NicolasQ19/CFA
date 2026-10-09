import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPostulacionesCandidato } from "@/dominio/postulaciones/consultas";
import { CancelarMiPostulacion } from "@/dominio/postulaciones/CancelarMiPostulacion";
import { ETIQUETAS_PUESTO_PROFESIONAL } from "@/tipos/dominio";
import styles from "./page.module.css";

const CLASE_ESTADO = {
  postulado: styles.badgePostulado,
  visto: styles.badgeVisto,
  preseleccionado: styles.badgePreseleccionado,
  rechazado: styles.badgeRechazado,
};

/** Textos pensados para el candidato (p. ej. "No seleccionado" en vez de "Rechazado"). */
const TEXTOS_ESTADO = {
  postulado: "Postulado",
  visto: "Visto por el club",
  preseleccionado: "Preseleccionado",
  rechazado: "No seleccionado",
};

/** Avisos según el estado de la oferta; las publicadas no llevan aviso. */
const AVISOS_OFERTA = {
  pausada: "Oferta pausada",
  cerrada: "Oferta cerrada",
};

function tituloDeOferta(oferta) {
  const puesto = ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado;
  return oferta.posicion_juego ? `${puesto} — ${oferta.posicion_juego}` : puesto;
}

export default async function PaginaMisPostulaciones() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  if (usuario.rol !== "candidato") {
    redirect("/");
  }

  const postulaciones = await obtenerPostulacionesCandidato(usuario.id);

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Mis postulaciones</h1>
      <p className={styles.subtitulo}>Seguí el estado de las ofertas a las que te postulaste.</p>

      {postulaciones.length === 0 ? (
        <div className={styles.vacio}>
          <p>Todavía no te postulaste a ninguna oferta.</p>
          <Link href="/ofertas" className={styles.botonExplorar}>
            Explorar ofertas
          </Link>
        </div>
      ) : (
        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Oferta</th>
                <th>Club</th>
                <th>Provincia</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className={styles.columnaAccion}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {postulaciones.map((postulacion) => {
                const oferta = postulacion.ofertas_laborales;
                const avisoOferta = AVISOS_OFERTA[oferta?.estado];

                return (
                  <tr key={postulacion.id}>
                    <td>
                      <span className={styles.nombreOferta}>
                        {oferta ? tituloDeOferta(oferta) : "Oferta no disponible"}
                      </span>
                      {avisoOferta && <span className={styles.avisoOferta}>{avisoOferta}</span>}
                    </td>
                    <td>{oferta?.perfiles_club?.nombre_club ?? "Club"}</td>
                    <td>{oferta?.provincia ?? "—"}</td>
                    <td className={styles.fecha}>
                      {new Date(postulacion.creada_en).toLocaleDateString("es-AR")}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${CLASE_ESTADO[postulacion.estado] ?? ""}`}>
                        {TEXTOS_ESTADO[postulacion.estado] ?? postulacion.estado}
                      </span>
                    </td>
                    <td className={styles.columnaAccion}>
                      <div className={styles.acciones}>
                      {/* El detalle solo existe para ofertas publicadas (las demás dan 404). */}
                      {oferta?.estado === "publicada" && (
                        <Link href={`/ofertas/${oferta.id}`} className={styles.enlace}>
                          Ver oferta
                        </Link>
                      )}
                      <CancelarMiPostulacion postulacionId={postulacion.id} nombreOferta={oferta ? tituloDeOferta(oferta) : undefined} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
