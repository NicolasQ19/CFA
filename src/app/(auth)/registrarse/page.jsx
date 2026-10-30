"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrarUsuario } from "@/dominio/autenticacion/acciones";
import { CampoContrasena } from "@/dominio/autenticacion/CampoContrasena";
import { ETIQUETAS_ROL_USUARIO } from "@/tipos/dominio";
import styles from "./page.module.css";

const ESTADO_INICIAL = { error: null };

/** Roles que una persona puede elegir al registrarse (el administrador se crea aparte). */
const ROLES_DISPONIBLES_PARA_REGISTRO = [
  {
    rol: "candidato",
    descripcion: "Jugadores, cuerpo técnico y staff que buscan su próxima oportunidad.",
  },
  {
    rol: "representante",
    descripcion: "Gestioná una cartera de representados y postulalos a las búsquedas.",
  },
  {
    rol: "club",
    descripcion: "Publicá búsquedas para tu institución y gestioná los postulantes.",
  },
];

const PASOS_ALTA = [
  "Elegí el rol con el que vas a usar la plataforma.",
  "Completá tu perfil con tu experiencia o los datos de tu institución.",
  "Postulate a búsquedas o publicá la tuya.",
];

export default function PaginaRegistro() {
  const [estado, ejecutarRegistro, estaEnviando] = useActionState(
    registrarUsuario,
    ESTADO_INICIAL
  );

  return (
    <main className={styles.main}>
      <div className={styles.columnaFormulario}>
        <div className={styles.panel}>
          <p className={styles.volanta}>REGISTRO GRATUITO</p>
          <h1 className={styles.titulo}>Crear cuenta en CFA</h1>
          <p className={styles.subtitulo}>
            Todas las cuentas empiezan en el plan Base, sin costo y sin vencimiento.
          </p>

          <form action={ejecutarRegistro} className={styles.formulario}>
            <fieldset className={styles.grupoRoles}>
              <legend className={styles.etiqueta}>Quiero registrarme como</legend>
              <div className={styles.opcionesRol}>
                {ROLES_DISPONIBLES_PARA_REGISTRO.map(({ rol, descripcion }, indice) => (
                  <label key={rol} className={styles.opcionRol}>
                    <input
                      type="radio"
                      name="rol"
                      value={rol}
                      required
                      defaultChecked={indice === 0}
                      className={styles.radio}
                    />
                    <span className={styles.opcionTexto}>
                      <span className={styles.opcionTitulo}>{ETIQUETAS_ROL_USUARIO[rol]}</span>
                      <span className={styles.opcionDescripcion}>{descripcion}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={styles.campo}>
              <label htmlFor="nombreCompleto" className={styles.etiqueta}>
                Nombre completo o del club
              </label>
              <input
                id="nombreCompleto"
                name="nombreCompleto"
                type="text"
                required
                autoComplete="name"
                placeholder="Ana Pérez / Club Atlético Norte"
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
                autoComplete="email"
                placeholder="nombre@correo.com"
                className={styles.entrada}
              />
            </div>

            <CampoContrasena
              etiqueta="Contraseña"
              autoComplete="new-password"
              minLength={6}
              ayuda="Mínimo 6 caracteres."
            />

            {estado.error && <p role="alert" className={styles.error}>{estado.error}</p>}

            <button type="submit" disabled={estaEnviando} className={styles.botonEnviar}>
              {estaEnviando ? "Creando cuenta..." : "Crear cuenta gratis"}
            </button>

            <p className={styles.legal}>
              Al crear la cuenta vas a poder completar tu perfil y, si lo necesitás, pasarte al{" "}
              <Link href="/planes" className={styles.enlace}>plan Pro</Link> en cualquier momento.
            </p>
          </form>

          <p className={styles.piePagina}>
            ¿Ya tenés cuenta?{" "}
            <Link href="/iniciar-sesion" className={styles.enlace}>Iniciá sesión</Link>
          </p>
        </div>
      </div>

      <aside className={styles.columnaInfo} aria-label="Cómo sigue después del registro">
        <p className={styles.volantaInfo}>CFA</p>
        <h2 className={styles.tituloInfo}>Tres pasos y estás adentro.</h2>
        <ol className={styles.pasos}>
          {PASOS_ALTA.map((paso, indice) => (
            <li key={paso}>
              <span className={styles.pasoNumero}>{indice + 1}</span>
              {paso}
            </li>
          ))}
        </ol>
        <div className={styles.enlacesInfo}>
          <Link href="/como-funciona">Cómo funciona la plataforma →</Link>
          <Link href="/preguntas-frecuentes">Preguntas frecuentes →</Link>
        </div>
      </aside>
    </main>
  );
}
