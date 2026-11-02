"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { interpretarLecturas } from "@/lib/lectura-notificaciones";

const VACIO = [];

/** Evento propio: `storage` solo avisa de cambios hechos en *otras* pestañas. */
const EVENTO_LOCAL = "cfa:avisos-almacenados";

/** Respaldo en memoria para cuando el navegador bloquea localStorage. */
const memoria = new Map();

function suscribir(escuchar) {
  window.addEventListener("storage", escuchar);
  window.addEventListener(EVENTO_LOCAL, escuchar);
  return () => {
    window.removeEventListener("storage", escuchar);
    window.removeEventListener(EVENTO_LOCAL, escuchar);
  };
}

/**
 * Lee de localStorage una lista de claves de avisos (leídos o eliminados) y la
 * mantiene sincronizada con el resto de las pestañas.
 *
 * localStorage es un almacén externo al árbol de React, así que se lee con
 * `useSyncExternalStore` en lugar de copiarlo a estado desde un efecto: no hay
 * render en cascada y la hidratación arranca del snapshot del servidor.
 *
 * Devuelve `[lista, guardar, falloGuardado]`. Si el navegador no deja escribir,
 * el valor se conserva en memoria durante la sesión y `falloGuardado` queda en
 * `true` para poder avisarlo en pantalla.
 */
// El prefijo `use` es parte del contrato de React (reglas de hooks), no se traduce.
export function useAvisosAlmacenados(clave) {
  const cache = useRef({ clave: null, bruto: null, lista: VACIO });
  const [falloGuardado, setFalloGuardado] = useState(false);

  const leer = useCallback(() => {
    let bruto;
    try {
      bruto = localStorage.getItem(clave);
    } catch {
      return memoria.get(clave) ?? VACIO;
    }
    if (bruto === null) return memoria.get(clave) ?? VACIO;
    // useSyncExternalStore compara snapshots por identidad: sin esta caché cada
    // lectura devolvería un array nuevo y el render entraría en bucle.
    if (cache.current.clave !== clave || cache.current.bruto !== bruto) {
      cache.current = { clave, bruto, lista: interpretarLecturas(bruto) };
    }
    return cache.current.lista;
  }, [clave]);

  const lista = useSyncExternalStore(suscribir, leer, () => VACIO);

  const guardar = useCallback((nuevas) => {
    try {
      localStorage.setItem(clave, JSON.stringify(nuevas));
      memoria.delete(clave);
      setFalloGuardado(false);
    } catch {
      memoria.set(clave, nuevas);
      setFalloGuardado(true);
    }
    window.dispatchEvent(new Event(EVENTO_LOCAL));
  }, [clave]);

  return [lista, guardar, falloGuardado];
}
