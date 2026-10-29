import Link from "next/link";
import { ETIQUETAS_ESTADO_OFERTA } from "@/tipos/dominio";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Métricas | Administración CFA" };

export default async function PaginaMetricas() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "administrador") redirect("/");

  const supabase = await crearClienteServidor();
  const desde = (dias) => new Date(Date.now() - dias * 86400000).toISOString();
  const roles = [["club", "Clubes"], ["candidato", "Candidatos"], ["representante", "Representantes"]];
  const filas = await Promise.all(roles.map(async ([rol, etiqueta]) => {
    const base = () => supabase.from("usuarios").select("id", { count: "exact", head: true }).eq("rol", rol);
    const consultas = await Promise.all([
      base(), base().eq("cuenta_activa", true),
      base().gte("creado_en", desde(7)), base().gte("creado_en", desde(30)),
    ]);
    return { rol, etiqueta, valores: consultas.map(r => r.count), error: consultas.some(r => r.error || r.count === null) };
  }));
  const estados = await Promise.all(Object.entries(ETIQUETAS_ESTADO_OFERTA).map(async ([estado, etiqueta]) => {
    const { count, error } = await supabase.from("ofertas_laborales").select("id", { count: "exact", head: true }).eq("estado", estado);
    return { estado, etiqueta, cantidad: count, error: error || count === null };
  }));
  const hayError = filas.some(f => f.error) || estados.some(e => e.error);
  const clubes = filas[0].valores[0];
  const candidatos = filas[1].valores[0];
  const totalOfertas = estados.reduce((total, e) => total + (e.cantidad ?? 0), 0);
  const formato = new Intl.NumberFormat("es-AR");

  return (
    <main className={styles.main}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Métricas</h1>
          <p className={styles.subtitulo}>Registros, actividad de las cuentas y estado de las ofertas de la plataforma.</p>
        </div>
        <Link href="/admin/usuarios" className={styles.filtro}>
          Gestionar usuarios →
        </Link>
      </div>
      {hayError ? (
        <p role="alert" className={styles.itemVacio}>No se pudieron cargar las métricas. Intentá nuevamente.</p>
      ) : (
        <>
        <dl className={styles.metricas}>
          {[
            ["Total de clubes y candidatos", clubes + candidatos],
            ["Clubes registrados", clubes],
            ["Candidatos registrados", candidatos],
          ].map(([etiqueta, cantidad]) => (
            <div key={etiqueta} className={styles.item}>
              <dt className={styles.datoEtiqueta}>{etiqueta}</dt>
              <dd className={styles.valorMetrica}>{formato.format(cantidad)}</dd>
            </div>
          ))}
        </dl>
        <section className={styles.seccionMetrica} aria-labelledby="cuentas">
          <h2 id="cuentas" className={styles.itemTitulo}>Detalle de usuarios</h2>
          <p className={styles.subtitulo}>Totales por rol y altas en los últimos 7 y 30 días. Los candidatos incluyen las fichas creadas por representantes.</p>
          <div className={styles.tablaContenedor}>
            <table className={styles.tabla}>
              <thead><tr>{["Tipo de usuario", "Registrados", "Cuentas activas", "Cuentas inactivas", "Altas · 7 días", "Altas · 30 días"].map(t => <th key={t} scope="col">{t}</th>)}</tr></thead>
              <tbody>{filas.map(({ rol, etiqueta, valores: [total, activos, semana, mes] }) => <tr key={etiqueta}>
                <th scope="row">
                  <Link href={`/admin/usuarios?rol=${rol}`} className={styles.enlaceExterno}>
                    {etiqueta}
                  </Link>
                </th>
                {[total, activos, total - activos, semana, mes].map((n, i) => <td key={i}>{formato.format(n)}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
          <p className={styles.subtitulo}>“Cuentas activas” indica que la cuenta está habilitada; no mide sesiones ni conexiones recientes. Los administradores no se incluyen en este desglose.</p>
        </section>
        <section className={styles.seccionMetrica} aria-labelledby="ofertas">
          <h2 id="ofertas" className={styles.itemTitulo}>Estado de las ofertas</h2>
          <p className={styles.subtitulo}>{formato.format(totalOfertas)} ofertas en total. Seleccioná un estado para gestionarlas.</p>
          <div className={styles.estadosMetricas}>
            {estados.map(({ estado, etiqueta, cantidad }) => <Link key={estado} href={`/admin?estado=${estado}`} className={styles.item}>
              <div className={styles.lineaClub}><span className={styles.datoValor}>{etiqueta}</span><strong>{formato.format(cantidad)}</strong></div>
              <div className={styles.barra}><span style={{ width: `${totalOfertas ? cantidad / totalOfertas * 100 : 0}%` }} /></div>
              <p className={styles.subtitulo}>{totalOfertas ? Math.round(cantidad / totalOfertas * 100) : 0}% del total</p>
            </Link>)}
          </div>
        </section>
        </>
      )}
    </main>
  );
}
