# PROMPT.md — Cómo construí mundos-ia

## A. Declaración de uso de IA

Usé IA: **sí**. La usé como apoyo durante todo el proceso: para entender los requerimientos del taller,  interpretar errores y revisar que el código cumpliera las restricciones. 

## B. Herramienta y modelo

**Herramienta:** EcoGPT. No conozco la versión exacta del modelo que atendió la conversación.

## C. Prompt inicial

Copiado literal:

> Quiero que me ayudes a realiza un trabajo, la forma en lo que lo vamos a hacer es la siguiente, el trabajo se llama mundos-ia, el cual en la terminal manda unos parámetros, los cuales se guardan en una archivo txt y con la api de una IA gratuita de imágenes con esa descripción crea una imagen y la guarda en una carpeta, en las imágenes adjuntas vas a poder observar todo el contexto del proyecto, porque hay que seguir paso a paso y cumplí con todos los requerimientos requeridos, no puede faltar ninguno. Como son muchas imágenes en este chat no me deja mandar todas, entonces te las enviare por chats, así que solo analiza, que yo te indico cuando empiezas y otras cosa, mientras vamos haciendo, me vas explicando, para así entender que es lo que estas haciendo y poder explicarlo

## D. Prompts siguientes

### Prompt 2 — Elegir el sistema de módulos

**Lo que pedí (literal):**

> Con ESM, sigamos con la parte 2

**Qué respondió:** el código de `src/mundo.js` con las validaciones de los 7 argumentos, la comprobación de colores distintos sin importar mayúsculas, la construcción del objeto con `id`, `situacion`, `mundo`, `colores` y `creadoEn`, el hash de 8 caracteres con `object-hash` excluyendo `creadoEn`, y `guardarMundo` y `leerMundo` con `fs.mkdirSync`, `writeFileSync` y `readFileSync`.

**Qué hice con eso:** lo escribí en el archivo, agregué `"type": "module"` al `package.json` y lo probé con argumentos correctos y con argumentos inválidos para ver los mensajes de error.

### Prompt 3 — Obtener las claves de las APIs

**Lo que pedí (literal):**

> todavía no tengo las apis keys… cómo las consigo

**Qué respondió:** los pasos para crear una cuenta en Groq y generar una clave, la URL y el nombre del modelo `openai/gpt-oss-20b`, y las opciones gratuitas para imágenes (Cloudflare Workers AI, NVIDIA y Pollinations) con sus límites.

**Qué hice con eso:** creé las cuentas, generé las claves y las puse en `.env`. Al principio dejé el texto de ejemplo por descuido y el programa respondió con un `401`, que fue el primer error que tuve que resolver.

### Prompt 4 — Cambiar a Cloudflare

**Lo que pedí (literal):**

> explícame bien sobre cloudflare y me da el código completo de imagen

**Qué respondió:** la explicación del flujo de Workers AI, el `Account ID`, cómo crear un token con permiso *Workers AI: Read*, la URL con el formato `https://api.cloudflare.com/client/v4/accounts/<ID>/ai/run/@cf/black-forest-labs/flux-1-schnell` y el código completo de `src/imagen.js` con la decodificación del base64.

**Qué hice con eso:** reemplacé la parte de NVIDIA, armé el token, puse el `Account ID` en la URL y verifiqué que el `.jpg` se abriera bien en el visor de imágenes.

## E. Cambios que hice yo sobre lo que entregó la IA

1. **Quité `dotenv` y usé `process.loadEnvFile`.** La IA lo propuso al principio, pero el taller solo permite `object-hash` como paquete externo. Lo cambié para no romper esa regla.

2. **Corregí la escritura de la imagen.** En una versión se guardaba con `'utf-8'` y el archivo quedaba dañado. Lo cambié a `fs.writeFileSync(ruta, bytes)` sin encoding, porque la imagen es binaria y no texto.

3. **Cambié el proveedor de imagen y adapté el código.** NVIDIA devolvía `504` con descripciones reales. Lo pasé a Cloudflare y después agregué la detección del proveedor por la URL, para que el mismo código sirviera con los tres servicios.

4. **Ajusté el cálculo del `id`.** Me aseguré de que `creadoEn` no entrara en el hash, porque si entraba el `id` cambiaba en cada ejecución y nunca se reutilizaban los archivos.

## F. Una línea que no entendía al principio

```javascript
const id = hash({ situacion, mundo, colores }).slice(0, 8);
```

Al principio no entendía cómo un objeto se convertía en un texto corto. Ahora lo entiendo así: `object-hash` recibe el objeto y devuelve una cadena larga de caracteres que representa esos datos; `slice(0, 8)` toma solo los primeros 8 para tener un id corto. Es determinista: los mismos datos producen siempre el mismo id, y por eso el objeto va sin `creadoEn`, para que la fecha no cambie el resultado.

## G. Un error y cómo lo resolví

**Error:**

```text
Error: El servicio de texto respondió 401: {"error":{"message":"Invalid API Key","type":"invalid_request_error"}}
```

**Causa:** en `.env` había dejado el texto de ejemplo en lugar de la clave real.

**Cómo lo resolví:** entré a la consola de Groq, generé una clave nueva, la pegué en `.env` sin comillas y sin espacios alrededor del `=`, y volví a ejecutar. También agregué el manejo de ese código en `index.js` para que el programa muestre "La API key no es válida o no tiene permisos. Revisa tu archivo .env." en vez del error técnico.

## Nota sobre el proceso

No usé la plantilla de prompt que sugería el taller. Trabajé con prompts cortos y conversacionales, pidiendo explicación en cada paso. Por eso este documento recoge lo que realmente escribí, sin reescribirlo después.