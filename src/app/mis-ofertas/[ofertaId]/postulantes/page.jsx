import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPostulantesDeOferta } from "@/dominio/postulaciones/consultas-club";
import { SelectorEstadoPostulacion } from "@/dominio/postulaciones/SelectorEstadoPostulacion";
import { ETIQUETAS_ESTADO_POSTULACION, ETIQUETAS_PUESTO_PROFESIONAL } from "@/tipos/dominio";
import styles from "./page.module.css";

const ESTADOS_FILTRO = ["postulado", "visto", "preseleccionado", "rechazado"];

function formatearFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR");
}

export default async function PaginaPostulantesDeOferta({ params, searchParams }) {
  const { ofertaId } = await params;
  const { estado: estadoParam } = await searchParams;
  const estadoFiltro = ESTADOS_FILTRO.includes(estadoParam) ? estadoParam : null;
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "club") redirect("/");

  const resultado = await obtenerPostulantesDeOferta(ofertaId, usuario.id);

  if (!resultado) {
    notFound();
  }

  const { oferta, postulantes } = resultado;

  const conteoPorEstado = Object.fromEntries(
    ESTADOS_FILTRO.map((estado) => [
      estado,
      postulantes.filter((postulante) => postulante.estado === estado).length,
    ]),
  );
  const postulantesVisibles = estadoFiltro
    ? postulantes.filter((postulante) => postulante.estado === estadoFiltro)
    : postulantes;
  const rutaBase = `/mis-ofertas/${ofertaId}/postulantes`;
  const tituloOferta = `${ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado}${
    oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""
  }`;

  return (
    <main className={styles.main}>
      <div className={styles.encabezado}>
        <div>
          <Link href="/mis-ofertas" className={styles.volver}>
            ← Volver a mis ofertas
          </Link>
          <h1 className={styles.titulo}>Postulantes</h1>
          <p className={styles.subtitulo}>{tituloOferta}</p>
        </div>
      </div>

      {postulantes.length > 0 && (
        <nav className={styles.filtros} aria-label="Filtrar por estado">
          <Link
            href={rutaBase}
            className={`${styles.filtro} ${estadoFiltro === null ? styles.filtroActivo : ""}`}
          >
            Todos <span className={styles.conteo}>{postulantes.length}</span>
          </Link>
          {ESTADOS_FILTRO.map((estado) => (
            <Link
              key={estado}
              href={`${rutaBase}?estado=${estado}`}
              className={`${styles.filtro} ${estadoFiltro === estado ? styles.filtroActivo : ""}`}
            >
              {ETIQUETAS_ESTADO_POSTULACION[estado]}{" "}
              <span className={styles.conteo}>{conteoPorEstado[estado]}</span>
            </Link>
          ))}
        </nav>
      )}

      {postulantes.length === 0 ? (
        <div className={styles.vacio}>
          <p>Todavía no hay postulantes en esta oferta.</p>
        </div>
      ) : postulantesVisibles.length === 0 ? (
        <div className={styles.vacio}>
          <p>No hay postulantes en estado &quot;{ETIQUETAS_ESTADO_POSTULACION[estadoFiltro]}&quot;.</p>
        </div>
      ) : (
        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Fecha</th>
                <th>Perfil</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {postulantesVisibles.map((postulante) => (
                <tr key={postulante.id}>
                  <td className={styles.nombre}>{postulante.nombre}</td>
                  <td>
                    {ETIQUETAS_PUESTO_PROFESIONAL[postulante.puesto] ?? postulante.puesto ?? "—"}
                  </td>
                  <td className={styles.fecha}>{formatearFecha(postulante.fecha)}</td>
                  <td>
                    <Link
                      href={`/perfil-publico?id=${postulante.candidato_id}`}
                      className={styles.enlacePerfil}
                    >
                      Ver perfil
                    </Link>
                  </td>
                  <td>
                    <SelectorEstadoPostulacion
                      postulacionId={postulante.id}
                      ofertaId={oferta.id}
                      estadoInicial={postulante.estado}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
