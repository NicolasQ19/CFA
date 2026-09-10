"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPerfilCandidato } from "@/dominio/perfiles/acciones";
import type { ResultadoAccion } from "@/dominio/autenticacion/acciones";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  esPuestoDeCuerpoTecnico,
  type PuestoProfesional,
} from "@/tipos/dominio";
import type { PerfilCandidato } from "@/tipos/base-de-datos";
import styles from "./FormularioPerfilCandidato.module.css";

const ESTADO_INICIAL: ResultadoAccion = { error: null };

interface Props {
  perfilExistente: PerfilCandidato | null;
}

export function FormularioPerfilCandidato({ perfilExistente }: Props) {
  const router = useRouter();
  const [estado, ejecutarGuardado, estaGuardando] = useActionState(
    guardarPerfilCandidato,
    ESTADO_INICIAL
  );
  const [puestoSeleccionado, setPuestoSeleccionado] = useState<PuestoProfesional>(
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
      <CampoSelect
        id="puesto"
        etiqueta="Puesto profesional"
        valor={puestoSeleccionado}
        onCambio={(valor) => setPuestoSeleccionado(valor as PuestoProfesional)}
        opciones={Object.entries(ETIQUETAS_PUESTO_PROFESIONAL)}
      />

      <CampoTexto id="provincia" etiqueta="Provincia" valorInicial={perfilExistente?.provincia ?? ""} requerido />
      <CampoTexto id="clubActual" etiqueta="Club actual" valorInicial={perfilExistente?.club_actual ?? ""} />

      {esCuerpoTecnico ? (
        <fieldset className={styles.fieldset}>
          <legend className={styles.leyenda}>
            Datos técnicos ({ETIQUETAS_PUESTO_PROFESIONAL[puestoSeleccionado]})
          </legend>
          <CampoTexto id="tituloOMatricula" etiqueta="Título / matrícula" valorInicial={perfilExistente?.titulo_o_matricula ?? ""} />
          <CampoTexto id="licencia" etiqueta="Licencia (si aplica)" valorInicial={perfilExistente?.licencia ?? ""} />
          <CampoTexto id="aniosExperiencia" etiqueta="Años de experiencia" tipo="number" valorInicial={perfilExistente?.anios_experiencia?.toString() ?? ""} />
          <CampoTexto id="especialidad" etiqueta="Especialidad" valorInicial={perfilExistente?.especialidad ?? ""} />
        </fieldset>
      ) : (
        <fieldset className={styles.fieldset}>
          <legend className={styles.leyenda}>Datos deportivos</legend>
          <CampoTexto id="posicionJuego" etiqueta="Posición" valorInicial={perfilExistente?.posicion_juego ?? ""} />
          <CampoTexto id="piernaHabil" etiqueta="Pierna hábil" valorInicial={perfilExistente?.pierna_habil ?? ""} />
          <CampoTexto id="alturaCm" etiqueta="Altura (cm)" tipo="number" valorInicial={perfilExistente?.altura_cm?.toString() ?? ""} />
          <CampoTexto id="pesoKg" etiqueta="Peso (kg)" tipo="number" valorInicial={perfilExistente?.peso_kg?.toString() ?? ""} />
        </fieldset>
      )}

      <CampoTextoLargo id="trayectoria" etiqueta="Trayectoria" valorInicial={perfilExistente?.trayectoria ?? ""} />
      <CampoTextoLargo id="formacionAcademica" etiqueta="Formación académica" valorInicial={perfilExistente?.formacion_academica ?? ""} />

      <fieldset className={styles.fieldset}>
        <legend className={styles.leyenda}>
          Videos (hasta 3 enlaces de YouTube)
        </legend>
        <CampoTexto id="enlaceVideo1" etiqueta="Enlace 1" valorInicial={perfilExistente?.enlaces_video?.[0] ?? ""} />
        <CampoTexto id="enlaceVideo2" etiqueta="Enlace 2" valorInicial={perfilExistente?.enlaces_video?.[1] ?? ""} />
        <CampoTexto id="enlaceVideo3" etiqueta="Enlace 3" valorInicial={perfilExistente?.enlaces_video?.[2] ?? ""} />
      </fieldset>

      {estado.error && (
        <p className={styles.error}>{estado.error}</p>
      )}

      {mostrarExito && (
        <p className={styles.exito}>Guardado con éxito</p>
      )}

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
}: {
  id: string;
  etiqueta: string;
  valorInicial: string;
  tipo?: string;
  requerido?: boolean;
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

function CampoTextoLargo({
  id,
  etiqueta,
  valorInicial,
}: {
  id: string;
  etiqueta: string;
  valorInicial: string;
}) {
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

function CampoSelect({
  id,
  etiqueta,
  valor,
  onCambio,
  opciones,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  opciones: [string, string][];
}) {
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
