import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilCandidato } from "@/dominio/perfiles/consultas";
import { candidatoSePostuloAlClub } from "@/dominio/postulaciones/consultas-club";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { extraerIdVideoYoutube } from "@/lib/youtube";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  esPuestoDeCuerpoTecnico,
} from "@/tipos/dominio";
import styles from "./page.module.css";

export default async function PaginaPerfilPublico({ searchParams }) {
  const usuario = await obtenerUsuarioActual();
  const parametros = await searchParams;
  const candidatoId = parametros?.id;

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  const esVistaAjena = Boolean(candidatoId && candidatoId !== usuario.id);

  if (esVistaAjena && usuario.rol !== "club" && usuario.rol !== "administrador") {
    redirect("/");
  }

  if (!esVistaAjena && usuario.rol !== "candidato") {
    redirect("/");
  }

  const idPerfil = esVistaAjena ? candidatoId : usuario.id;
  const perfil = await obtenerPerfilCandidato(idPerfil);

  // Un perfil oculto no sale en la búsqueda; un club solo lo ve si el candidato se postuló a sus ofertas.
  if (
    esVistaAjena &&
    usuario.rol === "club" &&
    perfil &&
    !perfil.perfil_visible &&
    !(await candidatoSePostuloAlClub(idPerfil, usuario.id))
  ) {
    notFound();
  }

  let nombreCandidato = usuario.nombre_completo;
  if (esVistaAjena) {
    const supabase = await crearClienteServidor();
    const { data: candidato } = await supabase
      .from("usuarios")
      .select("nombre_completo")
      .eq("id", idPerfil)
      .maybeSingle();
    nombreCandidato = candidato?.nombre_completo ?? "Candidato";
  }

  return (
    <main className={styles.main}>
      <div className={styles.encabezado}>
        {perfil?.foto_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfil.foto_url} alt={`Foto de ${nombreCandidato}`} className={styles.foto} />
        )}
        <div className={styles.encabezadoTexto}>
          <h1 className={styles.titulo}>
            {esVistaAjena ? nombreCandidato : "Mi perfil público"}
          </h1>
          <p className={styles.subtitulo}>
            {esVistaAjena
              ? "Perfil profesional del candidato."
              : "Así ven los clubes tu perfil profesional."}
          </p>
        </div>
        {!esVistaAjena && (
          <Link href="/mi-perfil" className={styles.enlaceEditar}>
            Editar perfil
          </Link>
        )}
      </div>

      {!perfil ? (
        <p className={styles.vacio}>
          {esVistaAjena ? (
            "Este candidato todavía no completó su perfil."
          ) : (
            <>
              Todavía no completaste tu perfil.{" "}
              <Link href="/mi-perfil">Completalo acá</Link>.
            </>
          )}
        </p>
      ) : (
        <div className={styles.tarjeta}>
          <div className={styles.grilla}>
            <Dato etiqueta="Puesto profesional" valor={ETIQUETAS_PUESTO_PROFESIONAL[perfil.puesto]} />
            <Dato etiqueta="Provincia" valor={perfil.provincia} />
            <Dato etiqueta="Club actual" valor={perfil.club_actual} />
          </div>

          {esPuestoDeCuerpoTecnico(perfil.puesto) ? (
            <div className={styles.seccion}>
              <span className={styles.leyenda}>Datos técnicos</span>
              <div className={styles.grilla}>
                <Dato etiqueta="Título / matrícula" valor={perfil.titulo_o_matricula} />
                <Dato etiqueta="Licencia" valor={perfil.licencia} />
                <Dato etiqueta="Años de experiencia" valor={perfil.anios_experiencia?.toString() ?? null} />
                <Dato etiqueta="Especialidad" valor={perfil.especialidad} />
              </div>
            </div>
          ) : (
            <div className={styles.seccion}>
              <span className={styles.leyenda}>Datos deportivos</span>
              <div className={styles.grilla}>
                <Dato etiqueta="Posición" valor={perfil.posicion_juego} />
                <Dato etiqueta="Pierna hábil" valor={perfil.pierna_habil} />
                <Dato etiqueta="Altura (cm)" valor={perfil.altura_cm?.toString() ?? null} />
                <Dato etiqueta="Peso (kg)" valor={perfil.peso_kg?.toString() ?? null} />
              </div>
            </div>
          )}

          {perfil.trayectoria && (
            <div className={styles.seccion}>
              <span className={styles.leyenda}>Trayectoria</span>
              <p className={styles.texto}>{perfil.trayectoria}</p>
            </div>
          )}

          {perfil.formacion_academica && (
            <div className={styles.seccion}>
              <span className={styles.leyenda}>Formación académica</span>
              <p className={styles.texto}>{perfil.formacion_academica}</p>
            </div>
          )}

          {perfil.enlaces_video?.length > 0 && (
            <div className={styles.seccion}>
              <span className={styles.leyenda}>Videos</span>
              <div className={styles.listaVideos}>
                {perfil.enlaces_video.map((enlace) => {
                  const idVideo = extraerIdVideoYoutube(enlace);
                  return idVideo ? (
                    <iframe
                      key={enlace}
                      src={`https://www.youtube-nocookie.com/embed/${idVideo}`}
                      title={`Video de ${nombreCandidato}`}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      className={styles.video}
                    />
                  ) : (
                    <a
                      key={enlace}
                      href={enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.enlaceVideo}
                    >
                      {enlace}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function Dato({ etiqueta, valor }) {
  if (!valor) return null;
  return (
    <div className={styles.dato}>
      <span className={styles.etiqueta}>{etiqueta}</span>
      <span className={styles.valor}>{valor}</span>
    </div>
  );
}