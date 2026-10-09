import test from "node:test";
import assert from "node:assert/strict";
import { retirarPostulacionDeCartera, retirarPostulacionPropia } from "../src/lib/cancelar-postulacion.js";

function cliente({ sesion = true, userId = "rep", rol = "representante", activa = true, propia = true, cartera = true, borrado = { data: [{ id: "p" }] } } = {}) {
  const consultas = [];
  const supabase = {
    auth: { getUser: async () => ({ data: { user: sesion ? { id: userId } : null } }) },
    from(tabla) {
      const consulta = { tabla, filtros: [], borrar: false };
      consultas.push(consulta);
      const cadena = {
        eq(campo, valor) { consulta.filtros.push([campo, valor]); return cadena; },
        delete() { consulta.borrar = true; return cadena; },
        select() { return consulta.borrar ? Promise.resolve(borrado) : cadena; },
        async maybeSingle() {
          return { data: tabla === "usuarios" ? { rol, cuenta_activa: activa } : tabla === "candidatos_representados" ? (cartera ? { candidato_id: "c" } : null) : (propia ? { id: "p", candidato_id: "c", oferta_id: "o" } : null) };
        },
      };
      return cadena;
    },
  };
  return { supabase, consultas };
}

test("rechaza sesiones ausentes, roles ajenos, cuentas inactivas y candidatos fuera de cartera sin borrar", async () => {
  for (const valores of [{ sesion: false }, { rol: "club" }, { activa: false }, { propia: false }, { cartera: false }]) {
    const { supabase, consultas } = cliente(valores);
    assert.ok((await retirarPostulacionDeCartera(supabase, "p")).error);
    assert.equal(consultas.some(c => c.borrar), false);
  }
});

test("limita el borrado a la postulación, candidato y representante autorizados", async () => {
  const { supabase, consultas } = cliente();
  assert.deepEqual(await retirarPostulacionDeCartera(supabase, "p"), { exito: true, ofertaId: "o" });
  assert.deepEqual(consultas.find(c => c.borrar).filtros, [["id", "p"], ["candidato_id", "c"], ["postulado_por_representante_id", "rep"]]);
});

test("no informa éxito si RLS rechaza el borrado o la postulación ya fue retirada", async () => {
  for (const borrado of [{ data: [], error: null }, { data: null, error: { code: "42501" } }]) {
    const { supabase } = cliente({ borrado });
    assert.ok((await retirarPostulacionDeCartera(supabase, "p")).error);
  }
});

test("el candidato no puede cancelar sin sesión, con cuenta inactiva o una postulación ajena", async () => {
  for (const valores of [{ sesion: false }, { rol: "club" }, { rol: "representante" }, { activa: false }, { propia: false }]) {
    const { supabase, consultas } = cliente({ rol: "candidato", userId: "c", ...valores });
    assert.ok((await retirarPostulacionPropia(supabase, "p")).error);
    assert.equal(consultas.some(c => c.borrar), false);
  }
});

test("la lectura y el borrado de la postulación del candidato están restringidos al dueño", async () => {
  const { supabase, consultas } = cliente({ rol: "candidato", userId: "c" });
  assert.deepEqual(await retirarPostulacionPropia(supabase, "p"), { exito: true, ofertaId: "o" });
  for (const consulta of consultas.filter(c => c.tabla === "postulaciones")) {
    assert.deepEqual(consulta.filtros, [["id", "p"], ["candidato_id", "c"]]);
  }
  assert.equal(consultas.some(c => c.tabla === "candidatos_representados"), false);
});

test("la cancelación propia no informa éxito cuando el borrado no se realiza", async () => {
  for (const borrado of [{ data: [], error: null }, { data: null, error: { code: "42501" } }]) {
    const { supabase } = cliente({ rol: "candidato", borrado });
    assert.ok((await retirarPostulacionPropia(supabase, "p")).error);
  }
});
