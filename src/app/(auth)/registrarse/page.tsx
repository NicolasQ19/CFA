"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrarUsuario, type ResultadoAccion } from "@/dominio/autenticacion/acciones";
import { ETIQUETAS_ROL_USUARIO, type RolUsuario } from "@/tipos/dominio";
import styles from "./page.module.css";

const ESTADO_INICIAL: ResultadoAccion = { error: null };

const ROLES_DISPONIBLES_PARA_REGISTRO: RolUsuario[] = ["candidato", "representante", "club"];

export default function PaginaRegistro() {
  const [estado, ejecutarRegistro, estaEnviando] = useActionState(registrarUsuario, ESTADO_INICIAL);

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Crear cuenta en CFA</h1>
      <p className={styles.subtitulo}>
        Contrataciones de Fútbol Argentino
      </p>

      <form action={ejecutarRegistro} className={styles.formulario}>
        <div className={styles.campo}>
          <label htmlFor="rol" className={styles.etiqueta}>
            Quiero registrarme como
          </label>
          <select
            id="rol"
            name="rol"
            required
            defaultValue=""
            className={styles.entrada}
          >
            <option value="" disabled>
              Elegí un rol
            </option>
            {ROLES_DISPONIBLES_PARA_REGISTRO.map((rol) => (
              <option key={rol} value={rol}>
                {ETIQUETAS_ROL_USUARIO[rol]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.campo}>
          <label htmlFor="nombreCompleto" className={styles.etiqueta}>
            Nombre completo
          </label>
          <input
            id="nombreCompleto"
            name="nombreCompleto"
            type="text"
            required
            className={styles.entrada}
          />
        </div>

        <div className={styles.campo}>
          <label htmlFor="correoElectronico" className={styles.etiqueta}>
            Correo electrónico
          </label>
          <input
            id="correoElectronico"
            name="correoElectronico"
            type="email"
            required
            className={styles.entrada}
          />
        </div>

        <div className={styles.campo}>
          <label htmlFor="contrasena" className={styles.etiqueta}>
            Contraseña
          </label>
          <input
            id="contrasena"
            name="contrasena"
            type="password"
            required
            minLength={6}
            className={styles.entrada}
          />
        </div>

        {estado.error && (
          <p className={styles.error}>{estado.error}</p>
        )}

        <button
          type="submit"
          disabled={estaEnviando}
          className={styles.botonEnviar}
        >
          {estaEnviando ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className={styles.piePagina}>
        ¿Ya tenés cuenta?{" "}
        <Link href="/iniciar-sesion" className={styles.enlace}>
          Iniciar sesión
        </Link>
      </p>
    </main>
  );
}
