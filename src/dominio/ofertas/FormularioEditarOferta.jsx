"use client";

import { useActionState, useState } from "react";
import { SelectorDesplegable } from "@/componentes/SelectorDesplegable";
import Link from "next/link";
import { editarOferta } from "@/dominio/ofertas/acciones";
import { obtenerReglasEdicionOferta } from "@/lib/editar-oferta";
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

  const reglas = obtenerReglasEdicionOferta(oferta, oferta.total_postulantes);

  return (
    <form action={ejecutarEdicion} className={styles.formulario}>
      <input type="hidden" name="ofertaId" value={oferta.id} />

      {reglas.requiereReenvioModeracion && (
        <p role="status" className={styles.avisoModeracion}>
          Esta oferta fue rechazada. Al guardar los cambios volverá a enviarse a moderación.
        </p>
      )}

      {reglas.identidadEditable ? (
        <>
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
                valorInicial={oferta.posicion_juego || ""}
                opciones={[
                  { valor: "", texto: "Cualquier posición" },
                  ...posiciones.map((posicion) => ({ valor: posicion, texto: posicion })),
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
              defaultValue={oferta.categoria || ""}
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
              valorInicial={oferta.tipo_contrato || ""}
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
              valorInicial={oferta.provincia || ""}
              placeholder="Elegí una provincia"
              opciones={provincias.map((provincia) => ({ valor: provincia, texto: provincia }))}
            />
          </div>
        </>
      ) : (
        <section className={styles.fichaBloqueada} aria-label="Condiciones fijas de la oferta">
          <h2 className={styles.tituloBloqueado}>Condiciones fijas de la búsqueda</h2>
          <p className={styles.notaBloqueado}>
            Para proteger a los candidatos postulados y la integridad de las publicaciones, el puesto y las condiciones principales quedan fijados una vez publicada la oferta o recibidas postulaciones. Si buscás otro perfil, publicá una nueva oferta.
          </p>
          <dl className={styles.grillaBloqueada}>
            <div className={styles.datoBloqueado}>
              <dt>Puesto buscado</dt>
              <dd>{ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado}</dd>
            </div>
            {oferta.puesto_buscado === "jugador" && (
              <div className={styles.datoBloqueado}>
                <dt>Posición</dt>
                <dd>{oferta.posicion_juego || "Cualquier posición"}</dd>
              </div>
            )}
            <div className={styles.datoBloqueado}>
              <dt>Categoría</dt>
              <dd>{oferta.categoria}</dd>
            </div>
            <div className={styles.datoBloqueado}>
              <dt>Tipo de contrato</dt>
              <dd>{ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato] ?? oferta.tipo_contrato}</dd>
            </div>
            <div className={styles.datoBloqueado}>
              <dt>Provincia</dt>
              <dd>{oferta.provincia}</dd>
            </div>
          </dl>
        </section>
      )}

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
            : reglas.requiereReenvioModeracion
              ? "Guardar y enviar a moderación"
              : "Guardar cambios"}
        </button>
        <Link href="/mis-ofertas" className={styles.botonCancelar}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
