import Link from "next/link";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { PASOS, ROLES_PUBLICOS } from "@/lib/contenido-institucional";
import { ETIQUETAS_PUESTO_PROFESIONAL } from "@/tipos/dominio";
import styles from "./page.module.css";

export const metadata = {
  title: "Cómo funciona — CFA",
  description: "El recorrido completo en CFA: crear el perfil, postularse o publicar y seguir cada proceso.",
};

/** Página pública que explica el recorrido de cada rol dentro de la plataforma. */
export default async function PaginaComoFunciona() {
  const usuario = await obtenerUsuarioActual();

  return (
    <main className={styles.main}>
      <header className={styles.cabecera}>
        <div className={styles.contenedor}>
          <p className={styles.volanta}>DE TU PERFIL A LA OPORTUNIDAD</p>
          <h1 className={styles.titulo}>Cómo funciona CFA</h1>
          <p className={styles.bajada}>
            Tres pasos para presentar tu experiencia, conectar con los clubes y seguir cada
            búsqueda. El mismo recorrido vale para candidatos, clubes y representantes, con las
            herramientas propias de cada rol.
          </p>
        </div>
      </header>

      <section className={styles.seccion} aria-labelledby="tituloPasos">
        <div className={styles.contenedor}>
          <h2 id="tituloPasos" className={styles.tituloSeccion}>El recorrido, paso a paso</h2>
          <ol className={styles.pasos}>
            {PASOS.map((paso, indice) => (
              <li key={paso.titulo} className={styles.paso}>
                <span className={styles.pasoNumero}>{indice + 1}</span>
                <div>
                  <h3 className={styles.pasoTitulo}>{paso.titulo}</h3>
                  <p className={styles.pasoTexto}>{paso.texto}</p>
                  <p className={styles.pasoDetalle}>{paso.detalle}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.bandaClara} aria-labelledby="tituloRoles">
        <div className={styles.contenedor}>
          <p className={styles.volantaOscura}>UN ESPACIO PARA CADA ROL</p>
          <h2 id="tituloRoles" className={styles.tituloClaro}>Qué puede hacer cada cuenta</h2>
          <div className={styles.grillaRoles}>
            {ROLES_PUBLICOS.map((rol) => (
              <article key={rol.rol} className={styles.tarjetaRol}>
                <span className={styles.rolNumero}>{rol.numero}</span>
                <h3 className={styles.rolTitulo}>{rol.titulo}</h3>
                <p className={styles.rolTexto}>{rol.texto}</p>
                <ul className={styles.beneficios}>
                  {rol.beneficios.map((beneficio) => (
                    <li key={beneficio}><span aria-hidden="true">✓</span>{beneficio}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.seccion} aria-labelledby="tituloPuestos">
        <div className={styles.contenedor}>
          <p className={styles.volanta}>MÁS QUE UN SOLO PUESTO</p>
          <h2 id="tituloPuestos" className={styles.tituloSeccion}>Puestos que podés declarar</h2>
          <p className={styles.parrafo}>
            Las postulaciones se habilitan cuando el puesto del candidato coincide con el que busca
            el club, así cada búsqueda recibe perfiles pertinentes.
          </p>
          <ul className={styles.puestos}>
            {Object.values(ETIQUETAS_PUESTO_PROFESIONAL).map((puesto) => (
              <li key={puesto}>{puesto}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.cierre}>
        <div className={`${styles.contenedor} ${styles.cierreInterno}`}>
          <div>
            <h2 className={styles.tituloSeccion}>¿Listo para empezar?</h2>
            <p className={styles.parrafo}>Creá tu cuenta gratis y completá tu perfil en minutos.</p>
          </div>
          <div className={styles.acciones}>
            <Link href="/ofertas" className={styles.botonPrimario}>Ver ofertas</Link>
            {!usuario && (
              <Link href="/registrarse" className={styles.botonSecundario}>Crear cuenta</Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
