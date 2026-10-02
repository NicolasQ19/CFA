import Link from "next/link";
import { listarOfertasPublicadas } from "@/dominio/ofertas/consultas";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  ETIQUETAS_TIPO_CONTRATO,
  PROVINCIAS_ARGENTINA,
} from "@/tipos/dominio";
import styles from "./page.module.css";

/** RF-18: listado público de ofertas con filtros por puesto, provincia y categoría. */
export default async function PaginaListadoOfertas({ searchParams }) {
  const filtros = await searchParams;

  const ofertas = await listarOfertasPublicadas({
    puesto: filtros?.puesto || undefined,
    provincia: filtros?.provincia || undefined,
    categoria: filtros?.categoria,
  });

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Ofertas laborales</h1>
      <p className={styles.subtitulo}>
        Búsquedas activas de clubes de fútbol argentino, para jugadores y cuerpo técnico/staff.
      </p>

      <form className={styles.formularioFiltros} method="get">
        <select name="puesto" defaultValue={filtros?.puesto ?? ""} className={styles.entradaFiltro}>
          <option value="">Todos los puestos</option>
          {Object.entries(ETIQUETAS_PUESTO_PROFESIONAL).map(([clave, texto]) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
        <select name="provincia" defaultValue={filtros?.provincia ?? ""} className={styles.entradaFiltro}>
          <option value="">Todas las provincias</option>
          {PROVINCIAS_ARGENTINA.map((provincia) => (
            <option key={provincia} value={provincia}>
              {provincia}
            </option>
          ))}
        </select>
        <input
          name="categoria"
          placeholder="Categoría"
          defaultValue={filtros?.categoria ?? ""}
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
        {ofertas.map((oferta) => {
          const club = oferta.perfiles_club;
          return (
            <li key={oferta.id}>
              <Link
                href={`/ofertas/${oferta.id}`}
                className={styles.tarjeta}
              >
                <div className={styles.tarjetaContenido}>
                  {club?.escudo_url ? (
                    <img
                      src={club.escudo_url}
                      alt={`Escudo de ${club.nombre_club ?? "club"}`}
                      className={styles.escudo}
                    />
                  ) : (
                    <div className={styles.escudoFallback}>
                      {club?.nombre_club ? club.nombre_club.charAt(0).toUpperCase() : "⚽"}
                    </div>
                  )}
                  <div className={styles.datosOferta}>
                    <p className={styles.clubNombre}>
                      {club?.nombre_club ?? "Club"}
                    </p>
                    <h2 className={styles.ofertaTitulo}>
                      {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado}
                      {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
                    </h2>
                    <p className={styles.ofertaDetalle}>
                      {oferta.categoria} · {oferta.provincia} · {ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato] ?? oferta.tipo_contrato}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}