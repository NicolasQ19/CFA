import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilClub } from "@/dominio/perfiles/consultas-club";
import { FormularioPerfilClub } from "@/dominio/perfiles/FormularioPerfilClub";
import styles from "./page.module.css";

/** RF-11: datos institucionales del club. Requisito previo para publicar ofertas. */
export default async function PaginaMiClub() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "club") redirect("/");

  const perfilExistente = await obtenerPerfilClub(usuario.id);

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Datos del club</h1>
      <p className={styles.subtitulo}>
        Completá estos datos antes de publicar tu primera oferta.
      </p>

      <div className={styles.contenido}>
        <FormularioPerfilClub perfilExistente={perfilExistente} />
      </div>
    </main>
  );
}
