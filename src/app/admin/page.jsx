import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { listarOfertasPendientesDeModeracion } from "@/dominio/ofertas/consultas";
import { BotonesModeracion } from "@/dominio/ofertas/BotonesModeracion";
import { ETIQUETAS_PUESTO_PROFESIONAL, ETIQUETAS_TIPO_CONTRATO } from "@/tipos/dominio";
import styles from "./page.module.css";

/** RF-25: el administrador modera las ofertas pendientes antes de publicarlas. */
export default async function PaginaAdministracion() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "administrador") redirect("/");

  const ofertas = await listarOfertasPendientesDeModeracion();

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Moderación de ofertas</h1>
      <p className={styles.subtitulo}>
        Ofertas pendientes de aprobación antes de que sean visibles en el listado público.
      </p>

      <ul className={styles.lista}>
        {ofertas.length === 0 && (
          <li className={styles.itemVacio}>No hay ofertas pendientes de moderación.</li>
        )}
        {ofertas.map((oferta) => (
          <li key={oferta.id} className={styles.item}>
            <div className={styles.itemEncabezado}>
              <div>
                <p className={styles.clubNombre}>{oferta.perfiles_club?.nombre_club}</p>
                <h2 className={styles.itemTitulo}>
                  {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado]}
                  {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
                </h2>
                <p className={styles.itemDetalle}>
                  {oferta.categoria} · {oferta.provincia} · {ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato]}
                </p>
              </div>
              <BotonesModeracion ofertaId={oferta.id} />
            </div>
            <p className={styles.descripcion}>{oferta.descripcion}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
