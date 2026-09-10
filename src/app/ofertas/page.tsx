import Link from "next/link";
import { listarOfertasPublicadas } from "@/dominio/ofertas/consultas";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  ETIQUETAS_TIPO_CONTRATO,
  type PuestoProfesional,
} from "@/tipos/dominio";
import styles from "./page.module.css";

interface Props {
  searchParams: Promise<{ puesto?: string; provincia?: string; categoria?: string }>;
}

/** RF-18: listado público de ofertas con filtros por puesto, provincia y categoría. */
export default async function PaginaListadoOfertas({ searchParams }: Props) {
  const filtros = await searchParams;

  const ofertas = await listarOfertasPublicadas({
    puesto: filtros.puesto as PuestoProfesional | undefined,
    provincia: filtros.provincia,
    categoria: filtros.categoria,
  });

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Ofertas laborales</h1>
      <p className={styles.subtitulo}>
        Búsquedas activas de clubes de fútbol argentino, para jugadores y cuerpo técnico/staff.
      </p>

      <form className={styles.formularioFiltros} method="get">
        <select name="puesto" defaultValue={filtros.puesto ?? ""} className={styles.entradaFiltro}>
          <option value="">Todos los puestos</option>
          {Object.entries(ETIQUETAS_PUESTO_PROFESIONAL).map(([clave, texto]) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
        <input
          name="provincia"
          placeholder="Provincia"
          defaultValue={filtros.provincia ?? ""}
          className={styles.entradaFiltro}
        />
        <input
          name="categoria"
          placeholder="Categoría"
          defaultValue={filtros.categoria ?? ""}
          className={styles.entradaFiltro}
        />
        <button type="submit" className={styles.botonFiltrar}>
          Filtrar
        </button>
      </form>

      <ul className={styles.lista}>
        {ofertas.length === 0 && (
          <li className={styles.itemVacio}>No hay ofertas publicadas con esos filtros.</li>
        )}
        {ofertas.map((oferta) => (
          <li key={oferta.id}>
            <Link
              href={`/ofertas/${oferta.id}`}
              className={styles.tarjeta}
            >
              <p className={styles.clubNombre}>
                {oferta.perfiles_club?.nombre_club}
              </p>
              <h2 className={styles.ofertaTitulo}>
                {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado]}
                {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
              </h2>
              <p className={styles.ofertaDetalle}>
                {oferta.categoria} · {oferta.provincia} · {ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato]}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
