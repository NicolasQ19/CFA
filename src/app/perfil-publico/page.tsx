import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilCandidato } from "@/dominio/perfiles/consultas";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  esPuestoDeCuerpoTecnico,
} from "@/tipos/dominio";
import styles from "./page.module.css";

export default async function PaginaPerfilPublico() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  if (usuario.rol !== "candidato") {
    redirect("/");
  }

  const perfil = await obtenerPerfilCandidato(usuario.id);

  return (
    <main className={styles.main}>
      <div className={styles.encabezado}>
        <div>
          <h1 className={styles.titulo}>Mi perfil público</h1>
          <p className={styles.subtitulo}>
            Así ven los clubes tu perfil profesional.
          </p>
        </div>
        <Link href="/mi-perfil" className={styles.enlaceEditar}>
          Editar perfil
        </Link>
      </div>

      {!perfil ? (
        <p className={styles.vacio}>
          Todavía no completaste tu perfil.{" "}
          <Link href="/mi-perfil">Completalo acá</Link>.
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

          {perfil.enlaces_video.length > 0 && (
            <div className={styles.seccion}>
              <span className={styles.leyenda}>Videos</span>
              <div className={styles.listaVideos}>
                {perfil.enlaces_video.map((enlace) => (
                  <a
                    key={enlace}
                    href={enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.enlaceVideo}
                  >
                    {enlace}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className={styles.dato}>
      <span className={styles.etiqueta}>{etiqueta}</span>
      <span className={styles.valor}>{valor}</span>
    </div>
  );
}
