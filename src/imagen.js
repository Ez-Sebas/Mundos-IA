// imagen.js — consulta al modelo de imágenes (fetch) y devuelve los bytes
import fs from 'node:fs';
import path from 'node:path';

// Paso 1: ruta de la carpeta imagenes/ calculada desde la ubicación del archivo
const RUTA_IMAGENES = path.join(import.meta.dirname, '..', 'imagenes');

// Paso 2: detecta el proveedor según la URL configurada en .env
function detectarProveedor() {
  const url = process.env.IMAGEN_URL || '';

  if (url.includes('pollinations')) return 'pollinations';
  if (url.includes('cloudflare')) return 'cloudflare';
  if (url.includes('nvidia')) return 'nvidia';

  throw new Error('No se reconoce el proveedor de imagen en IMAGEN_URL. Revisa tu .env.');
}

// Paso 3: envía la descripción al servicio y devuelve los bytes de la imagen
export async function generarImagen(descripcion) {
  const proveedor = detectarProveedor();
  console.log(`   Proveedor de imagen: ${proveedor}`);

  if (proveedor === 'pollinations') {
    return await generarConPollinations(descripcion);
  }
  if (proveedor === 'cloudflare') {
    return await generarConCloudflare(descripcion);
  }
  return await generarConNvidia(descripcion);
}

// Paso 4: Pollinations — GET, la descripción va en la URL, bytes directos
async function generarConPollinations(descripcion) {
  const prompt = encodeURIComponent(descripcion.slice(0, 1500));
  const url = `${process.env.IMAGEN_URL}${prompt}?width=1024&height=1024&nologo=true`;

  const respuesta = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(120000),
  });

  await validarRespuesta(respuesta, 'imagen');

  const bytes = Buffer.from(await respuesta.arrayBuffer());
  validarBytes(bytes);

  return bytes;
}

// Paso 5: Cloudflare — POST, la imagen llega en base64 dentro de result.image
async function generarConCloudflare(descripcion) {
  const respuesta = await fetch(process.env.IMAGEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.IMAGEN_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: descripcion.slice(0, 2048),
      steps: 4,
    }),
    signal: AbortSignal.timeout(120000),
  });

  await validarRespuesta(respuesta, 'imagen');

  const datos = await respuesta.json();

  // Cloudflare envuelve todo en { result, success, errors }
  if (datos.success === false) {
    const detalle = datos.errors?.[0]?.message || 'sin detalle';
    throw new Error(`Cloudflare rechazó la petición: ${detalle}`);
  }

  const base64 = datos?.result?.image;

  if (!base64) {
    throw new Error('La respuesta de Cloudflare no trae result.image.');
  }

  const bytes = Buffer.from(base64, 'base64');
  validarBytes(bytes);

  return bytes;
}

// Paso 6: NVIDIA — POST, la imagen llega en base64 dentro de artifacts[0]
async function generarConNvidia(descripcion) {
  const respuesta = await fetch(process.env.IMAGEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.IMAGEN_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: descripcion,
      width: 1024,
      height: 1024,
      steps: 4,
      seed: 0,
    }),
    signal: AbortSignal.timeout(120000),
  });

  await validarRespuesta(respuesta, 'imagen');

  const datos = await respuesta.json();
  const artifact = datos?.artifacts?.[0];

  if (!artifact || !artifact.base64) {
    throw new Error('La respuesta de NVIDIA no trae artifacts[0].base64.');
  }

  if (artifact.finishReason && artifact.finishReason !== 'SUCCESS') {
    throw new Error(`La generación no terminó bien: ${artifact.finishReason}`);
  }

  const bytes = Buffer.from(artifact.base64, 'base64');
  validarBytes(bytes);

  return bytes;
}

// Paso 7: revisa que la respuesta HTTP sea correcta antes de leer el cuerpo
async function validarRespuesta(respuesta, servicio) {
  if (respuesta.ok) return;

  // Algunos errores llegan con cuerpo vacío (por ejemplo un 504)
  let cuerpo = '';
  try {
    cuerpo = await respuesta.text();
  } catch {
    cuerpo = '(sin cuerpo)';
  }

  throw new Error(`El servicio de ${servicio} respondió ${respuesta.status}: ${cuerpo}`);
}

// Paso 8: valida que los bytes no estén vacíos
function validarBytes(bytes) {
  if (!bytes || bytes.length === 0) {
    throw new Error('El servicio devolvió una imagen vacía.');
  }
}

// Paso 9: guarda los bytes en imagenes/mundo_<id>.jpg (sin 'utf-8')
export function guardarImagen(mundo, bytes) {
  fs.mkdirSync(RUTA_IMAGENES, { recursive: true });

  const ruta = path.join(RUTA_IMAGENES, `mundo_${mundo.id}.jpg`);
  fs.writeFileSync(ruta, bytes);

  return ruta;
}

// Paso 10: devuelve la ruta del .jpg de un mundo
export function rutaImagen(mundo) {
  return path.join(RUTA_IMAGENES, `mundo_${mundo.id}.jpg`);
}
