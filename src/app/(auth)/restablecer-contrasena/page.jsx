"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { actualizarContrasenaRecuperada } from "@/dominio/autenticacion/acciones";
import { crearClienteNavegador } from "@/lib/supabase/cliente-navegador";
import { LONGITUD_MINIMA_CONTRASENA } from "@/lib/recuperar-contrasena";
import styles from "./page.module.css";

const ESTADO_INICIAL = { error: null };

function ContenidoRestablecerContrasena() {
  const parametros = useSearchParams();
  const enlaceMarcadoInvalido = parametros.get("enlace_invalido") === "1";
  const codigoUrl = parametros.get("code");
  const tokenHashUrl = parametros.get("token_hash");
  const tipoUrl = parametros.get("type");

  const [estadoSesion, setEstadoSesion] = useState(
    enlaceMarcadoInvalido ? "invalido" : "verificando"
  );
  const [estado, ejecutarActualizacion, estaEnviando] = useActionState(
    actualizarContrasenaRecuperada,
    ESTADO_INICIAL
  );

  useEffect(() => {
    if (enlaceMarcadoInvalido) {
      setEstadoSesion("invalido");
      return;
    }

    let cancelado = false;
    const supabase = crearClienteNavegador();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (cancelado) return;
      if (
        (evento === "PASSWORD_RECOVERY" || evento === "SIGNED_IN") &&
        sesion?.user
      ) {
        setEstadoSesion("listo");
      }
    });

    async function verificarSesionRecuperacion() {
      if (codigoUrl) {
        await supabase.auth.exchangeCodeForSession(codigoUrl);
      } else if (tokenHashUrl && tipoUrl) {
        await supabase.auth.verifyOtp({
          type: tipoUrl,
          token_hash: tokenHashUrl,
        });
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelado) return;
      setEstadoSesion(user ? "listo" : "invalido");
    }

    verificarSesionRecuperacion();

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, [enlaceMarcadoInvalido, codigoUrl, tokenHashUrl, tipoUrl]);

  if (estadoSesion === "verificando") {
    return (
      <div className={styles.tarjeta}>
        <p className={styles.estadoCarga}>Verificando enlace de seguridad...</p>
      </div>
    );
  }

  if (estadoSesion === "invalido") {
    return (
      <div className={styles.tarjeta}>
        <p role="alert" className={styles.error}>
          El enlace de recuperación venció, ya fue utilizado o no es válido.
        </p>
        <Link href="/recuperar-contrasena" className={styles.botonEnviar}>
          Solicitar un nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <form action={ejecutarActualizacion} className={styles.tarjeta}>
      <div className={styles.campo}>
        <label htmlFor="contrasena" className={styles.etiqueta}>
          Nueva contraseña
        </label>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          required
          minLength={LONGITUD_MINIMA_CONTRASENA}
          className={styles.entrada}
        />
        <span className={styles.ayuda}>
          Mínimo {LONGITUD_MINIMA_CONTRASENA} caracteres.
        </span>
      </div>

      <div className={styles.campo}>
        <label htmlFor="confirmarContrasena" className={styles.etiqueta}>
          Confirmar nueva contraseña
        </label>
        <input
          id="confirmarContrasena"
          name="confirmarContrasena"
          type="password"
          required
          minLength={LONGITUD_MINIMA_CONTRASENA}
          className={styles.entrada}
        />
      </div>

      {estado?.error && (
        <p role="alert" className={styles.error}>
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={estaEnviando}
        className={styles.botonEnviar}
      >
        {estaEnviando ? "Guardando..." : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}

/** CU-03 / RF-03: formulario para definir una nueva contraseña tras abrir el enlace del correo. */
export default function PaginaRestablecerContrasena() {
  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Nueva contraseña</h1>
      <p className={styles.subtitulo}>
        Ingresá y confirmá tu nueva clave de acceso para continuar en CFA.
      </p>

      <Suspense
        fallback={
          <div className={styles.tarjeta}>
            <p className={styles.estadoCarga}>Cargando formulario...</p>
          </div>
        }
      >
        <ContenidoRestablecerContrasena />
      </Suspense>

      <p className={styles.piePagina}>
        <Link href="/iniciar-sesion" className={styles.enlace}>
          Volver a iniciar sesión
        </Link>
      </p>
    </main>
  );
}
