import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilClub } from "@/dominio/perfiles/consultas";
import { FormularioPerfilClub } from "@/dominio/perfiles/FormularioPerfilClub";
import { EstadoVerificacionClub } from "@/dominio/clubes/EstadoVerificacionClub";
import { FormularioVerificacionClub } from "@/dominio/clubes/FormularioVerificacionClub";
import styles from "./page.module.css";

/*Datos institucionales del club. Requisito previo para publicar ofertas. */
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
      <EstadoVerificacionClub verificacion={usuario.verificacion_club} />

      <div className={styles.contenido}>
        <FormularioPerfilClub perfilExistente={perfilExistente} />
      </div>
      <section id="verificacion" className={styles.contenido}>
        <h2 className={styles.titulo}>Verificación del club</h2>
        <FormularioVerificacionClub key={usuario.verificacion_club?.solicitada_en ?? "nueva"} verificacion={usuario.verificacion_club} perfilCompleto={Boolean(perfilExistente?.nombre_club && perfilExistente?.provincia && perfilExistente?.localidad?.trim())} />
      </section>
    </main>
  );
}
