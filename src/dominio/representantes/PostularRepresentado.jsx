"use client";

import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import { SelectorDesplegable } from "@/componentes/SelectorDesplegable";
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
        setMensaje({ error: res.error, exito: null, limitePlan: Boolean(res.limitePlan) });
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
            <span className={styles.campoFiltro}><span id="filtroBuscarEn">Buscar en</span>
              <SelectorDesplegable
                valor={filtros.buscarPor}
                deshabilitado={estaEnviando}
                etiquetaId="filtroBuscarEn"
                onCambio={(valor) => cambiarFiltro("buscarPor", valor)}
                opciones={[
                  { valor: "todos", texto: "Nombre y apellido" },
                  { valor: "nombre", texto: "Nombres" },
                  { valor: "apellido", texto: "Apellidos" },
                ]}
              />
            </span>
            <span className={styles.campoFiltro}><span id="filtroOrden">Ordenar por</span>
              <SelectorDesplegable
                valor={filtros.orden}
                deshabilitado={estaEnviando}
                etiquetaId="filtroOrden"
                onCambio={(valor) => cambiarFiltro("orden", valor)}
                opciones={[
                  { valor: "nombre_asc", texto: "Nombre A–Z" },
                  { valor: "nombre_desc", texto: "Nombre Z–A" },
                  { valor: "apellido_asc", texto: "Apellido A–Z" },
                  { valor: "apellido_desc", texto: "Apellido Z–A" },
                  { valor: "edad_asc", texto: "Edad: menor a mayor" },
                  { valor: "edad_desc", texto: "Edad: mayor a menor" },
                ]}
              />
            </span>
            <label className={styles.campoFiltro}>Edad mínima
              <input type="number" min={0} max={120} step={1} value={filtros.edadMinima} disabled={estaEnviando} className={styles.select} onChange={e => cambiarFiltro("edadMinima", e.target.value)} />
            </label>
            <label className={styles.campoFiltro}>Edad máxima
              <input type="number" min={0} max={120} step={1} value={filtros.edadMaxima} disabled={estaEnviando} className={styles.select} onChange={e => cambiarFiltro("edadMaxima", e.target.value)} />
            </label>
            <span className={styles.campoFiltro}><span id="filtroProvinciaCartera">Provincia</span>
              <SelectorDesplegable
                valor={filtros.provincia}
                deshabilitado={estaEnviando}
                etiquetaId="filtroProvinciaCartera"
                onCambio={(valor) => cambiarFiltro("provincia", valor)}
                opciones={[
                  { valor: "", texto: "Todas las provincias" },
                  ...provincias.map((provincia) => ({ valor: provincia, texto: provincia })),
                ]}
              />
            </span>
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
          <span id="candidatoRepresentado" className={styles.etiquetaFiltro}>Elegir candidato</span>
          <div className={styles.filaSelect}>
            <SelectorDesplegable
              etiquetaId="candidatoRepresentado"
              className={styles.select}
              deshabilitado={estaEnviando || filtrados.length === 0}
              valor={candidatoSeleccionado}
              onCambio={setCandidatoSeleccionado}
              placeholder="Seleccionar candidato de mi cartera..."
              opciones={[
                { valor: "", texto: "Seleccionar candidato de mi cartera..." },
                ...filtrados.map((item) => {
                  const nombre = item.nombre || item.usuario?.nombre_completo || "Talento";
                  const puesto = ETIQUETAS_PUESTO_PROFESIONAL[item.perfil?.puesto] ?? item.perfil?.puesto;
                  const posicion = item.perfil?.posicion_juego ? ` - ${item.perfil.posicion_juego}` : "";
                  const edad = edadCandidato(item.perfil?.fecha_nacimiento);
                  return {
                    valor: item.candidato_id,
                    texto: `${nombre} (${puesto}${posicion}) · ${edad === null ? "Edad sin informar" : `${edad} años`}`,
                  };
                }),
              ]}
            />
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

      {mensaje.error && (
        <p role="alert" className={styles.error}>
          {mensaje.error}{" "}
          {mensaje.limitePlan && <Link href="/planes" className={styles.enlaceCartera}>Ver planes y mejorar el mío</Link>}
        </p>
      )}
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
