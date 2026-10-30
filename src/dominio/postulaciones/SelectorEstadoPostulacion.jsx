"use client";

import { ETIQUETAS_ESTADO_POSTULACION } from "@/tipos/dominio";
import { SelectorDesplegable } from "@/componentes/SelectorDesplegable";
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
      <span id="etiquetaEstadoPostulacion" className={styles.etiquetaOculta}>
        Estado de la postulación
      </span>
      <SelectorDesplegable
        nombre="estado"
        etiquetaId="etiquetaEstadoPostulacion"
        valor={estado}
        deshabilitado={disabled}
        onCambio={onChange}
        className={CLASE_SELECT[estado] ?? ""}
        opciones={[
          // Un estado fuera de las acciones habituales (por ejemplo "contratado")
          // se muestra igual para no perder el valor guardado.
          ...(ESTADOS_ACCION.includes(estado)
            ? []
            : [{ valor: estado, texto: ETIQUETAS_ESTADO_POSTULACION[estado] ?? estado }]),
          ...ESTADOS_ACCION.map((valor) => ({
            valor,
            texto: ETIQUETAS_ESTADO_POSTULACION[valor],
          })),
        ]}
      />

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
