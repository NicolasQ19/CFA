import Link from "next/link";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { obtenerPlanDelUsuario } from "@/lib/cupo-suscripciones";
import { AccionesPlan } from "@/dominio/suscripciones/AccionesPlan";
import { BENEFICIOS_PLAN, NOMBRES_PLAN_POR_ROL, ROLES_CON_PLAN } from "@/lib/suscripciones";
import { TITULOS_PLAN_POR_ROL } from "@/lib/contenido-institucional";
import styles from "./page.module.css";

export const metadata = {
  title: "Planes y suscripciones — CFA",
  description: "Comparación entre el plan Base gratuito y el plan Pro para candidatos, clubes y representantes.",
};

const DESCRIPCIONES = {
  club: "Elegí cuántas búsquedas querés tener activas al mismo tiempo.",
  candidato: "Elegí a cuántas búsquedas querés poder postularte cada mes.",
  representante: "Elegí cuántas postulaciones querés enviar por mes para tu cartera.",
};

const NOTA_DEMOSTRACION =
  "La contratación es de demostración: no se procesa ningún pago. Al dar de baja, la cuenta vuelve a los límites del plan gratuito sin perder ofertas, postulaciones ni representados.";

/**
 * Página pública de planes. Las visitas y las cuentas sin plan ven la comparación de
 * los tres roles; una cuenta con plan ve la comparación de su rol con el alta y la baja.
 */
export default async function PaginaPlanes() {
  const usuario = await obtenerUsuarioActual();
  const tienePlan = Boolean(usuario) && ROLES_CON_PLAN.includes(usuario.rol);

  let planVigente = null;
  if (tienePlan) {
    const supabase = await crearClienteServidor();
    planVigente = await obtenerPlanDelUsuario(supabase, usuario.id);
  }

  return (
    <main className={styles.main}>
      <header className={styles.cabecera}>
        <div className={styles.contenedor}>
          <p className={styles.volanta}>PLANES Y SUSCRIPCIONES</p>
          <h1 className={styles.titulo}>Empezá gratis. Ampliá cuando lo necesites.</h1>
          <p className={styles.bajada}>
            {tienePlan
              ? DESCRIPCIONES[usuario.rol]
              : "Todas las cuentas arrancan con el plan Base, sin costo y sin vencimiento. El plan Pro saca los topes del rol para quienes necesitan mover más búsquedas o postulaciones."}
          </p>
        </div>
      </header>

      {tienePlan ? (
        <section className={styles.seccion}>
          <div className={styles.contenedor}>
            <div className={styles.planes}>
              {["gratuito", "pago"].map((plan) => (
                <section
                  key={plan}
                  className={plan === planVigente ? styles.tarjetaActual : styles.tarjeta}
                  aria-label={NOMBRES_PLAN_POR_ROL[usuario.rol][plan]}
                >
                  <div className={styles.tarjetaEncabezado}>
                    <h2 className={styles.nombrePlan}>{NOMBRES_PLAN_POR_ROL[usuario.rol][plan]}</h2>
                    {plan === planVigente && <span className={styles.insignia}>Tu plan actual</span>}
                  </div>

                  <p className={styles.precio}>{plan === "gratuito" ? "Sin costo" : "Plan Pro"}</p>

                  <ul className={styles.beneficios}>
                    {BENEFICIOS_PLAN[usuario.rol][plan].map((beneficio) => (
                      <li key={beneficio}><span aria-hidden="true">✓</span>{beneficio}</li>
                    ))}
                  </ul>

                  {plan === "pago" && (
                    <AccionesPlan
                      planVigente={planVigente}
                      nombrePlanPago={NOMBRES_PLAN_POR_ROL[usuario.rol].pago}
                    />
                  )}
                </section>
              ))}
            </div>
            <p className={styles.nota}>{NOTA_DEMOSTRACION}</p>
          </div>
        </section>
      ) : (
        <>
          <section className={styles.bandaClara} aria-labelledby="tituloComparacion">
            <div className={styles.contenedor}>
              <h2 id="tituloComparacion" className={styles.tituloClaro}>Un plan para cada rol</h2>
              <p className={styles.parrafoClaro}>
                Los cupos dependen del rol con el que usás la plataforma. Así se compara cada nivel.
              </p>

              <div className={styles.grillaPlanes}>
                {ROLES_CON_PLAN.map((rol) => (
                  <article key={rol} className={styles.tarjetaPlan}>
                    <h3 className={styles.planRol}>{TITULOS_PLAN_POR_ROL[rol] ?? rol}</h3>
                    <p className={styles.planDescripcion}>{DESCRIPCIONES[rol]}</p>

                    <div className={styles.planNivel}>
                      <div className={styles.planNivelCabecera}>
                        <span className={styles.planNombre}>{NOMBRES_PLAN_POR_ROL[rol].gratuito}</span>
                        <span className={styles.planPrecio}>Sin costo</span>
                      </div>
                      <ul className={styles.beneficiosClaros}>
                        {BENEFICIOS_PLAN[rol].gratuito.map((beneficio) => (
                          <li key={beneficio}><span aria-hidden="true">✓</span>{beneficio}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.planNivelPro}>
                      <div className={styles.planNivelCabecera}>
                        <span className={styles.planNombrePro}>{NOMBRES_PLAN_POR_ROL[rol].pago}</span>
                        <span className={styles.planInsignia}>Pro</span>
                      </div>
                      <ul className={styles.beneficiosPro}>
                        {BENEFICIOS_PLAN[rol].pago.map((beneficio) => (
                          <li key={beneficio}><span aria-hidden="true">✓</span>{beneficio}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.cierre}>
            <div className={`${styles.contenedor} ${styles.cierreInterno}`}>
              <div>
                <h2 className={styles.tituloSeccion}>
                  {usuario ? "Tu cuenta no usa planes." : "Creá tu cuenta y elegí tu plan."}
                </h2>
                <p className={styles.nota}>{NOTA_DEMOSTRACION}</p>
              </div>
              {!usuario && (
                <div className={styles.acciones}>
                  <Link href="/registrarse" className={styles.botonPrimario}>Crear cuenta gratis</Link>
                  <Link href="/iniciar-sesion" className={styles.botonSecundario}>Iniciar sesión</Link>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
