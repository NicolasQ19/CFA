"use client";

import Link from "next/link";

export default function ErrorPerfilRepresentante({ reset }) {
  return <main className="mx-auto max-w-2xl px-4 py-12">
    <h1 className="text-2xl font-semibold">No pudimos cargar el perfil</h1>
    <p className="mt-3 text-sm text-slate-300">Volvé a intentar en unos minutos.</p>
    <div className="mt-6 flex flex-wrap gap-4"><button onClick={reset} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold">Reintentar</button><Link href="/" className="px-4 py-3 text-sm text-emerald-300">Ir al inicio</Link></div>
  </main>;
}
