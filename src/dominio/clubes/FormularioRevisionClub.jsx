"use client";

import { useActionState, useState } from "react";
import { SelectorDesplegable } from "@/componentes/SelectorDesplegable";
import { resolverVerificacion } from "./acciones";
import styles from "./verificacion.module.css";

export function FormularioRevisionClub({ solicitud }) {
  const [resultado, guardar, pendiente] = useActionState(resolverVerificacion, {});
  const [estado, setEstado] = useState("verificado");
  if (!solicitud.solicitada_en) return <p>El club todavía no envió una solicitud completa.</p>;
  return <form action={guardar} className={styles.formulario}>
    <input type="hidden" name="clubId" value={solicitud.club_id} />
    <input type="hidden" name="solicitadaEn" value={solicitud.solicitada_en} />
    <fieldset disabled={pendiente} className={styles.campos}>
      <span><span id="decisionRevision">Decisión</span>
        <SelectorDesplegable
          nombre="estado"
          etiquetaId="decisionRevision"
          valor={estado}
          onCambio={setEstado}
          opciones={[
            { valor: "verificado", texto: "Verificar club" },
            { valor: "rechazado", texto: "Rechazar verificación" },
          ]}
        />
      </span>
      <label>Canal oficial contactado<input name="canal" maxLength={500} required={estado === "verificado"} placeholder="Correo, teléfono o cuenta oficial consultada por tu cuenta" /></label>
      {estado === "verificado" && <label className={styles.confirmacion}><input type="checkbox" name="confirmado" required />Confirmé por un canal oficial independiente que esta persona está autorizada a representar al club.</label>}
      <label>Resultado de la revisión (visible para el club)<textarea name="observaciones" required maxLength={2000} rows={3} placeholder={estado === "verificado" ? "Autorización confirmada por…" : "Motivo del rechazo y datos a corregir…"} /></label>
      <button>{pendiente ? "Guardando…" : "Guardar decisión"}</button>
    </fieldset>
    <p role={resultado.error ? "alert" : "status"}>{resultado.error ?? (resultado.exito ? "Decisión guardada. El club recibirá el aviso en su campana." : "")}</p>
  </form>;
}
