"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { postularseAOferta } from "./acciones";
import styles from "./BotonPostularse.module.css";

export function BotonPostularse({ ofertaId }) {
  const [isPending, startTransition] = useTransition();
  const [postulado, setPostulado] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [faltaPerfil, setFaltaPerfil] = useState(false);

  if (postulado) {
    return (
      <div className={styles.contenedor}>
        <p className={styles.mensajeExito}>✓ Ya te postulaste</p>
        <Link href="/mis-postulaciones" className={styles.enlace}>
          Ver todas mis postulaciones →
        </Link>
      </div>
    );
  }

  function handlePostulacion() {
    setErrorMsg(null);
    setFaltaPerfil(false);
    startTransition(async () => {
      const res = await postularseAOferta(ofertaId);
      if (res?.exito) {
        setPostulado(true);
      } else {
        setErrorMsg(res?.error ?? "No se pudo enviar la postulación.");
        setFaltaPerfil(Boolean(res?.faltaPerfil));
      }
    });
  }

  return (
    <div className={styles.contenedor}>
      <button onClick={handlePostulacion} disabled={isPending} className={styles.boton}>
        {isPending ? "Enviando postulación..." : "Postularme a esta oferta"}
      </button>
      {errorMsg && (
        <p className={styles.error}>
          {errorMsg}{" "}
          {faltaPerfil && (
            <Link href="/mi-perfil" className={styles.enlace}>
              Completar perfil
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
