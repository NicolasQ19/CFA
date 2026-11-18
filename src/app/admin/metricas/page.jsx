import Link from "next/link";
import { ETIQUETAS_ESTADO_OFERTA, ETIQUETAS_ESTADO_POSTULACION } from "@/tipos/dominio";
import { forbidden, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { agruparPorSemana, porcentaje, semanasRecientes } from "@/lib/metricas-admin";
import { obtenerPlanVigente } from "@/lib/suscripciones";
import { GraficoSemanal } from "@/dominio/metricas/GraficoSemanal";
import { BarrasPorEstado } from "@/dominio/metricas/BarrasPorEstado";
import base from "../page.module.css";
import styles from "./page.module.css";

/** Momento actual y fecha ISO de hace `dias` días. Fuera del componente: no son puros y no deben correr en render. */
const momentoActual = () => new Date();
const desde = (dias) => new Date(Date.now() - dias * 86400000).toISOString();

const SEMANAS = 12;
const ROLES = [["club", "Clubes"], ["candidato", "Candidatos"], ["representante", "Representantes"]];
// Orden y colores fijos por rol (validados para daltonismo sobre la superficie oscura).
const SERIES_ROL = [
  { clave: "club", etiqueta: "Clubes", color: "#3987e5" },
  { clave: "candidato", etiqueta: "Candidatos", color: "#d95926" },
  { clave: "representante", etiqueta: "Representantes", color: "#199e70" },
];
const SERIE_POSTULACIONES = [{ clave: "postulaciones", etiqueta: "Postulaciones", color: "#34d399" }];

const formato = new Intl.NumberFormat("es-AR");
const fechaHora = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export const dynamic = "force-dynamic";
export const metadata = { title: "Métricas | Administración CFA" };

/** Conteo exacto sin traer filas; null si la consulta falla. */
async function contar(consulta) {
  const { count, error } = await consulta;
  return error || count === null ? null : count;
}

function Indicador({ etiqueta, valor, detalle, href }) {
  const contenido = (
    <>
      <dt className={styles.indicadorEtiqueta}>{etiqueta}</dt>
      <dd className={styles.indicadorValor}>{valor === null ? "—" : formato.format(valor)}</dd>
      <dd className={styles.indicadorDetalle}>{detalle}</dd>
    </>
  );
  return href
    ? <Link href={href} className={styles.indicador}><dl>{contenido}</dl></Link>
    : <div className={styles.indicador}><dl>{contenido}</dl></div>;
}

function Tarjeta({ id, titulo, descripcion, accion, children }) {
  return (
    <section className={styles.tarjeta} aria-labelledby={id}>
      <header className={styles.tarjetaCabecera}>
        <div>
          <h2 id={id} className={styles.tarjetaTitulo}>{titulo}</h2>
          {descripcion && <p className={styles.tarjetaDescripcion}>{descripcion}</p>}
        </div>
        {accion}
      </header>
      {children}
    </section>
  );
}

const SinDatos = () => <p role="alert" className={styles.sinDatos}>No se pudo cargar esta sección. Recargá la página para intentar nuevamente.</p>;

export default async function PaginaMetricas() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "administrador") forbidden();

  const supabase = await crearClienteServidor();
  const ahora = momentoActual();
  const semanas = semanasRecientes(SEMANAS, ahora);
  const inicioSerie = new Date(semanas[0].inicio).toISOString();
  const postulacionesDe = () => supabase.from("postulaciones").select("id", { count: "exact", head: true });
  const verificacionesDe = () => supabase.from("verificaciones_club").select("club_id", { count: "exact", head: true });

  const [filas, estados, altas, postulaciones, planes, verificaciones] = await Promise.all([
    // RF-27: usuarios por rol, activos e inactivos, altas de 7 y 30 días.
    Promise.all(ROLES.map(async ([rol, etiqueta]) => {
      const deRol = () => supabase.from("usuarios").select("id", { count: "exact", head: true }).eq("rol", rol);
      const valores = await Promise.all([
        contar(deRol()), contar(deRol().eq("cuenta_activa", true)),
        contar(deRol().gte("creado_en", desde(7))), contar(deRol().gte("creado_en", desde(30))),
      ]);
      return { rol, etiqueta, valores, error: valores.includes(null) };
    })),
    // RF-27: ofertas por estado.
    Promise.all(Object.entries(ETIQUETAS_ESTADO_OFERTA).map(async ([estado, etiqueta]) => {
      const cantidad = await contar(supabase.from("ofertas_laborales").select("id", { count: "exact", head: true }).eq("estado", estado));
      return { clave: estado, etiqueta, cantidad, href: `/admin?estado=${estado}` };
    })),
    // Altas por semana y rol.
    supabase.from("usuarios").select("rol, creado_en").in("rol", ROLES.map(([rol]) => rol)).gte("creado_en", inicioSerie).limit(10000),
    // Postulaciones: por estado, recientes y por semana.
    Promise.all([
      Promise.all(Object.entries(ETIQUETAS_ESTADO_POSTULACION).map(async ([estado, etiqueta]) =>
        ({ clave: estado, etiqueta, cantidad: await contar(postulacionesDe().eq("estado", estado)) }))),
      contar(postulacionesDe().gte("creada_en", desde(30))),
      supabase.from("postulaciones").select("creada_en").gte("creada_en", inicioSerie).limit(10000),
    ]),
    // Planes Pro vigentes por rol.
    (async () => {
      const { data, error } = await supabase.from("suscripciones").select("usuario_id, plan, vence_en").eq("plan", "pago");
      if (error) return null;
      const ids = data.filter((fila) => obtenerPlanVigente(fila, ahora) === "pago").map((fila) => fila.usuario_id);
      if (!ids.length) return {};
      const { data: cuentas, error: errorCuentas } = await supabase.from("usuarios").select("id, rol").in("id", ids);
      if (errorCuentas) return null;
      return cuentas.reduce((porRol, cuenta) => ({ ...porRol, [cuenta.rol]: (porRol[cuenta.rol] ?? 0) + 1 }), {});
    })(),
    // Verificación de clubes.
    Promise.all([
      contar(verificacionesDe().eq("estado", "verificado")),
      contar(verificacionesDe().eq("estado", "pendiente").not("solicitada_en", "is", null)),
      contar(verificacionesDe().eq("estado", "rechazado")),
    ]),
  ]);

  const hayError = filas.some((fila) => fila.error) || estados.some((estado) => estado.cantidad === null);
  const [clubes, candidatos, representantes] = filas.map((fila) => fila.valores[0] ?? 0);
  const totalUsuarios = clubes + candidatos + representantes;
  const altasMes = filas.reduce((suma, fila) => suma + (fila.valores[3] ?? 0), 0);
  const totalOfertas = estados.reduce((suma, estado) => suma + (estado.cantidad ?? 0), 0);
  const cantidadOfertas = Object.fromEntries(estados.map((estado) => [estado.clave, estado.cantidad ?? 0]));

  const serieAltas = altas.error ? null
    : agruparPorSemana(altas.data, { semanas, campoFecha: "creado_en", claveSerie: "rol", series: SERIES_ROL.map((serie) => serie.clave) });

  const [estadosPostulacion, postulacionesMes, seriePostulacionesCruda] = postulaciones;
  const errorPostulaciones = estadosPostulacion.some((estado) => estado.cantidad === null) || postulacionesMes === null;
  const totalPostulaciones = errorPostulaciones ? null : estadosPostulacion.reduce((suma, estado) => suma + estado.cantidad, 0);
  const seriePostulaciones = seriePostulacionesCruda.error ? null
    : agruparPorSemana(seriePostulacionesCruda.data, { semanas, campoFecha: "creada_en", series: ["postulaciones"] });

  const totalPro = planes ? Object.values(planes).reduce((suma, cantidad) => suma + cantidad, 0) : null;
  const errorVerificaciones = verificaciones.includes(null);
  const [verificados, pendientesVerificacion, rechazados] = verificaciones.map((valor) => valor ?? 0);

  const pendientes = [
    cantidadOfertas.pendiente_moderacion > 0 && {
      href: "/admin?estado=pendiente_moderacion",
      texto: `${formato.format(cantidadOfertas.pendiente_moderacion)} ${cantidadOfertas.pendiente_moderacion === 1 ? "oferta espera" : "ofertas esperan"} moderación`,
    },
    !errorVerificaciones && pendientesVerificacion > 0 && {
      href: "/admin/clubes?estado=pendiente",
      texto: `${formato.format(pendientesVerificacion)} ${pendientesVerificacion === 1 ? "club espera" : "clubes esperan"} verificación`,
    },
  ].filter(Boolean);

  return (
    <main className={base.main}>
      <div className={base.cabecera}>
        <div>
          <h1 className={base.titulo}>Métricas</h1>
          <p className={base.subtitulo}>Usuarios, ofertas, postulaciones y planes de la plataforma.</p>
        </div>
        <div className={styles.cabeceraAcciones}>
          <span className={styles.actualizado}>Actualizado el {fechaHora.format(ahora)}</span>
          <Link href="/admin/usuarios" className={base.filtro}>Gestionar usuarios →</Link>
        </div>
      </div>

      {hayError ? (
        <p role="alert" className={base.itemVacio}>No se pudieron cargar las métricas. Intentá nuevamente.</p>
      ) : (
        <>
          {pendientes.length > 0 && (
            <div className={styles.pendientes}>
              <span className={styles.pendientesTitulo}>
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M10 2 1 18h18L10 2Zm-.9 6h1.8v5H9.1V8Zm0 6.4h1.8v1.8H9.1v-1.8Z" /></svg>
                Requiere atención
              </span>
              {pendientes.map((pendiente) => (
                <Link key={pendiente.href} href={pendiente.href} className={styles.pendienteEnlace}>{pendiente.texto} →</Link>
              ))}
            </div>
          )}

          <div className={styles.indicadores}>
            <Indicador etiqueta="Usuarios registrados" valor={totalUsuarios}
              detalle={<><b>+{formato.format(altasMes)}</b> en los últimos 30 días</>} href="/admin/usuarios" />
            <Indicador etiqueta="Ofertas publicadas" valor={cantidadOfertas.publicada}
              detalle={<>de {formato.format(totalOfertas)} ofertas en total</>} href="/admin?estado=publicada" />
            <Indicador etiqueta="Postulaciones" valor={totalPostulaciones}
              detalle={errorPostulaciones ? "No se pudieron cargar" : <><b>+{formato.format(postulacionesMes)}</b> en los últimos 30 días</>} />
            <Indicador etiqueta="Cuentas con plan Pro" valor={totalPro}
              detalle={totalPro === null ? "No se pudieron cargar" : <>{porcentaje(totalPro, totalUsuarios)}% de las cuentas</>} href="/admin/suscripciones" />
          </div>

          <div className={styles.dosColumnas}>
            <Tarjeta id="altas" titulo="Altas de usuarios" descripcion="Cuentas nuevas por semana, separadas por rol.">
              {serieAltas ? <GraficoSemanal semanas={serieAltas} series={SERIES_ROL} unidad="altas" ahora={ahora.getTime()} /> : <SinDatos />}
            </Tarjeta>
            <Tarjeta id="actividad" titulo="Postulaciones enviadas" descripcion="Postulaciones nuevas por semana, de candidatos y representantes.">
              {seriePostulaciones ? <GraficoSemanal semanas={seriePostulaciones} series={SERIE_POSTULACIONES} unidad="postulaciones" ahora={ahora.getTime()} /> : <SinDatos />}
            </Tarjeta>
          </div>

          <Tarjeta id="cuentas" titulo="Usuarios por rol"
            descripcion="Totales por rol y altas en los últimos 7 y 30 días. Los candidatos incluyen las fichas creadas por representantes.">
            <div className={base.tablaContenedor}>
              <table className={`${base.tabla} ${styles.tablaNumerica}`}>
                <thead><tr>{["Tipo de usuario", "Registrados", "Cuentas activas", "Cuentas inactivas", "Altas · 7 días", "Altas · 30 días", "Plan Pro"].map((titulo) => <th key={titulo} scope="col">{titulo}</th>)}</tr></thead>
                <tbody>
                  {filas.map(({ rol, etiqueta, valores: [total, activos, semana, mes] }) => (
                    <tr key={rol}>
                      <th scope="row"><Link href={`/admin/usuarios?rol=${rol}`} className={base.enlaceExterno}>{etiqueta}</Link></th>
                      {[total, activos, total - activos, semana, mes].map((valor, indice) => <td key={indice}>{formato.format(valor)}</td>)}
                      <td>{planes ? formato.format(planes[rol] ?? 0) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    {[0, 1, 2, 3, 4].map((indice) => (
                      <td key={indice}>{formato.format(filas.reduce((suma, { valores: [total, activos, semana, mes] }) => suma + [total, activos, total - activos, semana, mes][indice], 0))}</td>
                    ))}
                    <td>{totalPro === null ? "—" : formato.format(totalPro)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className={styles.nota}>“Cuentas activas” indica que la cuenta está habilitada; no mide sesiones ni conexiones recientes. Los administradores no se incluyen.</p>
          </Tarjeta>

          <div className={styles.dosColumnas}>
            <Tarjeta id="ofertas" titulo="Ofertas por estado" descripcion={`${formato.format(totalOfertas)} ofertas en total. Elegí un estado para gestionarlas.`}>
              <BarrasPorEstado filas={estados} total={totalOfertas} />
            </Tarjeta>
            <Tarjeta id="postulaciones" titulo="Postulaciones por estado"
              descripcion={errorPostulaciones ? undefined : `${formato.format(totalPostulaciones)} postulaciones en total, según la etapa en la que las dejó el club.`}>
              {errorPostulaciones ? <SinDatos /> : <BarrasPorEstado filas={estadosPostulacion} total={totalPostulaciones} />}
            </Tarjeta>
          </div>

          <div className={styles.dosColumnas}>
            <Tarjeta id="verificacion" titulo="Verificación de clubes" descripcion={`${formato.format(clubes)} clubes registrados.`}
              accion={<Link href="/admin/clubes" className={base.filtro}>Revisar →</Link>}>
              {errorVerificaciones ? <SinDatos /> : (
                <BarrasPorEstado total={clubes} filas={[
                  { clave: "verificado", etiqueta: "Verificados", cantidad: verificados, href: "/admin/clubes?estado=verificado" },
                  { clave: "pendiente", etiqueta: "Esperan revisión", cantidad: pendientesVerificacion, href: "/admin/clubes?estado=pendiente" },
                  { clave: "rechazado", etiqueta: "Rechazados", cantidad: rechazados, href: "/admin/clubes?estado=rechazado" },
                  { clave: "sin_solicitar", etiqueta: "Sin solicitar", cantidad: Math.max(0, clubes - verificados - pendientesVerificacion - rechazados) },
                ]} />
              )}
            </Tarjeta>
            <Tarjeta id="planes" titulo="Plan Pro por rol" descripcion="Cuentas con plan Pro vigente sobre el total de cuentas de cada rol."
              accion={<Link href="/admin/suscripciones" className={base.filtro}>Suscripciones →</Link>}>
              {planes ? (
                <BarrasPorEstado filas={filas.map(({ rol, etiqueta, valores: [total] }) => ({
                  clave: rol, etiqueta, cantidad: planes[rol] ?? 0, total, href: `/admin/suscripciones?rol=${rol}`,
                }))} />
              ) : <SinDatos />}
            </Tarjeta>
          </div>
        </>
      )}
    </main>
  );
}
