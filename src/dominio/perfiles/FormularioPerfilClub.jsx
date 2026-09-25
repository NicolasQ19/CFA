"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPerfilClub } from "@/dominio/perfiles/acciones-club";
import { PROVINCIAS_ARGENTINA, opcionesConValorActual } from "@/tipos/dominio";
import styles from "./FormularioPerfilClub.module.css";

const ESTADO_INICIAL = { error: null };

export function FormularioPerfilClub({ perfilExistente }) {
  const router = useRouter();
  const [estado, ejecutarGuardado, estaGuardando] = useActionState(
    guardarPerfilClub,
    ESTADO_INICIAL
  );
  const [mostrarExito, setMostrarExito] = useState(false);
  const estabaGuardandoRef = useRef(false);

  useEffect(() => {
    if (estabaGuardandoRef.current && !estaGuardando && !estado.error) {
      setMostrarExito(true);
      const temporizador = setTimeout(() => {
        router.push("/perfil-publico-club");
      }, 1200);
      return () => clearTimeout(temporizador);
    }
    estabaGuardandoRef.current = estaGuardando;
  }, [estaGuardando, estado.error, router]);

  return (
    <form action={ejecutarGuardado} className={styles.formulario}>
      <div className={styles.campo}>
        <label htmlFor="nombreClub" className={styles.etiqueta}>
          Nombre del club
        </label>
        <input
          id="nombreClub"
          name="nombreClub"
          required
          defaultValue={perfilExistente?.nombre_club ?? ""}
          className={styles.entrada}
        />
      </div>

      <div className={styles.campo}>
        <label htmlFor="provincia" className={styles.etiqueta}>
          Provincia
        </label>
        <select
          id="provincia"
          name="provincia"
          required
          defaultValue={perfilExistente?.provincia ?? ""}
          className={styles.entrada}
        >
          <option value="" disabled>
            Elegí una provincia
          </option>
          {opcionesConValorActual(PROVINCIAS_ARGENTINA, perfilExistente?.provincia).map((provincia) => (
            <option key={provincia} value={provincia}>
              {provincia}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.campo}>
        <label htmlFor="categoria" className={styles.etiqueta}>
          Categoría en la que compite
        </label>
        <input
          id="categoria"
          name="categoria"
          placeholder="Primera, Nacional B, Federal, Liga regional..."
          required
          defaultValue={perfilExistente?.categoria ?? ""}
          className={styles.entrada}
        />
      </div>

      {estado.error && <p className={styles.error}>{estado.error}</p>}

      {mostrarExito && <p className={styles.exito}>Guardado con éxito</p>}

      <button
        type="submit"
        disabled={estaGuardando}
        className={styles.botonEnviar}
      >
        {estaGuardando ? "Guardando..." : "Guardar datos del club"}
      </button>
    </form>
  );
}