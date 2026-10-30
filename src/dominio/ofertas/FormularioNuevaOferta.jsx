"use client";

import { useActionState, useState } from "react";
import { SelectorDesplegable } from "@/componentes/SelectorDesplegable";
import Link from "next/link";
import { crearOferta } from "@/dominio/ofertas/acciones";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  ETIQUETAS_TIPO_CONTRATO,
  POSICIONES_DE_JUEGO,
  PROVINCIAS_ARGENTINA,
} from "@/tipos/dominio";
import styles from "./FormularioNuevaOferta.module.css";

const ESTADO_INICIAL = { error: null };

export function FormularioNuevaOferta() {
  const [estado, ejecutarCreacion, estaEnviando] = useActionState(crearOferta, ESTADO_INICIAL);
  const [puestoBuscado, setPuestoBuscado] = useState("jugador");

  return (
    <form action={ejecutarCreacion} className={styles.formulario}>
      <div className={styles.campo}>
        <span id="puestoBuscado" className={styles.etiqueta}>
          Puesto buscado
        </span>
        <SelectorDesplegable
          nombre="puestoBuscado"
          etiquetaId="puestoBuscado"
          valor={puestoBuscado}
          onCambio={setPuestoBuscado}
          opciones={Object.entries(ETIQUETAS_PUESTO_PROFESIONAL).map(([valor, texto]) => ({ valor, texto }))}
        />
      </div>

      {puestoBuscado === "jugador" && (
        <div className={styles.campo}>
          <span id="posicionJuego" className={styles.etiqueta}>
            Posición
          </span>
          <SelectorDesplegable
            nombre="posicionJuego"
            etiquetaId="posicionJuego"
            opciones={[
              { valor: "", texto: "Cualquier posición" },
              ...POSICIONES_DE_JUEGO.map((posicion) => ({ valor: posicion, texto: posicion })),
            ]}
          />
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
        <span id="tipoContrato" className={styles.etiqueta}>
          Tipo de contrato
        </span>
        <SelectorDesplegable
          nombre="tipoContrato"
          etiquetaId="tipoContrato"
          placeholder="Elegí un tipo"
          opciones={Object.entries(ETIQUETAS_TIPO_CONTRATO).map(([valor, texto]) => ({ valor, texto }))}
        />
      </div>

      <div className={styles.campo}>
        <span id="provincia" className={styles.etiqueta}>
          Provincia
        </span>
        <SelectorDesplegable
          nombre="provincia"
          etiquetaId="provincia"
          placeholder="Elegí una provincia"
          opciones={PROVINCIAS_ARGENTINA.map((provincia) => ({ valor: provincia, texto: provincia }))}
        />
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
        <div className={styles.aviso}>
          <p className={styles.error}>{estado.error}</p>
          {estado.limitePlan && (
            <Link href="/planes" className={styles.enlacePlan}>
              Ver planes y mejorar el mío
            </Link>
          )}
        </div>
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
