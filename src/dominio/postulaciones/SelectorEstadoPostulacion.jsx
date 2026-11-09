"use client";

import { ETIQUETAS_ESTADO_POSTULACION, TRANSICIONES_POSTULACION_DEL_CLUB } from "@/tipos/dominio";
import { SelectorDesplegable } from "@/componentes/SelectorDesplegable";
import styles from "./SelectorEstadoPostulacion.module.css";

const CLASE_SELECT = {
  postulado: styles.selectPostulado,
  visto: styles.selectVisto,
  preseleccionado: styles.selectPreseleccionado,
  rechazado: styles.selectRechazado,
};

export function SelectorEstadoPostulacion({ estado, estadoGuardado, onChange, disabled }) {
  const siguientes = TRANSICIONES_POSTULACION_DEL_CLUB[estadoGuardado] ?? [];

  return (
    <div className={styles.contenedor}>
      <span id="etiquetaEstadoPostulacion" className={styles.etiquetaOculta}>
        Estado de la postulación
      </span>
      <SelectorDesplegable
        nombre="estado"
        etiquetaId="etiquetaEstadoPostulacion"
        valor={estado}
        deshabilitado={disabled || siguientes.length === 0}
        onCambio={onChange}
        className={CLASE_SELECT[estado] ?? ""}
        opciones={[estadoGuardado, ...siguientes].map((valor) => ({
          valor,
          texto: ETIQUETAS_ESTADO_POSTULACION[valor] ?? valor,
        }))}
      />

      <div className={styles.accionesRapidas}>
        {siguientes.map((clave) => (
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

      <p className={styles.feedback}>{siguientes.length ? "Se aplicará al guardar seguimiento." : "Este estado es final."}</p>
    </div>
  );
}
