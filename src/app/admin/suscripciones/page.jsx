import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { GestionPlanUsuario } from "@/dominio/suscripciones/GestionPlanUsuario";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { esFichaRepresentado } from "@/lib/gestion-usuarios";
import { NOMBRES_PLAN_POR_ROL, ROLES_CON_PLAN, describirPlan } from "@/lib/suscripciones";
import { ETIQUETAS_ROL_USUARIO } from "@/tipos/dominio";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Suscripciones | Administración CFA" };

const FILTROS_ROL = [["todos", "Todos los roles"], ...ROLES_CON_PLAN.map((rol) => [rol, ETIQUETAS_ROL_USUARIO[rol]])];
const POR_PAGINA = 20;

function formatearVencimiento(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

/** CU-23: el administrador consulta y gestiona los planes de las cuentas. */
export default async function PaginaSuscripciones({ searchParams }) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!usuarioActual) redirect("/iniciar-sesion");
  if (usuarioActual.rol !== "administrador" || !usuarioActual.cuenta_activa) redirect("/");

  const parametros = await searchParams;
  const rolCrudo = String(parametros?.rol ?? "todos");
  const rol = FILTROS_ROL.some(([valor]) => valor === rolCrudo) ? rolCrudo : "todos";
  const pagina = Math.max(1, Number.parseInt(parametros?.pagina, 10) || 1);

  const supabase = await crearClienteServidor();
  const desde = (pagina - 1) * POR_PAGINA;

  const { data: cuentas, count, error } = await supabase
    .from("usuarios")
    .select("id, rol, nombre_completo, correo_electronico, cuenta_activa", { count: "exact" })
    .in("rol", rol === "todos" ? ROLES_CON_PLAN : [rol])
    .order("rol")
    .order("nombre_completo")
    .range(desde, desde + POR_PAGINA - 1);

  // Las suscripciones se consultan aparte en vez de embeberlas en `usuarios`: el embed
  // depende de que PostgREST tenga la relación en su caché de esquema, y una cuenta sin
  // fila de suscripción tiene que listarse igual, con su plan gratuito.
  const { data: suscripciones } = cuentas?.length
    ? await supabase
        .from("suscripciones")
        .select("usuario_id, plan, vence_en, actualizada_en")
        .in("usuario_id", cuentas.map((cuenta) => cuenta.id))
    : { data: [] };

  const suscripcionPorUsuario = new Map((suscripciones ?? []).map((fila) => [fila.usuario_id, fila]));

  const total = count ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <main className={styles.main}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Suscripciones</h1>
          <p className={styles.subtitulo}>
            Consultá el plan de cada cuenta y activá o dá de baja el plan Pro. La contratación es de demostración: no se procesa ningún pago.
          </p>
        </div>
        <span className={styles.insigniaConteo}>
          {total} {total === 1 ? "cuenta" : "cuentas"}
        </span>
      </div>

      <nav className={styles.filtros} aria-label="Filtrar cuentas por rol">
        {FILTROS_ROL.map(([valor, etiqueta]) => (
          <Link
            key={valor}
            href={valor === "todos" ? "/admin/suscripciones" : `/admin/suscripciones?rol=${valor}`}
            aria-current={rol === valor ? "page" : undefined}
            className={styles.filtro}
          >
            {etiqueta}
          </Link>
        ))}
      </nav>

      {error ? (
        <p role="alert" className={styles.itemVacio}>
          No se pudieron cargar las suscripciones: {error.message}
        </p>
      ) : (cuentas ?? []).length === 0 ? (
        <div className={styles.itemVacio} style={{ marginTop: "1.5rem" }}>
          <p className={styles.textoVacio}>No hay cuentas con planes disponibles para ese filtro.</p>
        </div>
      ) : (
        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th scope="col">Cuenta</th>
                <th scope="col">Rol</th>
                <th scope="col">Plan</th>
                <th scope="col">Vence</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((cuenta) => {
                const { plan, nombre, vencimiento } = describirPlan(
                  cuenta.rol,
                  suscripcionPorUsuario.get(cuenta.id),
                );
                return (
                  <tr key={cuenta.id}>
                    <td>
                      <div className={styles.celdaUsuario}>
                        <span className={styles.nombreUsuario}>{cuenta.nombre_completo}</span>
                        <span className={styles.correoSecundario}>
                          {esFichaRepresentado(cuenta)
                            ? "Ficha de cartera (sin login propio)"
                            : cuenta.correo_electronico}
                        </span>
                      </div>
                    </td>
                    <td>{ETIQUETAS_ROL_USUARIO[cuenta.rol]}</td>
                    <td>{nombre}</td>
                    <td>{formatearVencimiento(vencimiento) ?? "—"}</td>
                    <td>
                      {cuenta.cuenta_activa ? (
                        <GestionPlanUsuario
                          usuarioId={cuenta.id}
                          planVigente={plan}
                          nombrePlanPago={NOMBRES_PLAN_POR_ROL[cuenta.rol].pago}
                        />
                      ) : (
                        <span className={styles.correoSecundario}>Cuenta inactiva</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 && (
        <nav className={styles.filtros} aria-label="Paginación">
          {Array.from({ length: paginas }, (_, i) => i + 1).map((numero) => (
            <Link
              key={numero}
              href={`/admin/suscripciones?${rol === "todos" ? "" : `rol=${rol}&`}pagina=${numero}`}
              aria-current={numero === pagina ? "page" : undefined}
              className={styles.filtro}
            >
              {numero}
            </Link>
          ))}
        </nav>
      )}
    </main>
  );
}
