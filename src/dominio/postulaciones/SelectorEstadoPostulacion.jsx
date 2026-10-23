"use client";

import { ETIQUETAS_ESTADO_POSTULACION } from "@/tipos/dominio";
import styles from "./SelectorEstadoPostulacion.module.css";

const ESTADOS_ACCION = ["postulado", "visto", "preseleccionado", "rechazado"];

const CLASE_SELECT = {
  postulado: styles.selectPostulado,
  visto: styles.selectVisto,
  preseleccionado: styles.selectPreseleccionado,
  rechazado: styles.selectRechazado,
};

export function SelectorEstadoPostulacion({ estado, onChange, disabled }) {
  return (
    <div className={styles.contenedor}>
      <select
        name="estado"
        value={estado}
        disabled={disabled}
        onChange={(evento) => onChange(evento.target.value)}
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
            disabled={disabled}
            onClick={() => onChange(clave)}
            className={`${styles.botonRapido} ${estado === clave ? styles.botonActivo : ""}`}
          >
            {ETIQUETAS_ESTADO_POSTULACION[clave]}
          </button>
        ))}
      </div>

      <p className={styles.feedback}>Se aplicará al guardar seguimiento.</p>
    </div>
  );
}
