"use client";

import { useActionState } from "react";
import Link from "next/link";
import { iniciarSesion, type ResultadoAccion } from "@/dominio/autenticacion/acciones";

const ESTADO_INICIAL: ResultadoAccion = { error: null };

export default function PaginaInicioSesion() {
  const [estado, ejecutarInicioSesion, estaEnviando] = useActionState(iniciarSesion, ESTADO_INICIAL);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión en CFA</h1>
      <p className="mt-1 text-sm text-slate-600">Contrataciones de Fútbol Argentino</p>

      <form action={ejecutarInicioSesion} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="correoElectronico" className="text-sm font-medium text-slate-700">
            Correo electrónico
          </label>
          <input
            id="correoElectronico"
            name="correoElectronico"
            type="email"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="contrasena" className="text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <input
            id="contrasena"
            name="contrasena"
            type="password"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {estado.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>
        )}

        <button
          type="submit"
          disabled={estaEnviando}
          className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {estaEnviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        ¿No tenés cuenta?{" "}
        <Link href="/registrarse" className="font-medium text-slate-900 underline">
          Registrarse
        </Link>
      </p>
    </main>
  );
}
