"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./SelectorDesplegable.module.css";

/**
 * Desplegable propio para reemplazar a `<select>` donde la lista nativa no se puede
 * estilar (filtros, puestos, provincias). Mantiene el valor en un input oculto, así
 * los formularios por GET o con server actions siguen funcionando igual.
 *
 * Accesibilidad: patrón listbox con teclado (flechas, Inicio/Fin, Enter, Escape y
 * búsqueda por letra) y el foco devuelto al botón al cerrar.
 */
export function SelectorDesplegable({
  nombre,
  opciones,
  valorInicial = "",
  valor: valorControlado,
  onCambio,
  deshabilitado = false,
  etiquetaId,
  placeholder = "Elegí una opción",
  className = "",
}) {
  const id = useId();
  const [valorInterno, setValorInterno] = useState(valorInicial);
  // Modo controlado si el padre pasa `valor`; si no, el componente guarda el suyo.
  const esControlado = valorControlado !== undefined;
  const valor = esControlado ? valorControlado : valorInterno;

  function setValor(nuevo) {
    if (!esControlado) setValorInterno(nuevo);
    onCambio?.(nuevo);
  }
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);
  const contenedorRef = useRef(null);
  const listaRef = useRef(null);
  const botonRef = useRef(null);
  const busquedaRef = useRef({ texto: "", momento: 0 });

  const indiceActual = Math.max(0, opciones.findIndex((opcion) => opcion.valor === valor));
  const seleccionada = opciones[indiceActual];

  useEffect(() => {
    if (deshabilitado) setAbierto(false);
  }, [deshabilitado]);

  useEffect(() => {
    if (!abierto) return undefined;

    function alClicFuera(evento) {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    listaRef.current?.querySelector('[data-resaltada="true"]')?.scrollIntoView({ block: "nearest" });
  }, [abierto, resaltado]);

  function abrir(indice = indiceActual) {
    if (deshabilitado) return;
    setResaltado(indice);
    setAbierto(true);
  }

  function cerrar({ devolverFoco = true } = {}) {
    setAbierto(false);
    if (devolverFoco) botonRef.current?.focus();
  }

  function elegir(indice) {
    const opcion = opciones[indice];
    if (!opcion) return;
    setValor(opcion.valor);
    cerrar();
  }

  /** Busca la próxima opción cuyo texto empiece con lo que se viene tecleando. */
  function buscarPorTexto(tecla) {
    const ahora = Date.now();
    const texto = (ahora - busquedaRef.current.momento < 700 ? busquedaRef.current.texto : "") + tecla.toLowerCase();
    busquedaRef.current = { texto, momento: ahora };

    const desde = abierto ? resaltado : indiceActual;
    const orden = [...opciones.slice(desde + 1), ...opciones.slice(0, desde + 1)];
    const encontrada = orden.find((opcion) => opcion.texto.toLowerCase().startsWith(texto));
    if (!encontrada) return;

    const indice = opciones.indexOf(encontrada);
    if (abierto) setResaltado(indice);
    else setValor(encontrada.valor);
  }

  function alPresionarTecla(evento) {
    const { key } = evento;

    if (key === "Escape" && abierto) {
      evento.preventDefault();
      cerrar();
      return;
    }

    if (!abierto && (key === "Enter" || key === " " || key === "ArrowDown" || key === "ArrowUp")) {
      evento.preventDefault();
      abrir();
      return;
    }

    if (abierto) {
      if (key === "Enter" || key === " ") {
        evento.preventDefault();
        elegir(resaltado);
        return;
      }
      if (key === "ArrowDown") {
        evento.preventDefault();
        setResaltado((actual) => Math.min(opciones.length - 1, actual + 1));
        return;
      }
      if (key === "ArrowUp") {
        evento.preventDefault();
        setResaltado((actual) => Math.max(0, actual - 1));
        return;
      }
      if (key === "Home") {
        evento.preventDefault();
        setResaltado(0);
        return;
      }
      if (key === "End") {
        evento.preventDefault();
        setResaltado(opciones.length - 1);
        return;
      }
      if (key === "Tab") {
        cerrar({ devolverFoco: false });
        return;
      }
    }

    if (key.length === 1 && !evento.altKey && !evento.ctrlKey && !evento.metaKey) {
      buscarPorTexto(key);
    }
  }

  return (
    <div ref={contenedorRef} className={`${styles.contenedor} ${className}`.trim()}>
      {nombre && <input type="hidden" name={nombre} value={valor} />}
      <button
        ref={botonRef}
        type="button"
        disabled={deshabilitado}
        id={`${id}-boton`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-labelledby={etiquetaId ? `${etiquetaId} ${id}-boton` : undefined}
        onClick={() => (abierto ? cerrar({ devolverFoco: false }) : abrir())}
        onKeyDown={alPresionarTecla}
        className={styles.boton}
      >
        <span className={seleccionada?.valor ? styles.textoElegido : styles.textoVacio}>
          {seleccionada?.texto ?? placeholder}
        </span>
        <span aria-hidden="true" className={abierto ? styles.flechaAbierta : styles.flecha} />
      </button>

      {abierto && (
        <ul
          ref={listaRef}
          id={`${id}-lista`}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${id}-opcion-${resaltado}`}
          className={styles.lista}
        >
          {opciones.map((opcion, indice) => {
            const elegida = opcion.valor === valor;
            return (
              <li
                key={opcion.valor || "todas"}
                id={`${id}-opcion-${indice}`}
                role="option"
                aria-selected={elegida}
                data-resaltada={indice === resaltado}
                onMouseEnter={() => setResaltado(indice)}
                onClick={() => elegir(indice)}
                className={`${styles.opcion} ${indice === resaltado ? styles.opcionResaltada : ""} ${elegida ? styles.opcionElegida : ""}`.trim()}
              >
                <span>{opcion.texto}</span>
                {elegida && <span aria-hidden="true" className={styles.tilde}>✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
