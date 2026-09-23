"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPerfilCandidato } from "@/dominio/perfiles/acciones";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  PIERNAS_HABILES,
  POSICIONES_DE_JUEGO,
  PROVINCIAS_ARGENTINA,
  esPuestoDeCuerpoTecnico,
  opcionesConValorActual,
} from "@/tipos/dominio";
import styles from "./FormularioPerfilCandidato.module.css";

const ESTADO_INICIAL = { error: null };

export function FormularioPerfilCandidato({ perfilExistente }) {
  const router = useRouter();
  const [estado, ejecutarGuardado, estaGuardando] = useActionState(
    guardarPerfilCandidato,
    ESTADO_INICIAL
  );
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(
    perfilExistente?.puesto ?? "jugador"
  );
  const [mostrarExito, setMostrarExito] = useState(false);
  const estabaGuardandoRef = useRef(false);

  useEffect(() => {
    if (estabaGuardandoRef.current && !estaGuardando && !estado.error) {
      setMostrarExito(true);
      const temporizador = setTimeout(() => {
        router.push("/perfil-publico");
      }, 1200);
      return () => clearTimeout(temporizador);
    }
    estabaGuardandoRef.current = estaGuardando;
  }, [estaGuardando, estado.error, router]);

  const esCuerpoTecnico = esPuestoDeCuerpoTecnico(puestoSeleccionado);

  return (
    <form action={ejecutarGuardado} className={styles.formulario}>
      <CampoFoto fotoActual={perfilExistente?.foto_url} />

      <CampoSelect
        id="puesto"
        etiqueta="Puesto profesional"
        valor={puestoSeleccionado}
        onCambio={(valor) => setPuestoSeleccionado(valor)}
        opciones={Object.entries(ETIQUETAS_PUESTO_PROFESIONAL)}
      />

      <CampoLista
        id="provincia"
        etiqueta="Provincia"
        opciones={PROVINCIAS_ARGENTINA}
        valorInicial={perfilExistente?.provincia ?? ""}
        requerido
      />
      <CampoTexto
        id="clubActual"
        etiqueta="Club actual"
        valorInicial={perfilExistente?.club_actual ?? ""}
      />

      {esCuerpoTecnico ? (
        <fieldset className={styles.fieldset}>
          <legend className={styles.leyenda}>
            Datos técnicos ({ETIQUETAS_PUESTO_PROFESIONAL[puestoSeleccionado]})
          </legend>
          <CampoTexto
            id="tituloOMatricula"
            etiqueta="Título / matrícula"
            valorInicial={perfilExistente?.titulo_o_matricula ?? ""}
          />
          <CampoTexto
            id="licencia"
            etiqueta="Licencia (si aplica)"
            valorInicial={perfilExistente?.licencia ?? ""}
          />
          <CampoTexto
            id="aniosExperiencia"
            etiqueta="Años de experiencia"
            tipo="number"
            valorInicial={perfilExistente?.anios_experiencia?.toString() ?? ""}
          />
          <CampoTexto
            id="especialidad"
            etiqueta="Especialidad"
            valorInicial={perfilExistente?.especialidad ?? ""}
          />
        </fieldset>
      ) : (
        <fieldset className={styles.fieldset}>
          <legend className={styles.leyenda}>Datos deportivos</legend>
          <CampoLista
            id="posicionJuego"
            etiqueta="Posición"
            opciones={POSICIONES_DE_JUEGO}
            valorInicial={perfilExistente?.posicion_juego ?? ""}
          />
          <CampoLista
            id="piernaHabil"
            etiqueta="Pierna hábil"
            opciones={PIERNAS_HABILES}
            valorInicial={perfilExistente?.pierna_habil ?? ""}
          />
          <CampoTexto
            id="alturaCm"
            etiqueta="Altura (cm)"
            tipo="number"
            valorInicial={perfilExistente?.altura_cm?.toString() ?? ""}
          />
          <CampoTexto
            id="pesoKg"
            etiqueta="Peso (kg)"
            tipo="number"
            valorInicial={perfilExistente?.peso_kg?.toString() ?? ""}
          />
        </fieldset>
      )}

      <CampoTextoLargo
        id="trayectoria"
        etiqueta="Trayectoria"
        valorInicial={perfilExistente?.trayectoria ?? ""}
      />
      <CampoTextoLargo
        id="formacionAcademica"
        etiqueta="Formación académica"
        valorInicial={perfilExistente?.formacion_academica ?? ""}
      />

      <fieldset className={styles.fieldset}>
        <legend className={styles.leyenda}>
          Videos (hasta 3 enlaces de YouTube)
        </legend>
        <CampoTexto
          id="enlaceVideo1"
          etiqueta="Enlace 1"
          valorInicial={perfilExistente?.enlaces_video?.[0] ?? ""}
        />
        <CampoTexto
          id="enlaceVideo2"
          etiqueta="Enlace 2"
          valorInicial={perfilExistente?.enlaces_video?.[1] ?? ""}
        />
        <CampoTexto
          id="enlaceVideo3"
          etiqueta="Enlace 3"
          valorInicial={perfilExistente?.enlaces_video?.[2] ?? ""}
        />
      </fieldset>

      <label className={styles.casilla}>
        <input
          type="checkbox"
          name="perfilVisible"
          defaultChecked={perfilExistente?.perfil_visible ?? true}
        />
        <span>
          Aparecer en la búsqueda de candidatos de los clubes
          <span className={styles.ayuda}>
            Aunque lo desactives, los clubes a cuyas ofertas te postulaste pueden ver tu perfil.
          </span>
        </span>
      </label>

      {estado.error && <p className={styles.error}>{estado.error}</p>}

      {mostrarExito && <p className={styles.exito}>Guardado con éxito</p>}

      <button
        type="submit"
        disabled={estaGuardando}
        className={styles.botonEnviar}
      >
        {estaGuardando ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}

function CampoTexto({
  id,
  etiqueta,
  valorInicial,
  tipo = "text",
  requerido = false,
}) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
      </label>
      <input
        id={id}
        name={id}
        type={tipo}
        defaultValue={valorInicial}
        required={requerido}
        className={styles.entrada}
      />
    </div>
  );
}

function CampoTextoLargo({ id, etiqueta, valorInicial }) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
      </label>
      <textarea
        id={id}
        name={id}
        defaultValue={valorInicial}
        rows={3}
        className={styles.entrada}
      />
    </div>
  );
}

function CampoFoto({ fotoActual }) {
  const [vistaPrevia, setVistaPrevia] = useState(fotoActual ?? null);

  function alElegirArchivo(evento) {
    const archivo = evento.target.files?.[0];
    setVistaPrevia(archivo ? URL.createObjectURL(archivo) : fotoActual ?? null);
  }

  return (
    <div className={styles.campoFoto}>
      {vistaPrevia ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vistaPrevia} alt="Foto de perfil" className={styles.foto} />
      ) : (
        <div className={styles.fotoVacia}>Sin foto</div>
      )}
      <div className={styles.campo}>
        <label htmlFor="foto" className={styles.etiqueta}>
          Foto de perfil (JPG, PNG o WebP, hasta 2 MB)
        </label>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={alElegirArchivo}
          className={styles.entradaArchivo}
        />
        {fotoActual && (
          <label className={styles.casilla}>
            <input type="checkbox" name="quitarFoto" />
            <span>Quitar foto actual</span>
          </label>
        )}
      </div>
    </div>
  );
}

/** Select no controlado de una lista de textos; incluye el valor guardado aunque no esté en la lista. */
function CampoLista({ id, etiqueta, opciones, valorInicial, requerido = false }) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={valorInicial}
        required={requerido}
        className={styles.entrada}
      >
        <option value="">Elegí una opción</option>
        {opcionesConValorActual(opciones, valorInicial).map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </div>
  );
}

function CampoSelect({ id, etiqueta, valor, onCambio, opciones }) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
      </label>
      <select
        id={id}
        name={id}
        value={valor}
        onChange={(evento) => onCambio(evento.target.value)}
        className={styles.entrada}
      >
        {opciones.map(([clave, texto]) => (
          <option key={clave} value={clave}>
            {texto}
          </option>
        ))}
      </select>
    </div>
  );
}