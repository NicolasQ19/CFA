/**
 * Devuelve el id de un video de YouTube a partir de sus formatos de enlace habituales
 * (watch?v=, youtu.be/, shorts/, embed/), o null si el enlace no es de YouTube.
 */
export function extraerIdVideoYoutube(enlace) {
  let url;
  try {
    url = new URL(enlace);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id = null;

  if (host === "youtu.be") {
    id = url.pathname.slice(1);
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
  }

  return id && /^[\w-]{11}$/.test(id) ? id : null;
}
