"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ImagenAmpliable.module.css";

export function ImagenAmpliable({ src, alt = "Imagen", className, ...atributos }) {
  const [abierta, setAbierta] = useState(false);
  const imagenRef = useRef(null);

  function abrir(evento) {
    evento.preventDefault();
    evento.stopPropagation();
    imagenRef.current?.focus();
    setAbierta(true);
  }

  return <>
    <img {...atributos} ref={imagenRef} src={src} alt={alt} className={`${className ?? ""} ${styles.miniatura}`}
      role="button" tabIndex={0} aria-label={`Ampliar ${alt || "imagen"}`} aria-haspopup="dialog"
      title="Ver imagen en grande" onClick={abrir} onKeyDown={evento => {
        if (evento.key === "Enter" || evento.key === " ") abrir(evento);
      }} />
    {abierta && createPortal(<VisorImagen src={src} alt={alt} cerrar={() => setAbierta(false)} />, document.body)}
  </>;
}

function VisorImagen({ src, alt, cerrar }) {
  const dialogoRef = useRef(null);
  useEffect(() => {
    const dialogo = dialogoRef.current;
    dialogo.showModal();
    return () => { if (dialogo.open) dialogo.close(); };
  }, []);

  return <dialog ref={dialogoRef} className={styles.dialogo} aria-label={alt || "Imagen ampliada"} onClose={cerrar}
    onClick={evento => {
      evento.stopPropagation();
      if (!(evento.target instanceof HTMLImageElement) && !evento.target.closest("button")) dialogoRef.current.close();
    }}>
    <div className={styles.contenido}>
      <div className={styles.barra}><p>{alt || "Imagen ampliada"}</p><button type="button" autoFocus onClick={() => dialogoRef.current.close()} className={styles.cerrar}>Cerrar <span aria-hidden="true">×</span></button></div>
      <img src={src} alt={alt} className={styles.imagenGrande} />
      <p className={styles.ayuda}>Podés cerrar con Escape o haciendo clic fuera de la imagen.</p>
    </div>
  </dialog>;
}
