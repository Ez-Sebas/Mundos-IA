// mundo.js — valida los argumentos, crea el objeto y lo guarda o lee (JSON)
import fs from 'node:fs';
import path from 'node:path';
import hash from 'object-hash';

// Paso 1: ruta de la carpeta data/ calculada desde la ubicación del archivo
const RUTA_DATA = path.join(import.meta.dirname, '..', 'data');

// Paso 2: valida que lleguen exactamente 7 argumentos correctos
export function validarArgumentos(args) {
    if (args.length !== 7) {
        throw new Error(
        `Se esperaban 7 argumentos y llegaron ${args.length}.\n` +
            'Ejemplo de uso:\n' +
            '  npm start -- "una ciudad flotante" "mundo acuático" rojo azul verde amarillo violeta'
        );
    }

    const vacios = args.filter((arg) => arg.trim() === '');
    if (vacios.length > 0) {
        throw new Error('Ningún argumento puede estar vacío ni tener solo espacios.');
    }

    const colores = args.slice(2);
    const coloresNormalizados = colores.map((color) => color.trim().toLowerCase());
    const unicos = new Set(coloresNormalizados);

    if (unicos.size !== 5) {
        throw new Error('Los 5 colores deben ser distintos entre sí (sin importar mayúsculas).');
    }

    return {
        situacion: args[0].trim(),
        mundo: args[1].trim(),
        colores: coloresNormalizados,
    };
    }

    // Paso 3: crea el objeto con id de 8 caracteres, sin incluir creadoEn en el hash
    export function crearMundo(args) {
    const { situacion, mundo, colores } = validarArgumentos(args);

    const id = hash({ situacion, mundo, colores }).slice(0, 8);

    return {
        id,
        situacion,
        mundo,
        colores,
        creadoEn: new Date().toISOString(),
    };
    }

    // Paso 4: guarda el objeto en data/mundo_<id>.json con formato legible
    export function guardarMundo(mundo) {
    fs.mkdirSync(RUTA_DATA, { recursive: true });

    const ruta = path.join(RUTA_DATA, `mundo_${mundo.id}.json`);
    fs.writeFileSync(ruta, JSON.stringify(mundo, null, 2));

    return ruta;
    }

    // Paso 5: lee el JSON desde el disco y lo devuelve como objeto
    export function leerMundo(ruta) {
    const contenido = fs.readFileSync(ruta, 'utf-8');
    return JSON.parse(contenido);
}
