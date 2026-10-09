"use client";

import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
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

      <fieldset className={styles.seccion}>
        <legend>Identidad del club</legend>
        {perfilExistente?.escudo_url && <ImagenAmpliable src={perfilExistente.escudo_url} alt="Escudo actual del club" className={styles.escudo} />}
        <label htmlFor="escudo" className={styles.etiqueta}>Escudo (JPG, PNG o WebP, hasta 2 MB)</label>
        <input id="escudo" name="escudo" type="file" accept="image/jpeg,image/png,image/webp" className={styles.entrada} />
        {perfilExistente?.escudo_url && <label><input type="checkbox" name="quitarEscudo" /> Quitar escudo actual</label>}
        <label htmlFor="localidad" className={styles.etiqueta}>Localidad</label>
        <input id="localidad" name="localidad" maxLength={120} defaultValue={perfilExistente?.localidad ?? ""} className={styles.entrada} />
        <label htmlFor="descripcion" className={styles.etiqueta}>Acerca del club</label>
        <textarea id="descripcion" name="descripcion" maxLength={2000} rows={5} defaultValue={perfilExistente?.descripcion ?? ""} className={styles.entrada} placeholder="Historia, identidad y proyecto deportivo del club." />
        <label htmlFor="instalaciones" className={styles.etiqueta}>Instalaciones</label>
        <textarea id="instalaciones" name="instalaciones" maxLength={2000} rows={4} defaultValue={perfilExistente?.instalaciones ?? ""} className={styles.entrada} placeholder="Canchas, gimnasio, vestuarios y otros espacios." />
      </fieldset>
      <fieldset className={styles.seccion}>
        <legend>Sitio web y redes</legend>
        {[["sitioWeb", "sitio_web", "Sitio web"], ["instagram", "instagram", "Instagram"], ["facebook", "facebook", "Facebook"]].map(([campo, clave, etiqueta]) => <div key={campo} className={styles.campo}>
          <label htmlFor={campo} className={styles.etiqueta}>{etiqueta}</label>
          <input id={campo} name={campo} type="url" maxLength={500} placeholder="https://…" defaultValue={perfilExistente?.[clave] ?? ""} className={styles.entrada} />
        </div>)}
      </fieldset>

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