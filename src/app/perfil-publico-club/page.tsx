import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilClub } from "@/dominio/perfiles/consultas-club";
import styles from "./page.module.css";

export default async function PaginaPerfilPublicoClub() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  if (usuario.rol !== "club") {
    redirect("/");
  }

  const perfil = await obtenerPerfilClub(usuario.id);

  return (
    <main className={styles.main}>
      <div className={styles.encabezado}>
        <div>
          <h1 className={styles.titulo}>Perfil público del club</h1>
          <p className={styles.subtitulo}>
            Así ven los candidatos los datos de tu club.
          </p>
        </div>
        <Link href="/mi-club" className={styles.enlaceEditar}>
          Editar datos
        </Link>
      </div>

      {!perfil ? (
        <p className={styles.vacio}>
          Todavía no completaste los datos del club.{" "}
          <Link href="/mi-club">Completalos acá</Link>.
        </p>
      ) : (
        <div className={styles.tarjeta}>
          <div className={styles.grilla}>
            <Dato etiqueta="Nombre del club" valor={perfil.nombre_club} />
            <Dato etiqueta="Provincia" valor={perfil.provincia} />
            <Dato etiqueta="Categoría" valor={perfil.categoria} />
          </div>
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
