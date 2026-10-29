"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { editarOferta } from "@/dominio/ofertas/acciones";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  ETIQUETAS_TIPO_CONTRATO,
  POSICIONES_DE_JUEGO,
  PROVINCIAS_ARGENTINA,
  opcionesConValorActual,
} from "@/tipos/dominio";
import styles from "./FormularioEditarOferta.module.css";

const ESTADO_INICIAL = { error: null };

export function FormularioEditarOferta({ oferta }) {
  const [estado, ejecutarEdicion, estaEnviando] = useActionState(editarOferta, ESTADO_INICIAL);
  const [puestoBuscado, setPuestoBuscado] = useState(oferta.puesto_buscado || "jugador");
  const posiciones = opcionesConValorActual(POSICIONES_DE_JUEGO, oferta.posicion_juego);
  const provincias = opcionesConValorActual(PROVINCIAS_ARGENTINA, oferta.provincia);
  const esRechazada = oferta.estado === "rechazada";

  return (
    <form action={ejecutarEdicion} className={styles.formulario}>
      <input type="hidden" name="ofertaId" value={oferta.id} />

      {esRechazada && (
        <p role="status" className={styles.avisoModeracion}>
          Esta oferta fue rechazada. Al guardar los cambios volverá a enviarse a moderación.
        </p>
      )}

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
          <select
            id="posicionJuego"
            name="posicionJuego"
            defaultValue={oferta.posicion_juego || ""}
            className={styles.entrada}
          >
            <option value="">Cualquier posición</option>
            {posiciones.map((posicion) => (
              <option key={posicion} value={posicion}>
                {posicion}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.campo}>
        <label htmlFor="categoria" className={styles.etiqueta}>
          Categoría
        </label>
        <input
          id="categoria"
          name="categoria"
          defaultValue={oferta.categoria || ""}
          placeholder="Primera, Nacional B, Federal, Liga regional..."
          required
          className={styles.entrada}
        />
      </div>

      <div className={styles.campo}>
        <label htmlFor="tipoContrato" className={styles.etiqueta}>
          Tipo de contrato
        </label>
        <select
          id="tipoContrato"
          name="tipoContrato"
          required
          defaultValue={oferta.tipo_contrato || ""}
          className={styles.entrada}
        >
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
        <select
          id="provincia"
          name="provincia"
          required
          defaultValue={oferta.provincia || ""}
          className={styles.entrada}
        >
          <option value="" disabled>
            Elegí una provincia
          </option>
          {provincias.map((provincia) => (
            <option key={provincia} value={provincia}>
              {provincia}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.campo}>
        <label htmlFor="descripcion" className={styles.etiqueta}>
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={6}
          defaultValue={oferta.descripcion || ""}
          required
          className={styles.entrada}
        />
      </div>

      {estado?.error && (
        <p role="alert" className={styles.error}>{estado.error}</p>
      )}

      <div className={styles.acciones}>
        <button
          type="submit"
          disabled={estaEnviando}
          className={styles.botonEnviar}
        >
          {estaEnviando
            ? "Guardando cambios..."
            : esRechazada
              ? "Guardar y reenviar a moderación"
              : "Guardar cambios"}
        </button>
        <Link href="/mis-ofertas" className={styles.botonCancelar}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
