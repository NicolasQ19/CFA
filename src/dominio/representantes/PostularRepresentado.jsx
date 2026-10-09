"use client";

import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import { useState, useTransition } from "react";
import Link from "next/link";
import { CancelarPostulacion } from "./CancelarPostulacion";
import { postularCandidatoRepresentado } from "@/dominio/representantes/acciones";
import { ETIQUETAS_ESTADO_POSTULACION, ETIQUETAS_PUESTO_PROFESIONAL } from "@/tipos/dominio";
import styles from "./PostularRepresentado.module.css";
import { filtrarCandidatosParaOferta, puestoCompatible, edadCandidato } from "@/lib/postulacion-cartera";

export function PostularRepresentado({ ofertaId, puestoOferta, cartera, postulacionesExistentes = [] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({ buscarPor: "todos", orden: "nombre_asc", edadMinima: "", edadMaxima: "", provincia: "" });
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState("");
  const [estaEnviando, iniciarTransicion] = useTransition();
  const [mensaje, setMensaje] = useState({ error: null, exito: null });

  // Filtrar candidatos de la cartera que aún no están postulados a esta oferta
  const idsYaPostulados = postulacionesExistentes.map((p) => p.candidato_id);
  const compatibles = cartera.filter((c) => puestoCompatible(c.perfil?.puesto, puestoOferta));
  const disponibles = filtrarCandidatosParaOferta(cartera, puestoOferta, idsYaPostulados);
  const filtrados = filtrarCandidatosParaOferta(cartera, puestoOferta, idsYaPostulados, busqueda, filtros);
  const provincias = [...new Set(disponibles.map(c => c.perfil?.provincia).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const rangoInvalido = filtros.edadMinima !== "" && filtros.edadMaxima !== "" && Number(filtros.edadMinima) > Number(filtros.edadMaxima);
  function cambiarFiltro(campo, valor) {
    setFiltros(anterior => ({ ...anterior, [campo]: valor }));
    setCandidatoSeleccionado("");
    setMensaje({ error: null, exito: null });
  }

  const candidatoElegido = filtrados.find(
    (c) => c.candidato_id === candidatoSeleccionado
  );

  function manejarPostulacion(e) {
    e.preventDefault();
    if (!candidatoElegido || estaEnviando) return;

    setMensaje({ error: null, exito: null });
    iniciarTransicion(async () => {
      const res = await postularCandidatoRepresentado(ofertaId, candidatoSeleccionado);
      if (res?.error) {
        setMensaje({ error: res.error, exito: null });
      } else {
        setMensaje({ error: null, exito: "✓ Candidato postulado con éxito a esta búsqueda." });
        setCandidatoSeleccionado("");
      }
    });
  }

  return (
    <div className={styles.contenedor}>
      <h3 className={styles.titulo}>Gestionar postulación de tu cartera</h3>
      <p className={styles.subtitulo}>
        Solo podés postular candidatos con el puesto de {ETIQUETAS_PUESTO_PROFESIONAL[puestoOferta] ?? puestoOferta}.
      </p>

      {cartera.length === 0 ? (
        <p className={styles.avisoVacio}>
          Aún no tenés candidatos en tu cartera.{" "}
          <Link href="/mi-cartera" className={styles.enlaceCartera}>
            Ir a Mi cartera para sumar candidatos ↗
          </Link>
        </p>
      ) : compatibles.length === 0 ? (
        <p className={styles.avisoVacio}>No tenés candidatos con el puesto solicitado en tu cartera.</p>
      ) : disponibles.length === 0 ? (
        <p className={styles.avisoVacio}>
          Todos los candidatos con el puesto solicitado ya están postulados a esta oferta.
        </p>
      ) : (
        <form onSubmit={manejarPostulacion} className={styles.formulario}>
          <div className={styles.grillaFiltros}>
            <label className={styles.campoFiltro}>Buscar en
              <select value={filtros.buscarPor} disabled={estaEnviando} className={styles.select} onChange={e => cambiarFiltro("buscarPor", e.target.value)}>
                <option value="todos">Nombre y apellido</option><option value="nombre">Nombres</option><option value="apellido">Apellidos</option>
              </select>
            </label>
            <label className={styles.campoFiltro}>Ordenar por
              <select value={filtros.orden} disabled={estaEnviando} className={styles.select} onChange={e => cambiarFiltro("orden", e.target.value)}>
                <option value="nombre_asc">Nombre A–Z</option><option value="nombre_desc">Nombre Z–A</option>
                <option value="apellido_asc">Apellido A–Z</option><option value="apellido_desc">Apellido Z–A</option>
                <option value="edad_asc">Edad: menor a mayor</option><option value="edad_desc">Edad: mayor a menor</option>
              </select>
            </label>
            <label className={styles.campoFiltro}>Edad mínima
              <input type="number" min={0} max={120} step={1} value={filtros.edadMinima} disabled={estaEnviando} className={styles.select} onChange={e => cambiarFiltro("edadMinima", e.target.value)} />
            </label>
            <label className={styles.campoFiltro}>Edad máxima
              <input type="number" min={0} max={120} step={1} value={filtros.edadMaxima} disabled={estaEnviando} className={styles.select} onChange={e => cambiarFiltro("edadMaxima", e.target.value)} />
            </label>
            <label className={styles.campoFiltro}>Provincia
              <select value={filtros.provincia} disabled={estaEnviando} className={styles.select} onChange={e => cambiarFiltro("provincia", e.target.value)}>
                <option value="">Todas las provincias</option>{provincias.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
          <label htmlFor="buscarRepresentado" className={styles.etiquetaFiltro}>Buscar candidato</label>
          <input id="buscarRepresentado" type="search" value={busqueda}
            disabled={estaEnviando} placeholder="Escribí el nombre de tu representado..."
            className={styles.select} onChange={(e) => {
              setBusqueda(e.target.value);
              setCandidatoSeleccionado("");
              setMensaje({ error: null, exito: null });
            }} />
          <button type="button" disabled={estaEnviando} className={styles.enlaceCartera} onClick={() => {
            setBusqueda(""); setFiltros({ buscarPor: "todos", orden: "nombre_asc", edadMinima: "", edadMaxima: "", provincia: "" }); setCandidatoSeleccionado("");
          }}>Limpiar filtros</button>
          <p className={styles.subtitulo}>Los datos sin informar quedan al final del orden por edad o apellido. Para completarlos, editá la ficha desde Mi cartera.</p>
          {rangoInvalido && <p role="alert" className={styles.error}>La edad mínima no puede ser mayor que la máxima.</p>}
          <p className={styles.subtitulo} role="status">{filtrados.length} de {disponibles.length} candidatos disponibles con el puesto solicitado.</p>
          {filtrados.length === 0 && <p className={styles.avisoVacio}>No hay candidatos que coincidan con esos filtros.</p>}
          <label htmlFor="candidatoRepresentado" className={styles.etiquetaFiltro}>Elegir candidato</label>
          <div className={styles.filaSelect}>
            <select
              id="candidatoRepresentado"
              disabled={estaEnviando || filtrados.length === 0}
              value={candidatoSeleccionado}
              onChange={(e) => setCandidatoSeleccionado(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Seleccionar candidato de mi cartera...</option>
              {filtrados.map((item) => {
                const nombre = item.nombre || item.usuario?.nombre_completo || "Talento";
                return (
                  <option key={item.candidato_id} value={item.candidato_id}>
                    {nombre} (
                    {ETIQUETAS_PUESTO_PROFESIONAL[item.perfil?.puesto] ?? item.perfil?.puesto}
                    {item.perfil?.posicion_juego ? ` - ${item.perfil.posicion_juego}` : ""})
                    {edadCandidato(item.perfil?.fecha_nacimiento) === null ? " · Edad sin informar" : ` · ${edadCandidato(item.perfil.fecha_nacimiento)} años`}
                  </option>
                );
              })}
            </select>
            <button
              type="submit"
              disabled={estaEnviando || !candidatoElegido}
              className={styles.botonPostular}
            >
              {estaEnviando ? "Postulando..." : "Postular candidato"}
            </button>
          </div>

          {/* Tarjeta de previsualización del candidato seleccionado */}
          {candidatoElegido && (
            <div className={styles.previsualizacion}>
              <div className={styles.previsualizacionFoto}>
                {candidatoElegido.perfil?.foto_url ? (
                  <ImagenAmpliable
                    src={candidatoElegido.perfil.foto_url}
                    alt={candidatoElegido.nombre || "Talento"}
                    className={styles.fotoTalento}
                  />
                ) : (
                  <div className={styles.fotoTalentoFallback}>
                    {(candidatoElegido.nombre || "T").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={styles.previsualizacionInfo}>
                <h4 className={styles.previsualizacionNombre}>
                  {candidatoElegido.nombre || candidatoElegido.usuario?.nombre_completo}
                </h4>
                <p className={styles.previsualizacionDetalle}>
                  {ETIQUETAS_PUESTO_PROFESIONAL[candidatoElegido.perfil?.puesto] ??
                    candidatoElegido.perfil?.puesto}
                  {candidatoElegido.perfil?.posicion_juego
                    ? ` · ${candidatoElegido.perfil.posicion_juego}`
                    : ""}
                  {candidatoElegido.perfil?.club_actual
                    ? ` · Club actual: ${candidatoElegido.perfil.club_actual}`
                    : ""}
                  {candidatoElegido.perfil?.provincia
                    ? ` · ${candidatoElegido.perfil.provincia}`
                    : ""}
                </p>
              </div>
            </div>
          )}
        </form>
      )}

      {mensaje.error && <p role="alert" className={styles.error}>{mensaje.error}</p>}
      {mensaje.exito && <p role="status" className={styles.exito}>{mensaje.exito}</p>}

      {postulacionesExistentes.length > 0 && (
        <div className={styles.yaPostulados}>
          <h4 className={styles.tituloPostulados}>Candidatos de tu cartera ya postulados:</h4>
          <ul className={styles.listaPostulados}>
            {postulacionesExistentes.map((p) => {
              const nombre =
                p.perfiles_candidato?.usuarios?.nombre_completo ?? "Candidato";
              const foto = p.perfiles_candidato?.foto_url;
              return (
                <li key={p.id} className={styles.itemPostulado}>
                  <div className="flex items-center gap-2.5">
                    {foto ? (
                      <ImagenAmpliable
                        src={foto}
                        alt={nombre}
                        className={styles.fotoMini}
                      />
                    ) : (
                      <div className={styles.fotoMiniFallback}>
                        {nombre.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold text-white">{nombre}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={styles.estadoBadge}>{ETIQUETAS_ESTADO_POSTULACION[p.estado] ?? p.estado}</span>
                    <CancelarPostulacion postulacionId={p.id} nombreCandidato={nombre} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
