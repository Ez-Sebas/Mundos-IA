// index.js — orquesta los pasos 1 a 4 con manejo de errores y ahorro de cuota
import fs from 'node:fs';
import { crearMundo, guardarMundo, leerMundo } from './mundo.js';
import { describirMundo, guardarDescripcion, rutaDescripcion } from './texto.js';
import { generarImagen, guardarImagen, rutaImagen } from './imagen.js';

// Paso 1: traduce un error técnico a un mensaje claro en español
function explicarError(error) {
    // Timeout: el fetch se cortó por AbortSignal.timeout
    if (error.name === 'TimeoutError') {
        return 'El servicio tardó demasiado en responder. Intenta de nuevo más tarde.';
    }

    // Sin conexión: fetch lanza TypeError cuando no hay red o la URL está mal
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return 'No se pudo conectar. Revisa tu internet o la URL del servicio.';
    }

    // Errores HTTP: el mensaje trae el código al inicio
    const codigo = Number(error.message.match(/respondió (\d{3})/)?.[1]);

    if (codigo === 401 || codigo === 403) {
        return 'La API key no es válida o no tiene permisos. Revisa tu archivo .env.';
    }
    if (codigo === 402 || codigo === 429) {
        return 'Superaste el límite gratuito. Espera un momento y vuelve a intentar.';
    }
    if (codigo === 404 || codigo === 410) {
        return 'El modelo o la URL no existen. Revisa tu configuración.';
    }

    return error.message;
}

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

    // Paso 3: si el .txt ya existe, no llamamos al modelo de texto
    const rutaTxt = rutaDescripcion(mundoLeido);

    if (fs.existsSync(rutaTxt)) {
        console.log(`Paso 3: la descripción ya existe, se reutiliza (${rutaTxt})`);
    } else {
        const descripcion = await describirMundo(mundoLeido);
        guardarDescripcion(mundoLeido, descripcion);
        console.log(`Paso 3: descripción guardada en ${rutaTxt}`);
    }

    // Paso 4: si el .jpg ya existe, no llamamos al modelo de imágenes
    const rutaJpg = rutaImagen(mundoLeido);

    if (fs.existsSync(rutaJpg)) {
        console.log(`Paso 4: la imagen ya existe, se reutiliza (${rutaJpg})`);
    } else {
        const descripcionLeida = fs.readFileSync(rutaTxt, 'utf-8');
        const bytes = await generarImagen(descripcionLeida);
        guardarImagen(mundoLeido, bytes);
        console.log(`Paso 4: imagen guardada en ${rutaJpg}`);
    }

    console.log('Listo: el mundo está completo.');
}

main().catch((error) => {
    console.error(`Error: ${explicarError(error)}`);
    process.exitCode = 1;
});
