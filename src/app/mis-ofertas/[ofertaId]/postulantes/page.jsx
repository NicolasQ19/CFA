import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import { ETAPAS_CLUB } from "@/lib/club";
import { DISPONIBILIDADES } from "@/lib/perfil-candidato";
import { SeguimientoClub } from "@/dominio/postulaciones/SeguimientoClub";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPostulantesDeOferta } from "@/dominio/postulaciones/consultas-club";
import { SelectorEstadoPostulacion } from "@/dominio/postulaciones/SelectorEstadoPostulacion";
import { ETIQUETAS_PUESTO_PROFESIONAL } from "@/tipos/dominio";
import styles from "./page.module.css";

const ESTADOS_FILTRO = Object.keys(ETAPAS_CLUB);

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

  const { oferta, postulantes, seguimientoDisponible } = resultado;

  const conteoPorEstado = Object.fromEntries(
    ESTADOS_FILTRO.map((estado) => [
      estado,
      postulantes.filter((postulante) => postulante.etapa === estado).length,
    ]),
  );
  const postulantesVisibles = estadoFiltro
    ? postulantes.filter((postulante) => postulante.etapa === estadoFiltro)
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

      {!seguimientoDisponible && <p role="status" className={styles.vacio}>No se pudo cargar el seguimiento privado. Las etapas mostradas se basan en el estado informado al candidato.</p>}
      {postulantes.length > 0 && (
        <nav className={styles.filtros} aria-label="Filtrar por etapa interna">
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
              {ETAPAS_CLUB[estado]}{" "}
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
          <p>No hay postulantes en estado "{ETAPAS_CLUB[estadoFiltro]}".</p>
        </div>
      ) : (
        <div className={styles.tarjetas}>
          {postulantesVisibles.map(postulante => <article key={postulante.id} className={styles.tarjeta}>
            <div className={styles.candidato}>
              {postulante.perfil?.foto_url && <ImagenAmpliable src={postulante.perfil.foto_url} alt={`Foto de ${postulante.nombre}`} className={styles.foto} />}
              <div><h2 className={styles.nombre}>{postulante.nombre}</h2>
                <p>{ETIQUETAS_PUESTO_PROFESIONAL[postulante.puesto] ?? "Puesto no informado"} · {postulante.perfil?.provincia ?? "Provincia no informada"}</p>
                <p className={styles.subtitulo}>{DISPONIBILIDADES[postulante.perfil?.disponibilidad] ?? "Disponibilidad no informada"}</p>
                <p className={styles.fecha}>Se postuló el {formatearFecha(postulante.fecha)}</p>
              </div>
            </div>
            <div className={styles.enlaces}>
              <Link href={`/perfil-publico?id=${postulante.candidato_id}`} className={styles.enlacePerfil}>Ver perfil →</Link>
              {postulante.perfil?.cv_ruta && <a href={`/api/candidatos/${postulante.candidato_id}/cv`} className={styles.enlacePerfil}>Descargar CV</a>}
            </div>
            <div className={styles.gestion}>
              <section><h3>Seguimiento privado</h3><SeguimientoClub postulacionId={postulante.id} etapa={postulante.etapa} notas={postulante.notas} disponible={seguimientoDisponible} /></section>
              <section><h3>Estado informado al candidato</h3><SelectorEstadoPostulacion postulacionId={postulante.id} ofertaId={oferta.id} estadoInicial={postulante.estado} /></section>
            </div>
          </article>)}
        </div>
      )}
    </main>
  );
}
