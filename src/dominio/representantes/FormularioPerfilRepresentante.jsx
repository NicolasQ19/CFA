"use client";

import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import { useActionState, useState, useEffect } from "react";
import { guardarPerfilRepresentante } from "@/dominio/representantes/acciones";
import { completitudRepresentante } from "@/lib/perfil-representante";
import styles from "./FormularioPerfilRepresentante.module.css";

const ESTADO_INICIAL = { error: null, exito: false };

export function FormularioPerfilRepresentante({ perfilActual = null, nombreActual = null }) {
  const [estado, ejecutarGuardado, estaGuardando] = useActionState(
    guardarPerfilRepresentante,
    ESTADO_INICIAL
  );
  const [mensajeExito, setMensajeExito] = useState(false);
  const [presentacion, setPresentacion] = useState(perfilActual?.presentacion ?? "");
  const [borrador, setBorrador] = useState(() => ({
    nombre_agencia: perfilActual?.nombre_agencia ?? nombreActual ?? "",
    telefono: perfilActual?.telefono ?? "",
    correo_contacto: perfilActual?.correo_contacto ?? "",
    nacionalidad: perfilActual?.nacionalidad ?? "",
    sitio_web: perfilActual?.sitio_web ?? "",
    especializacion: perfilActual?.especializacion ?? "",
    zona_trabajo: perfilActual?.zona_trabajo ?? "",
  }));
  const [quitarFoto, setQuitarFoto] = useState(false);
  const fotoInicial = perfilActual?.foto_url ?? null;
  const [vistaPreviaFoto, setVistaPreviaFoto] = useState(fotoInicial);

  useEffect(() => {
    if (!vistaPreviaFoto?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(vistaPreviaFoto);
  }, [vistaPreviaFoto]);

  function editarCampo(campo) {
    return (evento) => setBorrador((anterior) => ({ ...anterior, [campo]: evento.target.value }));
  }

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
      setQuitarFoto(false);
      setVistaPreviaFoto(URL.createObjectURL(archivo));
    } else {
      setVistaPreviaFoto(fotoInicial);
    }
  }

  const avance = completitudRepresentante({ ...borrador, presentacion, foto_url: quitarFoto ? null : vistaPreviaFoto });

  return (
    <form action={ejecutarGuardado} className={styles.formulario}>
      <section className={styles.indicador} aria-labelledby="tituloCompletitud">
        <div className={styles.encabezadoIndicador}>
          <h3 id="tituloCompletitud" className={styles.tituloSeccion}>Completitud del perfil</h3>
          <span className={styles.porcentaje}>{avance.porcentaje}%</span>
        </div>
        <progress className={styles.progreso} max={100} value={avance.porcentaje} aria-label="Completitud del perfil del representante" />
        <p className={styles.ayuda}>{avance.completos} de {avance.total} secciones completas. Refleja lo que estás editando; guardá para conservar los cambios. Los datos opcionales no son requisitos para guardar.</p>
        {avance.porcentaje === 100 ? (
          <p className={styles.perfilCompleto}>✓ Completaste todas las secciones del perfil.</p>
        ) : (
          <div>
            <p className={styles.ayuda}>Podés completar:</p>
            <ul className={styles.pendientes}>
              {avance.secciones.filter((seccion) => !seccion.completo).map((seccion) => (
                <li key={seccion.id}><a href={`#${seccion.id}`} onClick={(evento) => {
                  evento.preventDefault();
                  document.getElementById(seccion.id)?.focus();
                }}>{seccion.etiqueta}</a></li>
              ))}
            </ul>
          </div>
        )}
      </section>
      {/* 1. Foto / Logo de la Agencia */}
      <div className={styles.seccionFoto}>
        <div className={styles.fotoContenedor}>
          {vistaPreviaFoto && !quitarFoto ? (
            <ImagenAmpliable
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
              <input type="checkbox" name="quitarFoto" checked={quitarFoto} onChange={(evento) => setQuitarFoto(evento.target.checked)} />
              <span>Quitar foto actual</span>
            </label>
          )}
        </div>
      </div>

      {/* 2. Datos institucionales y de contacto */}
      <div className={`${styles.grillaCampos} ${styles.datosContacto}`}>
        <h2 className={`${styles.tituloSeccion} ${styles.campoCompleto}`}>Identidad y contacto</h2>
        <div className={`${styles.campo} ${styles.campoCompleto}`}>
          <label htmlFor="nombreAgencia" className={styles.etiqueta}>
            Nombre de la Agencia o Representación *
          </label>
          <input
            id="nombreAgencia"
            name="nombreAgencia"
            type="text"
            value={borrador.nombre_agencia} onChange={editarCampo("nombre_agencia")}
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
            value={borrador.telefono} onChange={editarCampo("telefono")}
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
            value={borrador.correo_contacto} onChange={editarCampo("correo_contacto")}
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
            value={borrador.nacionalidad} onChange={editarCampo("nacionalidad")}
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
            value={borrador.sitio_web} onChange={editarCampo("sitio_web")}
            placeholder="Ej: https://www.agenciatouch.com"
            maxLength={500}
            className={styles.entrada}
          />
        </div>
      </div>

      <fieldset className={styles.seccionProfesional}>
        <legend className={styles.tituloSeccion}>Presentación profesional</legend>
        <p className={styles.ayuda}>Contá quién sos, a quiénes representás y dónde trabajás. Estos campos son opcionales.</p>
        <div className={styles.grillaCampos}>
          <div className={`${styles.campo} ${styles.campoCompleto}`}>
            <label htmlFor="presentacion" className={styles.etiqueta}>Sobre vos y tu agencia</label>
            <textarea id="presentacion" name="presentacion" rows={5}
              value={presentacion} onChange={(e) => setPresentacion(e.target.value)}
              maxLength={2000} className={`${styles.entrada} ${styles.areaTexto}`}
              placeholder="Contá tu trayectoria, cómo acompañás a tus representados y qué servicios ofrecés."
              aria-describedby="ayudaPresentacion contadorPresentacion" />
            <div className={styles.pieCampo}>
              <span id="ayudaPresentacion" className={styles.ayuda}>Tu experiencia, servicios y forma de trabajar.</span>
              <span id="contadorPresentacion" className={styles.contador}>{presentacion.length}/2000</span>
            </div>
          </div>
          <div className={styles.campo}>
            <label htmlFor="especializacion" className={styles.etiqueta}>Especialización</label>
            <textarea id="especializacion" name="especializacion" rows={3} maxLength={300}
              value={borrador.especializacion} onChange={editarCampo("especializacion")}
              placeholder="Ej: jugadores juveniles, fútbol femenino y cuerpo técnico"
              aria-describedby="ayudaEspecializacion" className={`${styles.entrada} ${styles.areaTexto}`} />
            <span id="ayudaEspecializacion" className={styles.ayuda}>Indicá los perfiles y categorías que representás. Hasta 300 caracteres.</span>
          </div>
          <div className={styles.campo}>
            <label htmlFor="zonaTrabajo" className={styles.etiqueta}>Zona de trabajo</label>
            <textarea id="zonaTrabajo" name="zonaTrabajo" rows={3} maxLength={300}
              value={borrador.zona_trabajo} onChange={editarCampo("zona_trabajo")}
              placeholder="Ej: Buenos Aires y Córdoba; operaciones en Argentina y Uruguay"
              aria-describedby="ayudaZonaTrabajo" className={`${styles.entrada} ${styles.areaTexto}`} />
            <span id="ayudaZonaTrabajo" className={styles.ayuda}>Ciudades, provincias o países donde buscás oportunidades. Hasta 300 caracteres.</span>
          </div>
        </div>
      </fieldset>

      {estado?.error && <p role="alert" className={styles.error}>{estado.error}</p>}
      {mensajeExito && (
        <p role="status" className={styles.exito}>✓ Perfil del representante actualizado correctamente.</p>
      )}

      <div className={styles.barraAcciones}>
      <p className={styles.ayuda}>Guardá para actualizar la información de tu perfil público.</p>
      <button
        type="submit"
        disabled={estaGuardando}
        className={styles.botonGuardar}
      >
        {estaGuardando ? "Guardando datos..." : "Guardar datos de agencia"}
      </button>
      </div>
    </form>
  );
}
