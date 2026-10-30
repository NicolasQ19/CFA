import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { BotonEstadoCuenta } from "@/dominio/usuarios/BotonEstadoCuenta";
import { BotonEliminarUsuario } from "@/dominio/usuarios/BotonEliminarUsuario";
import estilosAcciones from "@/dominio/usuarios/BotonEstadoCuenta.module.css";
import {
  ESTADOS_FILTRO_USUARIOS,
  ROLES_FILTRO_USUARIOS,
  USUARIOS_POR_PAGINA,
  construirHrefUsuarios,
  esFichaRepresentado,
  normalizarFiltrosUsuarios,
} from "@/lib/gestion-usuarios";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { ETIQUETAS_ROL_USUARIO } from "@/tipos/dominio";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Usuarios | Administración CFA" };

function formatearFechaAlta(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function obtenerRutaPerfilPublico(usuarioFila) {
  if (usuarioFila.rol === "club") {
    return `/perfil-publico-club?id=${usuarioFila.id}`;
  }
  if (usuarioFila.rol === "candidato") {
    return `/perfil-publico?id=${usuarioFila.id}`;
  }
  if (usuarioFila.rol === "representante") {
    return `/perfil-publico-representante?id=${usuarioFila.id}`;
  }
  return null;
}

/** CU-04 y CU-22 (RF-04, RF-26): listado filtrado y gestión de cuentas de usuarios por el administrador. */
export default async function PaginaGestionUsuarios({ searchParams }) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!usuarioActual) redirect("/iniciar-sesion");
  if (usuarioActual.rol !== "administrador" || !usuarioActual.cuenta_activa) redirect("/");

  const filtros = normalizarFiltrosUsuarios(await searchParams);
  const { rol, estado, busqueda, pagina } = filtros;

  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("usuarios")
    .select("id, rol, nombre_completo, correo_electronico, cuenta_activa, creado_en", {
      count: "exact",
    });

  if (rol !== "todos") {
    consulta = consulta.eq("rol", rol);
  }
  if (estado !== "todos") {
    consulta = consulta.eq("cuenta_activa", estado === "activos");
  }
  if (busqueda) {
    consulta = consulta.or(
      `nombre_completo.ilike.%${busqueda}%,correo_electronico.ilike.%${busqueda}%`
    );
  }

  const desde = (pagina - 1) * USUARIOS_POR_PAGINA;
  const hasta = desde + USUARIOS_POR_PAGINA - 1;

  const {
    data: usuarios = [],
    count: total = 0,
    error,
  } = await consulta
    .order("creado_en", { ascending: false })
    .order("id", { ascending: false })
    .range(desde, hasta);

  const totalRegistros = total ?? 0;

  return (
    <main className={styles.main}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Gestión de Usuarios</h1>
          <p className={styles.subtitulo}>
            Consultá las cuentas registradas por rol, buscá por nombre o correo, activá o desactivá accesos y eliminá cuentas que ya no correspondan.
          </p>
        </div>
        <span className={styles.insigniaConteo}>
          {totalRegistros} {totalRegistros === 1 ? "usuario" : "usuarios"}
        </span>
      </div>

      <form method="GET" action="/admin/usuarios" className={styles.buscadorUsuarios}>
        {rol !== "todos" && <input type="hidden" name="rol" value={rol} />}
        {estado !== "todos" && <input type="hidden" name="estado" value={estado} />}
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre completo o correo electrónico..."
          aria-label="Buscar usuarios por nombre o correo"
          className={styles.entradaBusqueda}
        />
        <button type="submit" className={styles.botonBuscar}>
          Buscar
        </button>
        {(busqueda || rol !== "todos" || estado !== "todos") && (
          <Link href="/admin/usuarios" className={styles.botonLimpiar}>
            Limpiar filtros
          </Link>
        )}
      </form>

      <nav className={styles.filtros} aria-label="Filtrar usuarios por rol">
        {ROLES_FILTRO_USUARIOS.map(([valor, etiqueta]) => (
          <Link
            key={valor}
            href={construirHrefUsuarios(filtros, { rol: valor, pagina: 1 })}
            aria-current={rol === valor ? "page" : undefined}
            className={styles.filtro}
          >
            {etiqueta}
          </Link>
        ))}
      </nav>

      <nav className={styles.filtros} aria-label="Filtrar usuarios por estado de cuenta">
        {ESTADOS_FILTRO_USUARIOS.map(([valor, etiqueta]) => (
          <Link
            key={valor}
            href={construirHrefUsuarios(filtros, { estado: valor, pagina: 1 })}
            aria-current={estado === valor ? "page" : undefined}
            className={styles.filtro}
          >
            {etiqueta}
          </Link>
        ))}
      </nav>

      {error ? (
        <p role="alert" className={styles.itemVacio}>
          No se pudieron cargar los usuarios. Intentá nuevamente.
        </p>
      ) : usuarios.length === 0 ? (
        <div className={styles.itemVacio} style={{ marginTop: "1.5rem" }}>
          <p className={styles.textoVacio}>No se encontraron usuarios con esos filtros.</p>
          <p className={styles.subtextoVacio}>
            Probá cambiando el rol, el estado de cuenta o el texto de búsqueda.
          </p>
        </div>
      ) : (
        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Correo / Acceso</th>
                <th scope="col">Rol</th>
                <th scope="col">Alta</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const esRepresentado = esFichaRepresentado(u);
                const rutaPerfil = obtenerRutaPerfilPublico(u);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.celdaUsuario}>
                        <div className={styles.filaEtiquetas}>
                          <span className={styles.nombreUsuario}>{u.nombre_completo}</span>
                          {esRepresentado && (
                            <span className={styles.insigniaFicha}>Ficha de cartera</span>
                          )}
                        </div>
                        {rutaPerfil && (
                          <Link
                            href={rutaPerfil}
                            target="_blank"
                            className={styles.enlacePerfilClub}
                          >
                            Ver perfil ↗
                          </Link>
                        )}
                      </div>
                    </td>
                    <td>
                      {esRepresentado ? (
                        <span className={styles.correoSecundario}>
                          Gestionado por representante (sin login propio)
                        </span>
                      ) : (
                        <span>{u.correo_electronico}</span>
                      )}
                    </td>
                    <td>{ETIQUETAS_ROL_USUARIO[u.rol] ?? u.rol}</td>
                    <td>{formatearFechaAlta(u.creado_en)}</td>
                    <td>
                      <span
                        className={u.cuenta_activa ? styles.estadoActiva : styles.estadoInactiva}
                      >
                        {u.cuenta_activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td>
                      <div className={estilosAcciones.acciones}>
                        <BotonEstadoCuenta
                          usuarioId={u.id}
                          nombre={u.nombre_completo}
                          activa={Boolean(u.cuenta_activa)}
                          esPropia={u.id === usuarioActual.id}
                        />
                        {/* Las cuentas de administrador y la propia no se pueden eliminar. */}
                        {u.rol !== "administrador" && u.id !== usuarioActual.id && (
                          <BotonEliminarUsuario
                            usuarioId={u.id}
                            nombre={u.nombre_completo}
                            rol={u.rol}
                            esFicha={esRepresentado}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!error && totalRegistros > 0 && (
        <nav className={styles.filtros} aria-label="Paginación de usuarios">
          {pagina > 1 && (
            <Link
              className={styles.filtro}
              href={construirHrefUsuarios(filtros, { pagina: pagina - 1 })}
            >
              ← Anterior
            </Link>
          )}
          <span className={styles.subtitulo}>
            Página {pagina} · {totalRegistros} {totalRegistros === 1 ? "usuario" : "usuarios"}
          </span>
          {pagina * USUARIOS_POR_PAGINA < totalRegistros && (
            <Link
              className={styles.filtro}
              href={construirHrefUsuarios(filtros, { pagina: pagina + 1 })}
            >
              Siguiente →
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
