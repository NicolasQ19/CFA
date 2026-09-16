"use client";

import { useState, useTransition } from "react";
import { postularseAOferta } from "@/dominio/postulaciones/acciones";
import styles from "./BotonPostularse.module.css";

interface Props {
  ofertaId: string;
  yaPostulado: boolean;
}

export function BotonPostularse({ ofertaId, yaPostulado: yaPostuladoInicial }: Props) {
  const [yaPostulado, setYaPostulado] = useState(yaPostuladoInicial);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [estaEnviando, iniciarTransicion] = useTransition();

  function manejarClick() {
    setMensajeError(null);
    iniciarTransicion(async () => {
      const resultado = await postularseAOferta(ofertaId);
      if (resultado.exito) {
        setYaPostulado(true);
      } else {
        setMensajeError(resultado.error);
      }
    });
  }

  if (yaPostulado) {
    return (
      <p className={styles.mensajeExito}>
        Ya te postulaste a esta oferta.
      </p>
    );
  }

  return (
    <div className={styles.contenedor}>
      <button
        onClick={manejarClick}
        disabled={estaEnviando}
        className={styles.boton}
      >
        {estaEnviando ? "Enviando..." : "Postularme"}
      </button>
      {mensajeError && <p className={styles.error}>{mensajeError}</p>}
    </div>
  );
}
