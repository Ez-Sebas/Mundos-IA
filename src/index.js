// index.js — orquesta los pasos 1 a 3
import { crearMundo, guardarMundo, leerMundo } from './mundo.js';
import { describirMundo, guardarDescripcion } from './texto.js';

async function main() {
    // Paso 0: cargar las variables del archivo .env
    process.loadEnvFile();

    // Paso 1: validar argumentos, crear el mundo y guardarlo
    const mundo = crearMundo(process.argv.slice(2));
    const rutaJson = guardarMundo(mundo);
    console.log(`Paso 1: mundo guardado en ${rutaJson}`);

    // Paso 2: volver a leer el JSON desde el disco (no reutilizamos el objeto en memoria)
    const mundoLeido = leerMundo(rutaJson);
    console.log(`Paso 2: JSON leído desde el disco (id ${mundoLeido.id})`);

    // Paso 3: pedir la descripción al modelo de texto y guardarla
    const descripcion = await describirMundo(mundoLeido);
    const rutaTxt = guardarDescripcion(mundoLeido, descripcion);
    console.log(`Paso 3: descripción guardada en ${rutaTxt}`);
}

main().catch((error) => {
    console.error('Error:', error.message);
    process.exitCode = 1;
});
