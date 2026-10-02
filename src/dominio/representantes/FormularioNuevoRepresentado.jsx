"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  crearCandidatoRepresentado,
  actualizarCandidatoRepresentado,
} from "@/dominio/representantes/acciones";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  POSICIONES_DE_JUEGO,
  PIERNAS_HABILES,
  PROVINCIAS_ARGENTINA,
  esPuestoDeCuerpoTecnico,
} from "@/tipos/dominio";
import styles from "./FormularioNuevoRepresentado.module.css";

const ESTADO_INICIAL = { error: null };

export function FormularioNuevoRepresentado({ candidatoExistente = null }) {
  const accion = candidatoExistente
    ? actualizarCandidatoRepresentado.bind(null, candidatoExistente.usuario_id)
    : crearCandidatoRepresentado;

  const [estado, ejecutarAccion, estaGuardando] = useActionState(
    accion,
    ESTADO_INICIAL
  );

  const [puesto, setPuesto] = useState(candidatoExistente?.puesto ?? "jugador");
  const esCuerpoTecnico = esPuestoDeCuerpoTecnico(puesto);

  const fotoInicial = candidatoExistente?.foto_url ?? null;
  const [vistaPreviaFoto, setVistaPreviaFoto] = useState(fotoInicial);

  const videos = candidatoExistente?.enlaces_video ?? [];

  function alElegirFoto(e) {
    const archivo = e.target.files?.[0];
    if (archivo) {
      setVistaPreviaFoto(URL.createObjectURL(archivo));
    } else {
      setVistaPreviaFoto(fotoInicial);
    }
  }

  return (
    <form action={ejecutarAccion} className={styles.formulario}>
      {estado?.error && <div className={styles.error}>{estado.error}</div>}

      {/* 1. Información del Talento y Foto */}
      <div className={styles.seccion}>
        <h3 className={styles.tituloSeccion}>1. Información del Talento y Foto</h3>
        
        {/* Selector de foto */}
        <div className={styles.campoFoto}>
          <div className={styles.fotoMiniPreview}>
            {vistaPreviaFoto ? (
              <img
                src={vistaPreviaFoto}
                alt="Foto del talento"
                className={styles.fotoImg}
              />
            ) : (
              <div className={styles.fotoFallback}>
                {candidatoExistente?.nombre_completo?.charAt(0)?.toUpperCase() ?? "👤"}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="foto" className={styles.etiqueta}>
              Foto de perfil (JPG, PNG o WebP, máx 2 MB)
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

        <div className={styles.grilla}>
          <div className={styles.campo}>
            <label htmlFor="nombreCompleto" className={styles.etiqueta}>
              Nombre y apellido *
            </label>
            <input
              id="nombreCompleto"
              name="nombreCompleto"
              type="text"
              defaultValue={candidatoExistente?.nombre_completo ?? ""}
              placeholder="Ej: Rodrigo De Paul"
              required
              className={styles.entrada}
            />
          </div>

          <div className={styles.campo}>
            <label htmlFor="puesto" className={styles.etiqueta}>
              Puesto profesional *
            </label>
            <select
              id="puesto"
              name="puesto"
              value={puesto}
              onChange={(e) => setPuesto(e.target.value)}
              className={styles.select}
            >
              {Object.entries(ETIQUETAS_PUESTO_PROFESIONAL).map(([clave, texto]) => (
                <option key={clave} value={clave}>
                  {texto}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.campo}>
            <label htmlFor="provincia" className={styles.etiqueta}>
              Provincia de radicación *
            </label>
            <select
              id="provincia"
              name="provincia"
              defaultValue={candidatoExistente?.provincia ?? ""}
              required
              className={styles.select}
            >
              <option value="">Seleccionar provincia...</option>
              {PROVINCIAS_ARGENTINA.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.campo}>
            <label htmlFor="clubActual" className={styles.etiqueta}>
              Club o equipo actual (opcional)
            </label>
            <input
              id="clubActual"
              name="clubActual"
              type="text"
              defaultValue={candidatoExistente?.club_actual ?? ""}
              placeholder="Ej: Libre / Racing Club"
              className={styles.entrada}
            />
          </div>
        </div>
      </div>

      {/* 2. Datos Específicos según puesto */}
      {!esCuerpoTecnico ? (
        <div className={styles.seccion}>
          <h3 className={styles.tituloSeccion}>2. Ficha Deportiva (Futbolista)</h3>
          <div className={styles.grilla}>
            <div className={styles.campo}>
              <label htmlFor="posicionJuego" className={styles.etiqueta}>
                Posición habitual en cancha
              </label>
              <select
                id="posicionJuego"
                name="posicionJuego"
                defaultValue={candidatoExistente?.posicion_juego ?? ""}
                className={styles.select}
              >
                <option value="">Seleccionar posición...</option>
                {POSICIONES_DE_JUEGO.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.campo}>
              <label htmlFor="piernaHabil" className={styles.etiqueta}>
                Pierna hábil
              </label>
              <select
                id="piernaHabil"
                name="piernaHabil"
                defaultValue={candidatoExistente?.pierna_habil ?? ""}
                className={styles.select}
              >
                <option value="">Seleccionar...</option>
                {PIERNAS_HABILES.map((pierna) => (
                  <option key={pierna} value={pierna}>
                    {pierna}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.campo}>
              <label htmlFor="alturaCm" className={styles.etiqueta}>
                Altura (cm)
              </label>
              <input
                id="alturaCm"
                name="alturaCm"
                type="number"
                min="140"
                max="220"
                defaultValue={candidatoExistente?.altura_cm ?? ""}
                placeholder="Ej: 182"
                className={styles.entrada}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="pesoKg" className={styles.etiqueta}>
                Peso (kg)
              </label>
              <input
                id="pesoKg"
                name="pesoKg"
                type="number"
                min="45"
                max="130"
                defaultValue={candidatoExistente?.peso_kg ?? ""}
                placeholder="Ej: 78"
                className={styles.entrada}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.seccion}>
          <h3 className={styles.tituloSeccion}>2. Ficha Técnica / Cuerpo Técnico</h3>
          <div className={styles.grilla}>
            <div className={styles.campo}>
              <label htmlFor="tituloOMatricula" className={styles.etiqueta}>
                Título o Matrícula Profesional
              </label>
              <input
                id="tituloOMatricula"
                name="tituloOMatricula"
                type="text"
                defaultValue={candidatoExistente?.titulo_o_matricula ?? ""}
                placeholder="Ej: Lic. en Kinesiología / DT ATFA"
                className={styles.entrada}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="licencia" className={styles.etiqueta}>
                Licencia de entrenador / acreditación
              </label>
              <input
                id="licencia"
                name="licencia"
                type="text"
                defaultValue={candidatoExistente?.licencia ?? ""}
                placeholder="Ej: Licencia PRO CONMEBOL"
                className={styles.entrada}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="aniosExperiencia" className={styles.etiqueta}>
                Años de experiencia
              </label>
              <input
                id="aniosExperiencia"
                name="aniosExperiencia"
                type="number"
                min="0"
                max="60"
                defaultValue={candidatoExistente?.anios_experiencia ?? ""}
                placeholder="Ej: 5"
                className={styles.entrada}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="especialidad" className={styles.etiqueta}>
                Especialidad o enfoque
              </label>
              <input
                id="especialidad"
                name="especialidad"
                type="text"
                defaultValue={candidatoExistente?.especialidad ?? ""}
                placeholder="Ej: Preparación de alto rendimiento, Fútbol juvenil"
                className={styles.entrada}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Trayectoria y Videos */}
      <div className={styles.seccion}>
        <h3 className={styles.tituloSeccion}>3. Trayectoria y Material Audiovisual</h3>
        <div className={styles.grilla}>
          <div className={`${styles.campo} ${styles.campoCompleto}`}>
            <label htmlFor="trayectoria" className={styles.etiqueta}>
              Resumen de Trayectoria y Clubes anteriores
            </label>
            <textarea
              id="trayectoria"
              name="trayectoria"
              defaultValue={candidatoExistente?.trayectoria ?? ""}
              placeholder="Describí los clubes donde jugó o trabajó, divisiones, logros..."
              className={styles.textarea}
            />
          </div>

          <div className={`${styles.campo} ${styles.campoCompleto}`}>
            <label className={styles.etiqueta}>Videos de jugadas o partidos (YouTube)</label>
            <div className="flex flex-col gap-2">
              <input
                name="video1"
                type="url"
                defaultValue={videos[0] ?? ""}
                placeholder="https://www.youtube.com/watch?v=..."
                className={styles.entrada}
              />
              <input
                name="video2"
                type="url"
                defaultValue={videos[1] ?? ""}
                placeholder="https://www.youtube.com/watch?v=... (opcional)"
                className={styles.entrada}
              />
              <input
                name="video3"
                type="url"
                defaultValue={videos[2] ?? ""}
                placeholder="https://www.youtube.com/watch?v=... (opcional)"
                className={styles.entrada}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Currículum Vitae (PDF) */}
      <div className={styles.seccion}>
        <h3 className={styles.tituloSeccion}>4. Currículum Vitae (PDF)</h3>
        <div className={styles.grilla}>
          <div className={`${styles.campo} ${styles.campoCompleto}`}>
            <label htmlFor="curriculum" className={styles.etiqueta}>
              Subir CV en formato PDF (hasta 5 MB)
            </label>
            <input
              id="curriculum"
              name="curriculum"
              type="file"
              accept=".pdf,application/pdf"
              className={styles.entradaArchivo}
              onChange={(evento) => {
                const archivo = evento.target.files?.[0];
                evento.target.setCustomValidity(
                  archivo && archivo.size > 5_000_000
                    ? "El CV no puede pesar más de 5 MB."
                    : ""
                );
                evento.target.reportValidity();
              }}
            />
            <p className={styles.ayuda}>
              Los clubes podrán descargar este currículum cuando evalúen las postulaciones del representado.
            </p>

            {candidatoExistente?.cv_ruta && (
              <div className="mt-2 flex flex-col gap-1">
                <a
                  href={`/api/candidatos/${candidatoExistente.usuario_id}/cv`}
                  className={styles.enlaceCv}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📄 Descargar CV actual del representado
                </a>
                <label className={styles.casilla}>
                  <input type="checkbox" name="quitarCv" />
                  <span>Quitar CV actual</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.acciones}>
        <Link href="/mi-cartera" className={styles.botonCancelar}>
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={estaGuardando}
          className={styles.botonGuardar}
        >
          {estaGuardando
            ? "Guardando cambios..."
            : candidatoExistente
            ? "Guardar Cambios"
            : "Guardar Representado"}
        </button>
      </div>
    </form>
  );
}
