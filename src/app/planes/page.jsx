import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { obtenerPlanDelUsuario } from "@/lib/cupo-suscripciones";
import { AccionesPlan } from "@/dominio/suscripciones/AccionesPlan";
import { BENEFICIOS_PLAN, NOMBRES_PLAN_POR_ROL, ROLES_CON_PLAN } from "@/lib/suscripciones";
import styles from "./page.module.css";

const DESCRIPCIONES = {
  club: "Elegí cuántas búsquedas querés tener activas al mismo tiempo.",
  candidato: "Elegí a cuántas búsquedas querés poder postularte cada mes.",
  representante: "Elegí cuántas postulaciones querés enviar por mes para tu cartera.",
};

/** Comparación entre el plan gratuito y el plan Pro del rol, con alta y baja. */
export default async function PaginaPlanes() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (!ROLES_CON_PLAN.includes(usuario.rol)) redirect("/");

  const supabase = await crearClienteServidor();
  const planVigente = await obtenerPlanDelUsuario(supabase, usuario.id);

  const nombres = NOMBRES_PLAN_POR_ROL[usuario.rol];
  const beneficios = BENEFICIOS_PLAN[usuario.rol];

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Planes</h1>
      <p className={styles.subtitulo}>{DESCRIPCIONES[usuario.rol]}</p>

      <div className={styles.planes}>
        {["gratuito", "pago"].map((plan) => (
          <section
            key={plan}
            className={plan === planVigente ? styles.tarjetaActual : styles.tarjeta}
            aria-label={nombres[plan]}
          >
            <div className={styles.tarjetaEncabezado}>
              <h2 className={styles.nombrePlan}>{nombres[plan]}</h2>
              {plan === planVigente && <span className={styles.insignia}>Tu plan actual</span>}
            </div>

            <p className={styles.precio}>
              {plan === "gratuito" ? "Sin costo" : "Plan Pro"}
            </p>

            <ul className={styles.beneficios}>
              {beneficios[plan].map((beneficio) => (
                <li key={beneficio}>{beneficio}</li>
              ))}
            </ul>

            {plan === "pago" && (
              <AccionesPlan planVigente={planVigente} nombrePlanPago={nombres.pago} />
            )}
          </section>
        ))}
      </div>

      <p className={styles.nota}>
        La contratación es de demostración: no se procesa ningún pago. Al dar de baja, la cuenta
        vuelve a los límites del plan gratuito sin perder ofertas, postulaciones ni representados.
      </p>
    </main>
  );
}
