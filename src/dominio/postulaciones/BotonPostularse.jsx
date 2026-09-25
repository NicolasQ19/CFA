"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { postularseAOferta } from "./acciones";

export function BotonPostularse({ ofertaId, yaPostulado }) {
  const [isPending, startTransition] = useTransition();
  const [postulado, setPostulado] = useState(yaPostulado);
  const [errorMsg, setErrorMsg] = useState(null);
  const [faltaPerfil, setFaltaPerfil] = useState(false);

  if (postulado) {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        ✓ Ya te postulaste
      </span>
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
    <div className="flex flex-col gap-1">
      <button
        onClick={handlePostulacion}
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {isPending ? "Enviando postulación..." : "Postularme a esta oferta"}
      </button>
      {errorMsg && (
        <p className="text-xs text-red-600">
          {errorMsg}{" "}
          {faltaPerfil && (
            <Link href="/mi-perfil" className="font-semibold underline">
              Completar perfil
            </Link>
          )}
        </p>
      )}
    </div>
  );
}