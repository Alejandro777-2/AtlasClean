// Registro de solicitudes en Excel: una fila por solicitud, «Falta dato» en lo que no se dio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { COLUMNAS, FALTA_DATO, armarFila, guardarSolicitud } from '../registroExcel.js';

const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-excel-')), 'solicitudes.xlsx');
const formulario = { empresa: 'Clínica Norte', telefono: '0991112233', direccion: 'Av. Amazonas 100', tipologia: 'general_healthcare', m2: '3200', areas: ['criticas', 'banos'], horario: ['24_7'], frecuencia: 'diaria', nivelLimpieza: 'profundo' };

async function leer(archivo) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(archivo);
  const hoja = libro.getWorksheet('Solicitudes');
  const cab = hoja.getRow(1).values.slice(1);
  const filas = [];
  hoja.eachRow((r, i) => i > 1 && filas.push(Object.fromEntries(cab.map((t, j) => [t, r.getCell(j + 1).value]))));
  return { cab, filas, hoja };
}

test('cada dato del formulario es una columna; lo vacío queda como «Falta dato»', () => {
  const f = armarFila({ id: 'SOL-1', formulario });
  assert.equal(f.valores.empresa, 'Clínica Norte');
  assert.equal(f.valores.correo, FALTA_DATO);
  assert.equal(f.valores.ciudad, FALTA_DATO);
  assert.match(f.valores.rango, /No aplica/);
  assert.equal(f.documento, 'Sin pliego');
  assert.ok(COLUMNAS.some((c) => c.titulo === 'Empresa o entidad') && COLUMNAS.some((c) => c.titulo === 'Observaciones de la visita (equipo)'));
});

test('crea el Excel con cabecera y una fila; regenerar actualiza la misma fila', async () => {
  const archivo = tmp();
  const a = await guardarSolicitud({ id: 'SOL-A', formulario, fichaEstado: 'Faltan datos' }, { archivo });
  assert.equal(a.ok, true);
  assert.equal(a.fila, 2);
  const b = await guardarSolicitud({ id: 'SOL-A', formulario: { ...formulario, ciudad: 'Quito' }, fichaEstado: 'Lista para agendar' }, { archivo });
  assert.equal(b.fila, 2);
  assert.equal(b.nueva, false);
  await guardarSolicitud({ id: 'SOL-B', formulario: { empresa: 'Colegio Sur' } }, { archivo });
  const { cab, filas } = await leer(archivo);
  assert.equal(cab[0], 'ID de solicitud');
  assert.equal(filas.length, 2);
  assert.equal(filas[0].Ciudad, 'Quito');
  assert.equal(filas[0]['Estado de la ficha'], 'Lista para agendar');
  assert.equal(filas[1]['Dirección'], FALTA_DATO);
});

test('lo que el equipo completó a mano en el Excel no se pisa con «Falta dato»', async () => {
  const archivo = tmp();
  await guardarSolicitud({ id: 'SOL-C', formulario }, { archivo });
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(archivo);
  const hoja = libro.getWorksheet('Solicitudes');
  const col = hoja.getRow(1).values.indexOf('Correo');
  hoja.getRow(2).getCell(col).value = 'compras@clinica.ec';
  await libro.xlsx.writeFile(archivo);
  await guardarSolicitud({ id: 'SOL-C', formulario }, { archivo });
  const { filas } = await leer(archivo);
  assert.equal(filas[0].Correo, 'compras@clinica.ec');
});

test('marca los datos que vinieron del pliego', async () => {
  const archivo = tmp();
  await guardarSolicitud({ id: 'SOL-D', formulario, desdeDocumento: [{ campo: 'm2', pagina: 2 }], documentoNombre: 'pliego.pdf' }, { archivo });
  const { filas, hoja } = await leer(archivo);
  assert.equal(filas[0]['Pliego adjunto'], 'pliego.pdf');
  assert.match(filas[0]['Datos tomados del pliego'], /Metros cuadrados \(pág\. 2\)/);
  const col = hoja.getRow(1).values.indexOf('Metros cuadrados');
  assert.match(String(hoja.getRow(2).getCell(col).note?.texts?.[0]?.text ?? hoja.getRow(2).getCell(col).note), /pliego/);
});

test('si no se puede escribir, la fila queda en espera y se guarda la próxima vez', async () => {
  const archivo = tmp();
  fs.mkdirSync(archivo); // una carpeta con el nombre del Excel: escribir falla
  const r = await guardarSolicitud({ id: 'SOL-E', formulario }, { archivo });
  assert.equal(r.ok, false);
  assert.equal(r.pendiente, true);
  fs.rmSync(archivo, { recursive: true });
  const r2 = await guardarSolicitud({ id: 'SOL-F', formulario }, { archivo });
  assert.equal(r2.ok, true);
  const { filas } = await leer(archivo);
  assert.deepEqual(filas.map((f) => f['ID de solicitud']).sort(), ['SOL-E', 'SOL-F']);
});
