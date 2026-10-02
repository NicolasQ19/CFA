"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { postularCandidatoRepresentado } from "@/dominio/representantes/acciones";
import { ETIQUETAS_ESTADO_POSTULACION, ETIQUETAS_PUESTO_PROFESIONAL } from "@/tipos/dominio";
import styles from "./PostularRepresentado.module.css";

export function PostularRepresentado({ ofertaId, cartera, postulacionesExistentes = [] }) {
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState("");
  const [estaEnviando, iniciarTransicion] = useTransition();
  const [mensaje, setMensaje] = useState({ error: null, exito: null });

  // Filtrar candidatos de la cartera que aún no están postulados a esta oferta
  const idsYaPostulados = postulacionesExistentes.map((p) => p.candidato_id);
  const disponibles = cartera.filter((c) => !idsYaPostulados.includes(c.candidato_id));

  const candidatoElegido = disponibles.find(
    (c) => c.candidato_id === candidatoSeleccionado
  );

  function manejarPostulacion(e) {
    e.preventDefault();
    if (!candidatoSeleccionado) return;

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
        Como representante, podés postular a cualquiera de tus talentos a esta oferta laboral.
      </p>

      {cartera.length === 0 ? (
        <p className={styles.avisoVacio}>
          Aún no tenés candidatos en tu cartera.{" "}
          <Link href="/mi-cartera" className={styles.enlaceCartera}>
            Ir a Mi cartera para sumar candidatos ↗
          </Link>
        </p>
      ) : disponibles.length === 0 ? (
        <p className={styles.avisoVacio}>
          Todos los candidatos de tu cartera ya están postulados a esta oferta.
        </p>
      ) : (
        <form onSubmit={manejarPostulacion} className={styles.formulario}>
          <div className={styles.filaSelect}>
            <select
              value={candidatoSeleccionado}
              onChange={(e) => setCandidatoSeleccionado(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Seleccionar candidato de mi cartera...</option>
              {disponibles.map((item) => {
                const nombre = item.nombre || item.usuario?.nombre_completo || "Talento";
                return (
                  <option key={item.candidato_id} value={item.candidato_id}>
                    {nombre} (
                    {ETIQUETAS_PUESTO_PROFESIONAL[item.perfil?.puesto] ?? item.perfil?.puesto}
                    {item.perfil?.posicion_juego ? ` - ${item.perfil.posicion_juego}` : ""})
                  </option>
                );
              })}
            </select>
            <button
              type="submit"
              disabled={estaEnviando || !candidatoSeleccionado}
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
                  <img
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

      {mensaje.error && <p className={styles.error}>{mensaje.error}</p>}
      {mensaje.exito && <p className={styles.exito}>{mensaje.exito}</p>}

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
                      <img
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
                  <span className={styles.estadoBadge}>
                    {ETIQUETAS_ESTADO_POSTULACION[p.estado] ?? p.estado}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
