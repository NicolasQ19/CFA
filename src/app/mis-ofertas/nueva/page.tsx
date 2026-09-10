import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { FormularioNuevaOferta } from "@/dominio/ofertas/FormularioNuevaOferta";
import styles from "./page.module.css";

/** RF-12: el club publica una nueva oferta laboral. */
export default async function PaginaNuevaOferta() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "club") redirect("/");

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Publicar oferta</h1>
      <p className={styles.subtitulo}>
        La oferta queda pendiente de moderación antes de publicarse.
      </p>

      <div className={styles.contenido}>
        <FormularioNuevaOferta />
      </div>
    </main>
  );
}
