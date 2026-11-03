import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import { SelectorDesplegable } from "@/componentes/SelectorDesplegable";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { buscarCandidatos } from "@/dominio/perfiles/consultas";
import { clubEstaVerificado } from "@/lib/verificacion-club";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  POSICIONES_DE_JUEGO,
  PROVINCIAS_ARGENTINA,
  esPuestoDeCuerpoTecnico,
} from "@/tipos/dominio";
import {
  EDAD_MAXIMA_BUSQUEDA,
  EDAD_MINIMA_BUSQUEDA,
  ORDENES_BUSQUEDA,
  hayFiltrosAplicados,
  normalizarFiltrosCandidatos,
} from "@/lib/busqueda-candidatos";
import { edadCandidato } from "@/lib/edad";
import styles from "./page.module.css";

/** Búsqueda de candidatos para clubes. Solo muestra perfiles que el candidato marcó como visibles. */
export default async function PaginaBuscarCandidatos({ searchParams }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "club" && usuario.rol !== "administrador") forbidden();
  if (usuario.rol === "club" && !clubEstaVerificado(usuario)) redirect("/mi-club#verificacion");

  const { filtros, rangoInvertido } = normalizarFiltrosCandidatos(await searchParams);
  const candidatos = await buscarCandidatos(filtros);
  const hoy = new Date();

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
          defaultValue={filtros.nombre ?? ""}
          className={styles.entradaFiltro}
          aria-label="Buscar por nombre"
        />
        <SelectorDesplegable
          nombre="puesto"
          valorInicial={filtros.puesto ?? ""}
          placeholder="Todos los puestos"
          opciones={[
            { valor: "", texto: "Todos los puestos" },
            ...Object.entries(ETIQUETAS_PUESTO_PROFESIONAL).map(([valor, texto]) => ({ valor, texto })),
          ]}
        />
        <SelectorDesplegable
          nombre="posicion"
          valorInicial={filtros.posicion ?? ""}
          placeholder="Cualquier posición"
          opciones={[
            { valor: "", texto: "Cualquier posición" },
            ...POSICIONES_DE_JUEGO.map((posicion) => ({ valor: posicion, texto: posicion })),
          ]}
        />
        <SelectorDesplegable
          nombre="provincia"
          valorInicial={filtros.provincia ?? ""}
          placeholder="Todas las provincias"
          opciones={[
            { valor: "", texto: "Todas las provincias" },
            ...PROVINCIAS_ARGENTINA.map((provincia) => ({ valor: provincia, texto: provincia })),
          ]}
        />
        <div className={styles.rangoEdad} role="group" aria-labelledby="etiqueta-edad">
          <span id="etiqueta-edad" className={styles.etiquetaRango}>Edad</span>
          <input
            name="edadMinima"
            type="number"
            inputMode="numeric"
            min={EDAD_MINIMA_BUSQUEDA}
            max={EDAD_MAXIMA_BUSQUEDA}
            placeholder="Desde"
            defaultValue={filtros.edadMinima ?? ""}
            className={styles.entradaEdad}
            aria-label={`Edad mínima, entre ${EDAD_MINIMA_BUSQUEDA} y ${EDAD_MAXIMA_BUSQUEDA}`}
          />
          <span aria-hidden="true">–</span>
          <input
            name="edadMaxima"
            type="number"
            inputMode="numeric"
            min={EDAD_MINIMA_BUSQUEDA}
            max={EDAD_MAXIMA_BUSQUEDA}
            placeholder="Hasta"
            defaultValue={filtros.edadMaxima ?? ""}
            className={styles.entradaEdad}
            aria-label={`Edad máxima, entre ${EDAD_MINIMA_BUSQUEDA} y ${EDAD_MAXIMA_BUSQUEDA}`}
          />
        </div>
        <SelectorDesplegable
          nombre="orden"
          valorInicial={filtros.orden}
          placeholder="Ordenar por"
          opciones={Object.entries(ORDENES_BUSQUEDA).map(([valor, texto]) => ({ valor, texto }))}
        />
        <button type="submit" className={styles.botonFiltrar}>
          Buscar
        </button>
        {hayFiltrosAplicados(filtros) && (
          <Link href="/buscar-candidatos" className={styles.limpiar}>
            Limpiar filtros
          </Link>
        )}
      </form>

      {rangoInvertido && (
        <p className={styles.aviso} role="status">
          La edad mínima era mayor que la máxima, así que se ignoró el rango.
        </p>
      )}

      <p className={styles.resultados}>
        {candidatos.length === 1 ? "1 candidato" : `${candidatos.length} candidatos`}
        {candidatos.length === 50 && " (se muestran los primeros 50; acotá la búsqueda para ver menos)"}
      </p>

      {candidatos.length === 0 ? (
        <p className={styles.vacio}>No hay candidatos con esos filtros.</p>
      ) : (
        <ul className={styles.lista}>
          {candidatos.map((candidato) => (
            <li key={candidato.usuario_id}>
              <Link href={`/perfil-publico?id=${candidato.usuario_id}`} className={styles.tarjeta}>
                {candidato.foto_url ? (
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
                    {[descripcionDeEdad(candidato, hoy), candidato.provincia, candidato.club_actual]
                      .filter(Boolean)
                      .join(" · ")}
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

/** "24 años", o nada si el candidato no declaró su fecha de nacimiento. */
function descripcionDeEdad(candidato, hoy) {
  const edad = edadCandidato(candidato.fecha_nacimiento, hoy);
  return edad === null ? null : `${edad} ${edad === 1 ? "año" : "años"}`;
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
