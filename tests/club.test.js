import test from 'node:test';
import assert from 'node:assert/strict';
import { validarPerfilClub, validarEscudo, validarSeguimiento, resumirActividad, etapaPostulante, urlPublica } from '../src/lib/club.js';
const perfil = valores => { const datos = new FormData(); for(const [k,v] of Object.entries({nombreClub:' Club A ', provincia:'Córdoba', categoria:'Regional', ...valores})) datos.set(k,v); return datos; };

test('valida el perfil y admite campos institucionales opcionales', () => {
  const {datos,error} = validarPerfilClub(perfil({descripcion:' Historia '}));
  assert.equal(error,undefined); assert.equal(datos.nombre_club,'Club A'); assert.equal(datos.descripcion,'Historia'); assert.equal(datos.sitio_web,null);
  assert.ok(validarPerfilClub(perfil({nombreClub:''})).error);
  assert.ok(validarPerfilClub(perfil({instalaciones:'x'.repeat(2001)})).error);
});
test('rechaza enlaces ejecutables y credenciales en URLs', () => {
  for (const enlace of ['javascript:alert(1)','data:text/html,test','ftp://example.com','https://usuario:clave@example.com','instagram.com/club']) {
    assert.equal(urlPublica(enlace),null);
    assert.ok(validarPerfilClub(perfil({sitioWeb:enlace})).error);
  }
  assert.equal(urlPublica('https://example.com/club'),'https://example.com/club');
});
test('valida firma y tamaño del escudo', async () => {
  assert.equal(await validarEscudo(null),null);
  assert.equal(await validarEscudo(new File([new Uint8Array([137,80,78,71,13,10,26,10])],'escudo.png',{type:'image/png'})),null);
  assert.ok(await validarEscudo(new File(['<svg/>'],'escudo.png',{type:'image/png'})));
  assert.ok(await validarEscudo(new File([new Uint8Array(2000001)],'escudo.png',{type:'image/png'})));
});
test('las etapas internas mantienen compatibilidad con estados existentes', () => {
  assert.equal(etapaPostulante('postulado'), 'recibido');
  assert.equal(etapaPostulante('preseleccionado'),'evaluacion');
  assert.equal(etapaPostulante('postulado','contactado'),'contactado');
  assert.equal(etapaPostulante('rechazado'),'descartado');
});
test('no acepta etapas desconocidas ni notas excesivas', () => {
  assert.equal(validarSeguimiento('contactado','Llamar mañana'),null);
  assert.ok(validarSeguimiento('otro','')); assert.ok(validarSeguimiento('recibido','x'.repeat(3001)));
});
test('el resumen delimita club, última semana y seguimiento', () => {
  const ahora=Date.parse('2026-09-28T12:00:00Z');
  const ofertas=[{id:'a',estado:'publicada'},{id:'b',estado:'cerrada'}];
  const postulaciones=[
    {id:'1',oferta_id:'a',estado:'postulado',creada_en:'2026-09-28T10:00:00Z'},
    {id:'2',oferta_id:'a',estado:'postulado',creada_en:'2026-09-21T12:00:00Z'},
    {id:'3',oferta_id:'b',estado:'rechazado',creada_en:'2026-08-01T00:00:00Z'},
    {id:'4',oferta_id:'ajena',estado:'postulado',creada_en:'2026-09-28T10:00:00Z'},
  ];
  assert.deepEqual(resumirActividad(ofertas,postulaciones,[{postulacion_id:'1',etapa:'contactado'}],ahora),{activas:1,total:3,nuevas:2,pendientes:1});
  assert.deepEqual(resumirActividad([],[],[],ahora),{activas:0,total:0,nuevas:0,pendientes:0});
});
