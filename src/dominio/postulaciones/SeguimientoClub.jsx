"use client";
import { useActionState, useEffect, useId, useState } from "react";
import { guardarSeguimientoClub } from "./acciones-club";
import { ETAPAS_CLUB } from "@/lib/club";
import styles from "./SeguimientoClub.module.css";

export function SeguimientoClub({ postulacionId, etapa, notas, disponible }) {
  const [resultado, guardar, pendiente] = useActionState(guardarSeguimientoClub, {});
  const id = useId();
  const [etapaActual, setEtapaActual] = useState(etapa);
  const [notasActuales, setNotasActuales] = useState(notas ?? "");
  useEffect(() => { setEtapaActual(etapa); setNotasActuales(notas ?? ""); }, [etapa, notas, postulacionId]);
  if (!disponible) return <p role="status">El seguimiento privado no está disponible en este momento.</p>;
  return <form action={guardar} className={styles.formulario}>
    <input type="hidden" name="postulacionId" value={postulacionId} />
    <label htmlFor={`${id}-etapa`}>Etapa interna</label>
    <select id={`${id}-etapa`} name="etapa" value={etapaActual} onChange={evento => setEtapaActual(evento.target.value)}>
      {Object.entries(ETAPAS_CLUB).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
    </select>
    <label htmlFor={`${id}-notas`}>Notas privadas del club</label>
    <textarea id={`${id}-notas`} name="notas" value={notasActuales} onChange={evento => setNotasActuales(evento.target.value)} maxLength={3000} rows={3} placeholder="Entrevistas, observaciones y próximos pasos…" />
    <p className={styles.ayuda}>Solo tu club puede leer estas notas. La etapa interna no cambia el estado informado al candidato.</p>
    <button disabled={pendiente}>{pendiente ? "Guardando…" : "Guardar seguimiento"}</button>
    <p role="status">{resultado.error ?? (resultado.exito ? "Seguimiento guardado." : "")}</p>
  </form>;
}
