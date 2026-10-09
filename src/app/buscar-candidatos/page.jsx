import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { buscarCandidatos } from "@/dominio/perfiles/consultas";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  POSICIONES_DE_JUEGO,
  PROVINCIAS_ARGENTINA,
  esPuestoDeCuerpoTecnico,
} from "@/tipos/dominio";
import styles from "./page.module.css";

/** Búsqueda de candidatos para clubes. Solo muestra perfiles que el candidato marcó como visibles. */
export default async function PaginaBuscarCandidatos({ searchParams }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "club" && usuario.rol !== "administrador") redirect("/");

  const filtros = await searchParams;
  const nombre = filtros?.nombre?.trim() || undefined;

  const candidatos = await buscarCandidatos({
    nombre,
    puesto: filtros?.puesto || undefined,
    provincia: filtros?.provincia || undefined,
    posicion: filtros?.posicion || undefined,
  });

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Buscar candidatos</h1>
      <p className={styles.subtitulo}>
        Jugadores, cuerpo técnico y staff que tienen su perfil visible para los clubes.
      </p>

      <form className={styles.formularioFiltros} method="get">
        <input
          name="nombre"
          placeholder="Nombre"
          defaultValue={nombre ?? ""}
          className={styles.entradaFiltro}
        />
        <select name="puesto" defaultValue={filtros?.puesto ?? ""} className={styles.entradaFiltro}>
          <option value="">Todos los puestos</option>
          {Object.entries(ETIQUETAS_PUESTO_PROFESIONAL).map(([clave, texto]) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
        <select
          name="posicion"
          defaultValue={filtros?.posicion ?? ""}
          className={styles.entradaFiltro}
        >
          <option value="">Cualquier posición</option>
          {POSICIONES_DE_JUEGO.map((posicion) => (
            <option key={posicion} value={posicion}>
              {posicion}
            </option>
          ))}
        </select>
        <select
          name="provincia"
          defaultValue={filtros?.provincia ?? ""}
          className={styles.entradaFiltro}
        >
          <option value="">Todas las provincias</option>
          {PROVINCIAS_ARGENTINA.map((provincia) => (
            <option key={provincia} value={provincia}>
              {provincia}
            </option>
          ))}
        </select>
        <button type="submit" className={styles.botonFiltrar}>
          Buscar
        </button>
      </form>

      <p className={styles.resultados}>
        {candidatos.length === 1 ? "1 candidato" : `${candidatos.length} candidatos`}
      </p>

      {candidatos.length === 0 ? (
        <p className={styles.vacio}>No hay candidatos con esos filtros.</p>
      ) : (
        <ul className={styles.lista}>
          {candidatos.map((candidato) => (
            <li key={candidato.usuario_id}>
              <Link href={`/perfil-publico?id=${candidato.usuario_id}`} className={styles.tarjeta}>
                {candidato.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <ImagenAmpliable src={candidato.foto_url} alt="" className={styles.foto} />
                ) : (
                  <div className={styles.fotoVacia}>
                    {candidato.usuarios.nombre_completo.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={styles.datos}>
                  <span className={styles.nombre}>{candidato.usuarios.nombre_completo}</span>
                  <span className={styles.puesto}>{descripcionDePuesto(candidato)}</span>
                  <span className={styles.detalle}>
                    {[candidato.provincia, candidato.club_actual].filter(Boolean).join(" · ")}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

/** "Jugador — Extremo" o "Director Técnico · 8 años de experiencia". */
function descripcionDePuesto(candidato) {
  const puesto = ETIQUETAS_PUESTO_PROFESIONAL[candidato.puesto] ?? candidato.puesto;

  if (!esPuestoDeCuerpoTecnico(candidato.puesto)) {
    return candidato.posicion_juego ? `${puesto} — ${candidato.posicion_juego}` : puesto;
  }

  const anios = candidato.anios_experiencia;
  return anios ? `${puesto} · ${anios} ${anios === 1 ? "año" : "años"} de experiencia` : puesto;
}
