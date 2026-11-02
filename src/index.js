// index.js — orquesta los pasos 1 a 4
import fs from 'node:fs';
import { crearMundo, guardarMundo, leerMundo } from './mundo.js';
import { describirMundo, guardarDescripcion, rutaDescripcion } from './texto.js';
import { generarImagen, guardarImagen } from './imagen.js';

async function main() {
    // Paso 0: cargar las variables del archivo .env
    process.loadEnvFile();

    // Paso 1: validar argumentos, crear el mundo y guardarlo
    const mundo = crearMundo(process.argv.slice(2));
    const rutaJson = guardarMundo(mundo);
    console.log(`Paso 1: mundo guardado en ${rutaJson}`);

    // Paso 2: volver a leer el JSON desde el disco
    const mundoLeido = leerMundo(rutaJson);
    console.log(`Paso 2: JSON leído desde el disco (id ${mundoLeido.id})`);

    // Paso 3: pedir la descripción al modelo de texto y guardarla
    const descripcion = await describirMundo(mundoLeido);
    const rutaTxt = guardarDescripcion(mundoLeido, descripcion);
    console.log(`Paso 3: descripción guardada en ${rutaTxt}`);

    // Paso 4: leer la descripción del archivo y generar la imagen
    const descripcionLeida = fs.readFileSync(rutaDescripcion(mundoLeido), 'utf-8');
    const bytes = await generarImagen(descripcionLeida);
    const rutaJpg = guardarImagen(mundoLeido, bytes);
    console.log(`Paso 4: imagen guardada en ${rutaJpg}`);
}

main().catch((error) => {
    console.error('Error:', error.message);
    process.exitCode = 1;
});
