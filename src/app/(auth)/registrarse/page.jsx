"use client"; // "use client" permite que esta página tenga interacción con el usuario, como formularios, estados, botones, etc.

import { useActionState } from "react"; // Este hook nos permite manejar el estado de una acción, en este caso el registro.
import Link from "next/link"; // Importamos Link de Next.js para poder navegar entre páginas.
import { registrarUsuario } from "@/dominio/autenticacion/acciones";
import { ETIQUETAS_ROL_USUARIO } from "@/tipos/dominio";
import styles from "./page.module.css";

const ESTADO_INICIAL = { error: null }; //estado inicial de la pagina, cuando recién entramos a la página todavía no ocurrió ningún error.

const ROLES_DISPONIBLES_PARA_REGISTRO = ["candidato", "representante", "club"]; //objeto que transforma esos valores internos en textos legibles.

/*
🧠 Para un parcial, lo podés explicar así:

Esta página implementa un formulario de registro utilizando React, Next.js y JavaScript.
useActionState permite manejar el estado de la acción de registro, incluyendo los errores y el estado de envío. El formulario utiliza ejecutarRegistro como acción, que ejecuta la función registrarUsuario.
Los campos tienen atributos name para identificar los datos enviados,
mientras que required y minLength realizan validaciones básicas del lado del navegador.
Los roles disponibles se generan dinámicamente mediante map().
Además, se muestra el error de forma condicional y el botón se deshabilita mientras se procesa el registro. Finalmente, Link permite navegar a la página de inicio de sesión.

Las 5 cosas que más te conviene entender de este código
useActionState → maneja el resultado y estado de la acción.
action={ejecutarRegistro} → conecta el formulario con la función de registro.
name="..." → identifica los datos que se envían.
.map() → genera las opciones de roles a partir de un array.
condición && (...) y ? : → permiten mostrar contenido dependiendo del estado.
*/

export default function PaginaRegistro() {
  const [estado, ejecutarRegistro, estaEnviando] = useActionState(registrarUsuario, ESTADO_INICIAL);

  /*
  estado: Contiene el resultado actual de la acción.
  ejecutarRegistro: Es la función que se ejecutará cuando enviemos el formulario.
  estaEnviado: Indica si la acción está actualmente ejecutándose. booleano: true o false
  */

  return ( // A partir de acá empieza lo que se va a mostrar en pantalla. React utiliza JSX para escribir una estructura parecida a HTML dentro de JavaScript.
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
