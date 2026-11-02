// texto.js — consulta al modelo de lenguaje (fetch) y devuelve la descripción
import fs from 'node:fs';
import path from 'node:path';

// Paso 1: ruta de la carpeta descripciones/ calculada desde la ubicación del archivo
const RUTA_DESCRIPCIONES = path.join(import.meta.dirname, '..', 'descripciones');

// Paso 2: mensaje de sistema con las reglas del enunciado
const MENSAJE_SISTEMA = `Eres un asistente que escribe descripciones de imágenes para un modelo de generación de imágenes.

Reglas:
- Escribe UN SOLO párrafo en inglés.
- Entre 80 y 120 palabras.
- Describe una imagen: escena, elementos, iluminación, composición y estilo artístico.
- Menciona los 5 colores que aparecen en los datos del usuario (puedes traducirlos al inglés).
- No uses títulos, listas ni formato markdown.
- No cuentes una historia ni describas a una persona concreta.`;

// Paso 3: consulta al servicio de texto y devuelve la descripción limpia
export async function describirMundo(mundo) {
    const respuesta = await fetch(process.env.TEXTO_URL, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TEXTO_API_KEY}`,
        },
        body: JSON.stringify({
        model: process.env.TEXTO_MODELO,
        messages: [
            { role: 'system', content: MENSAJE_SISTEMA },
            { role: 'user', content: JSON.stringify(mundo) },
        ],
        }),
        signal: AbortSignal.timeout(30000),
    });

    // Paso 4: si la respuesta no es correcta, mostramos estado y cuerpo para diagnosticar
    if (!respuesta.ok) {
        const cuerpo = await respuesta.text();
        throw new Error(`El servicio de texto respondió ${respuesta.status}: ${cuerpo}`);
    }

    const datos = await respuesta.json();
    let descripcion = datos?.choices?.[0]?.message?.content;

    // Paso 5: validar que no venga vacía
    if (!descripcion || descripcion.trim() === '') {
        throw new Error('El modelo de texto devolvió una descripción vacía.');
    }

    descripcion = descripcion.trim();

    // Paso 6: recortar si supera los 1500 caracteres (Cloudflare acepta máximo 2048)
    if (descripcion.length > 1500) {
        console.warn('Aviso: la descripción superaba 1500 caracteres y fue recortada.');
        descripcion = descripcion.slice(0, 1500);
    }

    return descripcion;
}

// Paso 7: guarda la descripción en descripciones/mundo_<id>.txt
export function guardarDescripcion(mundo, descripcion) {
    fs.mkdirSync(RUTA_DESCRIPCIONES, { recursive: true });

    const ruta = path.join(RUTA_DESCRIPCIONES, `mundo_${mundo.id}.txt`);
    fs.writeFileSync(ruta, descripcion, 'utf-8');

    return ruta;
}

// Paso 8: devuelve la ruta del .txt de un mundo
export function rutaDescripcion(mundo) {
    return path.join(RUTA_DESCRIPCIONES, `mundo_${mundo.id}.txt`);
}
