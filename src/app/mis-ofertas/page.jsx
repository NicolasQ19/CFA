import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerOfertasConConteoPostulantes } from "@/dominio/postulaciones/consultas-club";
import { BotonesEstadoOferta } from "@/dominio/ofertas/BotonesEstadoOferta";
import { ETIQUETAS_ESTADO_OFERTA, ETIQUETAS_PUESTO_PROFESIONAL } from "@/tipos/dominio";
import styles from "./page.module.css";

/** RF-13: el club ve y gestiona sus ofertas publicadas. */
export default async function PaginaMisOfertas() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "club") redirect("/");

  const ofertas = await obtenerOfertasConConteoPostulantes(usuario.id);

  return (
    <main className={styles.main}>
      <div className={styles.encabezado}>
        <h1 className={styles.titulo}>Mis ofertas</h1>
        <Link
          href="/mis-ofertas/nueva"
          className={styles.botonPublicar}
        >
          Publicar oferta
        </Link>
      </div>

      <ul className={styles.lista}>
        {ofertas.length === 0 && (
          <li className={styles.itemVacio}>Todavía no publicaste ninguna oferta.</li>
        )}
        {ofertas.map((oferta) => (
          <li key={oferta.id} className={styles.item}>
            <div className={styles.itemEncabezado}>
              <h2 className={styles.itemTitulo}>
                {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado]}
                {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
              </h2>
              <span className={styles.estado}>
                {ETIQUETAS_ESTADO_OFERTA[oferta.estado]}
              </span>
            </div>
            <p className={styles.itemDetalle}>
              {oferta.categoria} · {oferta.provincia}
            </p>
            <div className={styles.itemPie}>
              <span className={styles.conteo}>
                {oferta.total_postulantes === 1
                  ? "1 candidato"
                  : `${oferta.total_postulantes} candidatos`}
              </span>
              <div className={styles.itemAcciones}>
                <BotonesEstadoOferta ofertaId={oferta.id} estado={oferta.estado} />
                <Link
                  href={`/mis-ofertas/${oferta.id}/postulantes`}
                  className={styles.enlacePostulantes}
                >
                  Ver postulantes
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
