"use client";

import { useActionState, useState } from "react";
import { crearOferta } from "@/dominio/ofertas/acciones";
import { ETIQUETAS_PUESTO_PROFESIONAL, ETIQUETAS_TIPO_CONTRATO } from "@/tipos/dominio";
import styles from "./FormularioNuevaOferta.module.css";

const ESTADO_INICIAL = { error: null };

export function FormularioNuevaOferta() {
  const [estado, ejecutarCreacion, estaEnviando] = useActionState(crearOferta, ESTADO_INICIAL);
  const [puestoBuscado, setPuestoBuscado] = useState("jugador");

  return (
    <form action={ejecutarCreacion} className={styles.formulario}>
      <div className={styles.campo}>
        <label htmlFor="puestoBuscado" className={styles.etiqueta}>
          Puesto buscado
        </label>
        <select
          id="puestoBuscado"
          name="puestoBuscado"
          value={puestoBuscado}
          onChange={(evento) => setPuestoBuscado(evento.target.value)}
          className={styles.entrada}
        >
          {Object.entries(ETIQUETAS_PUESTO_PROFESIONAL).map(([clave, texto]) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
      </div>

      {puestoBuscado === "jugador" && (
        <div className={styles.campo}>
          <label htmlFor="posicionJuego" className={styles.etiqueta}>
            Posición
          </label>
          <input id="posicionJuego" name="posicionJuego" className={styles.entrada} />
        </div>
      )}

      <div className={styles.campo}>
        <label htmlFor="categoria" className={styles.etiqueta}>
          Categoría
        </label>
        <input
          id="categoria"
          name="categoria"
          placeholder="Primera, Nacional B, Federal, Liga regional..."
          required
          className={styles.entrada}
        />
      </div>

      <div className={styles.campo}>
        <label htmlFor="tipoContrato" className={styles.etiqueta}>
          Tipo de contrato
        </label>
        <select id="tipoContrato" name="tipoContrato" required defaultValue="" className={styles.entrada}>
          <option value="" disabled>
            Elegí un tipo
          </option>
          {Object.entries(ETIQUETAS_TIPO_CONTRATO).map(([clave, texto]) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.campo}>
        <label htmlFor="provincia" className={styles.etiqueta}>
          Provincia
        </label>
        <input id="provincia" name="provincia" required className={styles.entrada} />
      </div>

      <div className={styles.campo}>
        <label htmlFor="descripcion" className={styles.etiqueta}>
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={5}
          required
          className={styles.entrada}
        />
      </div>

      {estado.error && (
        <p className={styles.error}>{estado.error}</p>
      )}

      <button
        type="submit"
        disabled={estaEnviando}
        className={styles.botonEnviar}
      >
        {estaEnviando ? "Publicando..." : "Publicar oferta"}
      </button>
    </form>
  );
}
