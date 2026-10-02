import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import {
  obtenerPerfilRepresentante,
  listarCarteraCandidatos,
  listarPostulacionesDeRepresentante,
} from "@/dominio/representantes/consultas";
import { FormularioPerfilRepresentante } from "@/dominio/representantes/FormularioPerfilRepresentante";
import { BotonQuitarCartera } from "@/dominio/representantes/BotonGestionarCartera";
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

export default async function PaginaMiCartera() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  if (usuario.rol !== "representante") {
    redirect("/");
  }

  const perfilRepresentante = await obtenerPerfilRepresentante(usuario.id);
  const cartera = await listarCarteraCandidatos(usuario.id);
  const postulaciones = await listarPostulacionesDeRepresentante(usuario.id);

  return (
    <main className={styles.main}>
      {/* Cabecera */}
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Mi Cartera de Representados</h1>
          <p className={styles.subtitulo}>
            Gestioná tu catálogo de talentos y postulalos a búsquedas de clubes en su nombre.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/mi-cartera/nuevo" className={styles.botonNuevoTalento}>
            + Cargar nuevo representado
          </Link>
          <span className={styles.badgeRol}>Rol: Representante</span>
        </div>
      </div>

      {/* 1. Datos de la Agencia */}
      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>Datos de tu Agencia o Representación</h2>
        <p className={styles.subtituloSeccion}>
          Estos datos identificarán a tu agencia y permitirán a los clubes contactarte de forma directa.
        </p>
        <div className="mt-4">
          <FormularioPerfilRepresentante
            perfilActual={perfilRepresentante}
          />
        </div>
      </section>

      {/* 2. Cartera Actual de Talentos */}
      <section className={styles.seccion}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className={styles.tituloSeccion}>Talentos en tu Cartera</h2>
            <p className={styles.subtituloSeccion}>
              Jugadores y profesionales del cuerpo técnico que representás activamente.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-emerald-400">
              {cartera.length} {cartera.length === 1 ? "talento" : "talentos"}
            </span>
            <Link href="/mi-cartera/nuevo" className={styles.botonNuevoSecundario}>
              + Agregar otro
            </Link>
          </div>
        </div>

        {cartera.length === 0 ? (
          <div className={styles.itemVacio}>
            <p className="font-semibold text-slate-200">Aún no cargaste candidatos en tu cartera.</p>
            <p className="mt-1 text-xs text-slate-400">
              Hacé clic en el botón de arriba para registrar la ficha de tu primer representado.
            </p>
            <div className="mt-4">
              <Link href="/mi-cartera/nuevo" className={styles.botonNuevoTalento}>
                + Cargar mi primer representado
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.grillaCartera}>
            {cartera.map((item) => {
              const nombre = item.nombre || item.usuario?.nombre_completo || "Talento";
              const inicial = nombre.charAt(0).toUpperCase();
              return (
                <div key={item.candidato_id} className={styles.tarjetaCandidato}>
                  <div>
                    <div className={styles.candidatoEncabezado}>
                      {item.perfil?.foto_url ? (
                        <img
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

                    <div className={styles.detallesCandidato}>
                      <p>📍 {item.perfil?.provincia ?? "Ubicación no especificada"}</p>
                      {item.perfil?.club_actual && <p>⚽ Club: {item.perfil.club_actual}</p>}
                      {item.perfil?.anios_experiencia && (
                        <p>⏱ Experiencia: {item.perfil.anios_experiencia} años</p>
                      )}
                    </div>
                  </div>

                  <div className={styles.accionesCandidato}>
                    <Link
                      href={`/mi-cartera/${item.candidato_id}/editar`}
                      className={styles.botonEditar}
                    >
                      ✏️ Editar datos
                    </Link>
                    <BotonQuitarCartera candidatoId={item.candidato_id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Historial de Postulaciones Enviadas por la Agencia */}
      <section className={styles.seccion}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={styles.tituloSeccion}>Postulaciones Gestionadas</h2>
            <p className={styles.subtituloSeccion}>
              Seguimiento del estado de las búsquedas laborales a las que postulaste a tus talentos.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400">
            {postulaciones.length} {postulaciones.length === 1 ? "postulación" : "postulaciones"}
          </span>
        </div>

        {postulaciones.length === 0 ? (
          <div className={styles.itemVacio}>
            <p>Todavía no postulaste a ningún candidato a través de tu agencia.</p>
            <p className="mt-1 text-xs text-slate-400">
              Podés explorar las <Link href="/ofertas" className="text-emerald-400 underline">ofertas publicadas</Link> y postular a tus representados directamente desde cada búsqueda.
            </p>
          </div>
        ) : (
          <div className={styles.listaPostulaciones}>
            {postulaciones.map((p) => {
              const oferta = p.ofertas_laborales;
              const nombreCandidato =
                p.perfiles_candidato?.usuarios?.nombre_completo ?? "Candidato";
              const fotoCandidato = p.perfiles_candidato?.foto_url;
              const inicial = nombreCandidato.charAt(0).toUpperCase();

              return (
                <div key={p.id} className={styles.itemPostulacion}>
                  <div className="flex items-center gap-3">
                    {fotoCandidato ? (
                      <img
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
                        Talento: {nombreCandidato}
                      </span>
                      <h3 className={styles.ofertaTitulo}>
                        {ETIQUETAS_PUESTO_PROFESIONAL[oferta?.puesto_buscado] ?? oferta?.puesto_buscado}
                        {oferta?.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
                      </h3>
                      <p className={styles.clubYFecha}>
                        {oferta?.perfiles_club?.nombre_club ?? "Club"} · {oferta?.categoria} · Postulado el {formatearFecha(p.creada_en)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={styles.estadoBadge}>
                      {ETIQUETAS_ESTADO_POSTULACION[p.estado] ?? p.estado}
                    </span>
                    {oferta?.id && (
                      <Link
                        href={`/ofertas/${oferta.id}`}
                        className={styles.enlacePerfil}
                      >
                        Ver oferta ↗
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
