"use client";

import { useActionState, useState, useEffect } from "react";
import { guardarPerfilRepresentante } from "@/dominio/representantes/acciones";
import styles from "./FormularioPerfilRepresentante.module.css";

const ESTADO_INICIAL = { error: null, exito: false };

export function FormularioPerfilRepresentante({ perfilActual = null, nombreActual = null }) {
  const [estado, ejecutarGuardado, estaGuardando] = useActionState(
    guardarPerfilRepresentante,
    ESTADO_INICIAL
  );
  const [mensajeExito, setMensajeExito] = useState(false);
  const fotoInicial = perfilActual?.foto_url ?? null;
  const [vistaPreviaFoto, setVistaPreviaFoto] = useState(fotoInicial);

  useEffect(() => {
    if (estado?.exito) {
      setMensajeExito(true);
      const timer = setTimeout(() => setMensajeExito(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [estado]);

  function alElegirFoto(e) {
    const archivo = e.target.files?.[0];
    if (archivo) {
      setVistaPreviaFoto(URL.createObjectURL(archivo));
    } else {
      setVistaPreviaFoto(fotoInicial);
    }
  }

  const nombreAgencia = perfilActual?.nombre_agencia ?? nombreActual ?? "";

  return (
    <form action={ejecutarGuardado} className={styles.formulario}>
      {/* 1. Foto / Logo de la Agencia */}
      <div className={styles.seccionFoto}>
        <div className={styles.fotoContenedor}>
          {vistaPreviaFoto ? (
            <img
              src={vistaPreviaFoto}
              alt="Logo de la agencia"
              className={styles.foto}
            />
          ) : (
            <div className={styles.fotoVacia}>
              <span>🏢</span>
              <span>Sin logo</span>
            </div>
          )}
        </div>
        <div className={styles.fotoAcciones}>
          <label htmlFor="foto" className={styles.etiqueta}>
            Foto personal o logo de la agencia (JPG, PNG o WebP, máx 2 MB)
          </label>
          <input
            id="foto"
            name="foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={alElegirFoto}
            className={styles.entradaArchivo}
          />
          {fotoInicial && (
            <label className={styles.casilla}>
              <input type="checkbox" name="quitarFoto" />
              <span>Quitar foto actual</span>
            </label>
          )}
        </div>
      </div>

      {/* 2. Datos institucionales y de contacto */}
      <div className={styles.grillaCampos}>
        <div className={`${styles.campo} ${styles.campoCompleto}`}>
          <label htmlFor="nombreAgencia" className={styles.etiqueta}>
            Nombre de la Agencia o Representación *
          </label>
          <input
            id="nombreAgencia"
            name="nombreAgencia"
            type="text"
            defaultValue={nombreAgencia}
            placeholder="Ej: Talentos del Sur Sports / Gestión Profesional"
            required
            className={styles.entrada}
          />
        </div>

        <div className={styles.campo}>
          <label htmlFor="telefono" className={styles.etiqueta}>
            Número de teléfono o WhatsApp
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            defaultValue={perfilActual?.telefono ?? ""}
            placeholder="Ej: +54 9 11 5555-5555"
            maxLength={50}
            className={styles.entrada}
          />
        </div>

        <div className={styles.campo}>
          <label htmlFor="correoContacto" className={styles.etiqueta}>
            Correo electrónico de contacto
          </label>
          <input
            id="correoContacto"
            name="correoContacto"
            type="email"
            defaultValue={perfilActual?.correo_contacto ?? ""}
            placeholder="Ej: contacto@agenciasports.com"
            maxLength={150}
            className={styles.entrada}
          />
        </div>

        <div className={styles.campo}>
          <label htmlFor="nacionalidad" className={styles.etiqueta}>
            Nacionalidad / País de radicación
          </label>
          <input
            id="nacionalidad"
            name="nacionalidad"
            type="text"
            defaultValue={perfilActual?.nacionalidad ?? ""}
            placeholder="Ej: Argentina / Uruguay"
            maxLength={100}
            className={styles.entrada}
          />
        </div>

        <div className={styles.campo}>
          <label htmlFor="sitioWeb" className={styles.etiqueta}>
            Sitio web oficial (o enlace a redes)
          </label>
          <input
            id="sitioWeb"
            name="sitioWeb"
            type="text"
            defaultValue={perfilActual?.sitio_web ?? ""}
            placeholder="Ej: https://www.agenciatouch.com"
            maxLength={500}
            className={styles.entrada}
          />
        </div>
      </div>

      {estado?.error && <p className={styles.error}>{estado.error}</p>}
      {mensajeExito && (
        <p className={styles.exito}>✓ Datos de agencia actualizados correctamente.</p>
      )}

      <button
        type="submit"
        disabled={estaGuardando}
        className={styles.botonGuardar}
      >
        {estaGuardando ? "Guardando datos..." : "Guardar datos de agencia"}
      </button>
    </form>
  );
}
