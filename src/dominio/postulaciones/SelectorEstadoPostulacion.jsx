"use client";

import { useEffect, useState, useTransition } from "react";
import { ETIQUETAS_ESTADO_POSTULACION } from "@/tipos/dominio";
import { actualizarEstadoPostulacion } from "./acciones-club";
import styles from "./SelectorEstadoPostulacion.module.css";

const ESTADOS_ACCION = ["postulado", "visto", "preseleccionado", "rechazado"];

const CLASE_SELECT = {
  postulado: styles.selectPostulado,
  visto: styles.selectVisto,
  preseleccionado: styles.selectPreseleccionado,
  rechazado: styles.selectRechazado,
};

export function SelectorEstadoPostulacion({ postulacionId, ofertaId, estadoInicial }) {
  const [estado, setEstado] = useState(estadoInicial);
  useEffect(() => setEstado(estadoInicial), [estadoInicial]);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [estaEnviando, iniciarTransicion] = useTransition();

  function cambiarEstado(nuevoEstado) {
    if (nuevoEstado === estado) return;

    const estadoAnterior = estado;
    setEstado(nuevoEstado);
    setError(null);
    setMensaje(null);

    iniciarTransicion(async () => {
      const resultado = await actualizarEstadoPostulacion({
        postulacionId,
        nuevoEstado,
        ofertaId,
      });

      if (resultado?.error) {
        setEstado(estadoAnterior);
        setError(resultado.error);
        return;
      }

      setMensaje("Estado actualizado");
    });
  }

  return (
    <div className={styles.contenedor}>
      <select
        value={estado}
        disabled={estaEnviando}
        onChange={(evento) => cambiarEstado(evento.target.value)}
        className={`${styles.select} ${CLASE_SELECT[estado] ?? ""}`}
        aria-label="Estado de la postulación"
      >
        {!ESTADOS_ACCION.includes(estado) && <option value={estado}>{ETIQUETAS_ESTADO_POSTULACION[estado] ?? estado}</option>}
        {ESTADOS_ACCION.map((clave) => (
          <option key={clave} value={clave}>
            {ETIQUETAS_ESTADO_POSTULACION[clave]}
          </option>
        ))}
      </select>

      <div className={styles.accionesRapidas}>
        {["visto", "preseleccionado", "rechazado"].map((clave) => (
          <button
            key={clave}
            type="button"
            disabled={estaEnviando}
            onClick={() => cambiarEstado(clave)}
            className={`${styles.botonRapido} ${estado === clave ? styles.botonActivo : ""}`}
          >
            {ETIQUETAS_ESTADO_POSTULACION[clave]}
          </button>
        ))}
      </div>

      {estaEnviando && <p className={styles.feedback}>Guardando...</p>}
      {!estaEnviando && mensaje && <p className={styles.feedback}>{mensaje}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
