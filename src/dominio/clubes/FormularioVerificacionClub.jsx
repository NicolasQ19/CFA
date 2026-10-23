"use client";

import { useActionState } from "react";
import { solicitarVerificacion } from "./acciones";
import styles from "./verificacion.module.css";

const CAMPOS = [
  ["liga", "liga_asociacion", "Liga o asociación a la que pertenece", "text", 200],
  ["nombre", "nombre_solicitante", "Nombre y apellido del solicitante", "text", 160],
  ["cargo", "cargo", "Cargo o relación con el club", "text", 120],
  ["correo", "correo_institucional", "Correo institucional de contacto", "email", 254],
  ["telefono", "telefono_institucional", "Teléfono institucional", "tel", 60],
  ["url", "url_oficial", "Sitio web o red social oficial del club", "url", 500],
];

export function FormularioVerificacionClub({ verificacion, perfilCompleto }) {
  const [resultado, guardar, pendiente] = useActionState(solicitarVerificacion, {});
  if (verificacion?.estado === "verificado") return null;
  return <form action={guardar} className={styles.formulario}>
    <p>El administrador buscará un contacto en los canales oficiales y confirmará que estás autorizado a representar al club.</p>
    {!perfilCompleto && <p role="status">Primero guardá el nombre, provincia y localidad en Datos del club.</p>}
    <fieldset disabled={pendiente || !perfilCompleto} className={styles.campos}>
      {CAMPOS.map(([nombre, campo, etiqueta, tipo, limite]) => <label key={nombre}>
        {etiqueta}
        <input name={nombre} type={tipo} maxLength={limite} required defaultValue={verificacion?.[campo] ?? ""} placeholder={tipo === "url" ? "https://…" : undefined} />
      </label>)}
      <button>{pendiente ? "Enviando…" : verificacion?.solicitada_en ? "Actualizar y enviar solicitud" : "Solicitar verificación"}</button>
    </fieldset>
    <p role={resultado.error ? "alert" : "status"}>{resultado.error ?? (resultado.exito ? "Solicitud enviada. Quedó pendiente de revisión." : "")}</p>
  </form>;
}
