import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import {
  listarCarteraCandidatos,
  listarPostulacionesDeRepresentante,
} from "@/dominio/representantes/consultas";
import { BotonQuitarCartera } from "@/dominio/representantes/BotonGestionarCartera";
import { CancelarPostulacion } from "@/dominio/representantes/CancelarPostulacion";
import { edadCandidato } from "@/lib/postulacion-cartera";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  ETIQUETAS_ESTADO_POSTULACION,
} from "@/tipos/dominio";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function formatearFecha(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function PaginaMiCartera({ searchParams }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  if (usuario.rol !== "representante") {
    redirect("/");
  }

  const [cartera, postulaciones, parametros] = await Promise.all([
    listarCarteraCandidatos(usuario.id), listarPostulacionesDeRepresentante(usuario.id), searchParams,
  ]);
  const filtros = Object.fromEntries(["nombre", "puesto", "estado"].map(campo => [campo, typeof parametros?.[campo] === "string" ? parametros[campo].trim() : ""]));
  const normalizar = texto => String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR");
  const nombreDe = candidato => candidato.nombre || candidato.usuario?.nombre_completo || "Candidato";
  const candidatos = cartera.filter(c => normalizar(nombreDe(c)).includes(normalizar(filtros.nombre)) && (!filtros.puesto || c.perfil?.puesto === filtros.puesto));
  const postulacionesFiltradas = postulaciones.filter(p => !filtros.estado || p.estado === filtros.estado);
  const candidatosPorId = new Map(cartera.map(c => [c.candidato_id, c]));
  const preseleccionados = postulaciones.filter(p => p.estado === "preseleccionado").length;

  return (
    <main className={styles.main}>
      {/* Cabecera */}
      <header className={styles.cabecera}>
        <div>
          <p className={styles.volanta}>ESPACIO DEL REPRESENTANTE</p>
          <h1 className={styles.titulo}>Mi cartera</h1>
          <p className={styles.subtitulo}>
            Organizá las fichas de tus representados y seguí sus postulaciones desde un mismo lugar.
          </p>
        </div>
        <div className={styles.accionesCabecera}>
          <Link href="/ofertas" className={styles.botonNuevoSecundario}>Explorar ofertas ↗</Link>
          <Link href="/mi-cartera/nuevo" className={styles.botonNuevoTalento}>
            + Agregar representado
          </Link>
        </div>
      </header>

      <dl className={styles.resumen} aria-label="Resumen de tu cartera">
        <div><dt>Representados</dt><dd><strong>{cartera.length}</strong><span>Perfiles en tu cartera actual</span></dd></div>
        <div><dt>Postulaciones registradas</dt><dd><strong>{postulaciones.length}</strong><span>Enviadas por vos y no canceladas</span></dd></div>
        <div><dt>Preseleccionados</dt><dd><strong>{preseleccionados}</strong><span>Postulaciones con ese estado</span></dd></div>
      </dl>

      <nav className={styles.navegacionSecciones} aria-label="Secciones de Mi cartera">
        <a href="#representados">Mis representados <span>{cartera.length}</span></a>
        <a href="#postulaciones">Postulaciones <span>{postulaciones.length}</span></a>
      </nav>

      {/* 1. Datos de la Agencia */}
      <section className={styles.franjaPerfil} aria-labelledby="tituloPerfil">
        <div><h2 id="tituloPerfil">Tu presentación profesional</h2><p>La información de tu agencia se edita desde Mi perfil.</p></div>
        <div className={styles.accesosPerfil}>
          <Link href="/mi-perfil" className={styles.enlacePerfil}>Editar mi perfil →</Link>
          <Link href={`/perfil-publico-representante?id=${usuario.id}`} className={styles.botonNuevoSecundario}>Ver mi perfil público ↗</Link>
        </div>
      </section>

      {/* 2. Cartera Actual de Talentos */}
      <section id="representados" className={styles.seccion} aria-labelledby="tituloRepresentados">
        <div className={styles.encabezadoSeccion}>
          <div>
            <h2 id="tituloRepresentados" className={styles.tituloSeccion}>Mis representados</h2>
            <p className={styles.subtituloSeccion}>
              Consultá cada ficha, actualizá su información o agregá un nuevo candidato.
            </p>
          </div>
          <span className={styles.conteo}>{candidatos.length} de {cartera.length} representados</span>
        </div>

        {cartera.length > 0 && <form method="get" action="/mi-cartera#representados" className={styles.filtros} key={`cartera-${filtros.nombre}-${filtros.puesto}`}>
          {filtros.estado && <input type="hidden" name="estado" value={filtros.estado} />}
          <label className={styles.campoFiltro} htmlFor="nombreRepresentado">Nombre o apellido<input id="nombreRepresentado" name="nombre" type="search" defaultValue={filtros.nombre} placeholder="Buscar en tu cartera..." /></label>
          <label className={styles.campoFiltro} htmlFor="puestoRepresentado">Puesto profesional<select id="puestoRepresentado" name="puesto" defaultValue={filtros.puesto}>
            <option value="">Todos los puestos</option>{Object.entries(ETIQUETAS_PUESTO_PROFESIONAL).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select></label>
          <button type="submit" className={styles.botonFiltrar}>Buscar</button>
          {(filtros.nombre || filtros.puesto) && <Link href={`/mi-cartera${filtros.estado ? `?estado=${encodeURIComponent(filtros.estado)}` : ""}#representados`} className={styles.enlacePerfil}>Limpiar búsqueda</Link>}
        </form>}

        {cartera.length === 0 ? (
          <div className={styles.itemVacio}>
            <span className={styles.iconoVacio} aria-hidden="true">+</span>
            <h3>Aún no tenés representados</h3>
            <p className="mt-1 text-xs text-slate-400">
              Agregá su nombre, puesto y trayectoria para empezar a gestionar oportunidades.
            </p>
            <div className="mt-4">
              <Link href="/mi-cartera/nuevo" className={styles.botonNuevoTalento}>
                + Cargar mi primer representado
              </Link>
            </div>
          </div>
        ) : candidatos.length === 0 ? (
          <div className={styles.itemVacio}><h3>No encontramos candidatos con esos filtros</h3><p>Probá con otro nombre o puesto, o limpiá la búsqueda.</p></div>
        ) : (
          <div className={styles.grillaCartera}>
            {candidatos.map((item) => {
              const nombre = nombreDe(item);
              const inicial = nombre.charAt(0).toUpperCase();
              const edad = edadCandidato(item.perfil?.fecha_nacimiento);
              const cantidadPostulaciones = postulaciones.filter(p => p.candidato_id === item.candidato_id).length;
              return (
                <article key={item.candidato_id} className={styles.tarjetaCandidato}>
                  <div>
                    <div className={styles.candidatoEncabezado}>
                      {item.perfil?.foto_url ? (
                        <ImagenAmpliable
                          src={item.perfil.foto_url}
                          alt={nombre}
                          className={styles.foto}
                        />
                      ) : (
                        <div className={styles.fotoFallback}>{inicial}</div>
                      )}
                      <div>
                        <h3 className={styles.nombreCandidato}>{nombre}</h3>
                        <p className={styles.puestoCandidato}>
                          {ETIQUETAS_PUESTO_PROFESIONAL[item.perfil?.puesto] ?? item.perfil?.puesto}
                          {item.perfil?.posicion_juego ? ` · ${item.perfil.posicion_juego}` : ""}
                        </p>
                      </div>
                    </div>

                    <dl className={styles.detallesCandidato}>
                      <div><dt>Ubicación</dt><dd>{item.perfil?.provincia || "Sin informar"}</dd></div>
                      <div><dt>Edad</dt><dd>{edad === null ? "Sin informar" : `${edad} años`}</dd></div>
                      <div><dt>Club actual</dt><dd>{item.perfil?.club_actual || "Sin informar"}</dd></div>
                      <div><dt>Postulaciones</dt><dd>{cantidadPostulaciones}</dd></div>
                    </dl>
                    <div className={styles.materiales}>
                      <span>{item.perfil?.cv_ruta ? "CV cargado" : "Sin CV"}</span>
                      <span>{item.perfil?.enlaces_video?.length ? `${item.perfil.enlaces_video.length} videos` : "Sin videos"}</span>
                    </div>
                  </div>

                  <div className={styles.accionesCandidato}>
                    <Link
                      href={`/mi-cartera/${item.candidato_id}/editar`}
                      className={styles.botonEditar}
                    >
                      Editar ficha →
                    </Link>
                    <BotonQuitarCartera candidatoId={item.candidato_id} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Historial de Postulaciones Enviadas por la Agencia */}
      <section id="postulaciones" className={styles.seccion} aria-labelledby="tituloPostulaciones">
        <div className={styles.encabezadoSeccion}>
          <div>
            <h2 id="tituloPostulaciones" className={styles.tituloSeccion}>Seguimiento de postulaciones</h2>
            <p className={styles.subtituloSeccion}>
              Revisá la respuesta del club o retirá una postulación que hayas enviado.
            </p>
          </div>
          <span className={styles.conteo}>
            {postulacionesFiltradas.length} de {postulaciones.length} postulaciones
          </span>
        </div>

        {postulaciones.length > 0 && <form method="get" action="/mi-cartera#postulaciones" className={styles.filtros} key={`postulaciones-${filtros.estado}`}>
          {filtros.nombre && <input type="hidden" name="nombre" value={filtros.nombre} />}
          {filtros.puesto && <input type="hidden" name="puesto" value={filtros.puesto} />}
          <label className={styles.campoFiltro} htmlFor="estadoPostulacion">Estado de la postulación<select id="estadoPostulacion" name="estado" defaultValue={filtros.estado}>
            <option value="">Todos los estados</option>{Object.entries(ETIQUETAS_ESTADO_POSTULACION).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select></label>
          <button type="submit" className={styles.botonFiltrar}>Aplicar filtro</button>
        </form>}

        {postulaciones.length === 0 ? (
          <div className={styles.itemVacio}>
            <h3>Todavía no enviaste postulaciones</h3>
            <p className="mt-1 text-xs text-slate-400">
              Podés explorar las <Link href="/ofertas" className="text-emerald-400 underline">ofertas publicadas</Link> y postular a tus representados directamente desde cada búsqueda.
            </p>
            <Link href="/ofertas" className={styles.botonNuevoSecundario}>Explorar ofertas →</Link>
          </div>
        ) : postulacionesFiltradas.length === 0 ? (
          <div className={styles.itemVacio}><h3>No hay postulaciones con ese estado</h3><p>Elegí otro estado o seleccioná Todos los estados.</p></div>
        ) : (
          <div className={styles.listaPostulaciones}>
            {postulacionesFiltradas.map((p) => {
              const oferta = p.ofertas_laborales;
              const nombreCandidato =
                candidatosPorId.get(p.candidato_id) ? nombreDe(candidatosPorId.get(p.candidato_id)) : p.perfiles_candidato?.usuarios?.nombre_completo ?? "Candidato";
              const fotoCandidato = p.perfiles_candidato?.foto_url || candidatosPorId.get(p.candidato_id)?.perfil?.foto_url;
              const inicial = nombreCandidato.charAt(0).toUpperCase();

              return (
                <article key={p.id} className={styles.itemPostulacion}>
                  <div className={styles.identidadPostulacion}>
                    {fotoCandidato ? (
                      <ImagenAmpliable
                        src={fotoCandidato}
                        alt={nombreCandidato}
                        className={styles.fotoPostulanteMini}
                      />
                    ) : (
                      <div className={styles.fotoPostulanteMiniFallback}>
                        {inicial}
                      </div>
                    )}
                    <div className={styles.infoPostulacion}>
                      <span className={styles.candidatoBadge}>
                        {nombreCandidato}
                      </span>
                      <h3 className={styles.ofertaTitulo}>
                        {ETIQUETAS_PUESTO_PROFESIONAL[oferta?.puesto_buscado] ?? oferta?.puesto_buscado ?? "Oferta no disponible"}
                        {oferta?.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
                      </h3>
                      <p className={styles.clubYFecha}>
                        {oferta?.perfiles_club?.nombre_club ?? "Club"}{oferta?.categoria ? ` · ${oferta.categoria}` : ""}
                      </p>
                      <p className={styles.clubYFecha}>Enviada el {formatearFecha(p.creada_en)}</p>
                    </div>
                  </div>

                  <div className={styles.accionesPostulacion}>
                    <span className={`${styles.estadoBadge} ${styles[`estado_${p.estado}`] ?? ""}`}>
                      {ETIQUETAS_ESTADO_POSTULACION[p.estado] ?? p.estado}
                    </span>
                    <CancelarPostulacion postulacionId={p.id} nombreCandidato={nombreCandidato} />
                    {oferta?.id && oferta.estado === "publicada" ? (
                      <Link
                        href={`/ofertas/${oferta.id}`}
                        className={styles.enlacePerfil}
                      >
                        Ver oferta ↗
                      </Link>
                    ) : <span className={styles.ofertaNoDisponible}>{oferta?.estado === "cerrada" ? "Oferta cerrada" : oferta?.estado === "pausada" ? "Oferta pausada" : "Oferta no disponible"}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
