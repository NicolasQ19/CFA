"use client";
import { useActionState, useEffect, useId, useState } from "react";
import { guardarSeguimientoClub } from "./acciones-club";
import { ETAPAS_CLUB } from "@/lib/club";
import { SelectorEstadoPostulacion } from "./SelectorEstadoPostulacion";
import styles from "./SeguimientoClub.module.css";

export function SeguimientoClub({ postulacionId, etapa, notas, estadoInicial, disponible }) {
  const [resultado, guardar, pendiente] = useActionState(guardarSeguimientoClub, {});
  const id = useId();
  const [etapaActual, setEtapaActual] = useState(etapa);
  const [notasActuales, setNotasActuales] = useState(notas ?? "");
  const [estadoActual, setEstadoActual] = useState(estadoInicial);
  useEffect(() => { setEtapaActual(etapa); setNotasActuales(notas ?? ""); setEstadoActual(estadoInicial); }, [etapa, notas, estadoInicial, postulacionId]);
  const hayCambios = etapaActual !== etapa || notasActuales !== (notas ?? "") || estadoActual !== estadoInicial;
  if (!disponible) return <p role="status">El seguimiento privado no está disponible en este momento.</p>;
  return <form action={guardar} className={styles.formulario}>
    <input type="hidden" name="postulacionId" value={postulacionId} />
    <section className={styles.seccion}>
    <h3>Seguimiento privado</h3>
    <label htmlFor={`${id}-etapa`}>Etapa interna</label>
    <select id={`${id}-etapa`} name="etapa" disabled={pendiente} value={etapaActual} onChange={evento => setEtapaActual(evento.target.value)}>
      {Object.entries(ETAPAS_CLUB).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
    </select>
    <label htmlFor={`${id}-notas`}>Notas privadas del club</label>
    <textarea id={`${id}-notas`} name="notas" disabled={pendiente} value={notasActuales} onChange={evento => setNotasActuales(evento.target.value)} maxLength={3000} rows={3} placeholder="Entrevistas, observaciones y próximos pasos…" />
    <p className={styles.ayuda}>Solo tu club puede leer estas notas. La etapa interna no cambia el estado informado al candidato.</p>
    </section>
    <section className={styles.seccion}>
      <h3>Estado informado al candidato</h3>
      <SelectorEstadoPostulacion estado={estadoActual} onChange={setEstadoActual} disabled={pendiente} />
    </section>
    <div className={styles.acciones}>
    <button disabled={pendiente}>{pendiente ? "Guardando…" : "Guardar seguimiento"}</button>
    <p role={resultado.error ? "alert" : "status"}>{resultado.error ?? (hayCambios ? "Hay cambios sin guardar." : resultado.exito ? "Seguimiento y estado guardados." : "")}</p>
    </div>
  </form>;
}
