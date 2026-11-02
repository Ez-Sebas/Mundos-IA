# mundos-ia

Programa de consola en Node.js que recibe una **situación**, un **mundo** y **cinco colores**, y genera un mundo completo en tres archivos: un JSON con los datos, una descripción en inglés y una imagen.

Si repites el mismo comando, reutiliza los archivos ya generados y no vuelve a gastar cuota de las APIs.

## Qué hace el programa

1. Valida los argumentos recibidos y construye un objeto JSON con un `id` de 8 caracteres calculado a partir de los datos.
2. Guarda ese objeto en `data/mundo_<id>.json`.
3. Vuelve a leer el JSON desde el disco y le pide a un modelo de lenguaje una descripción de imagen en inglés, de 80 a 120 palabras, que mencione los cinco colores. La guarda en `descripciones/mundo_<id>.txt`.
4. Lee esa descripción del archivo y le pide a un modelo de imágenes que genere la imagen. Guarda los bytes en `imagenes/mundo_<id>.jpg`.

Antes de cada llamada a una API, el programa revisa si el archivo ya existe. Si existe, lo reutiliza y lo informa en consola.

## Requisitos

- Node.js 20 o superior. El proyecto usa `fetch` nativo, `process.loadEnvFile` e `import.meta.dirname`, que no existen en versiones anteriores.
- Una clave de un servicio de texto.
- Una clave de un servicio de imagen.

## Configuración

### 1. Clonar el repositorio

Clona el repositorio y entra a la carpeta:

```bash
git clone <url-del-repositorio>
cd mundos-ia
```

### 2. Instalar las dependencias

El único paquete externo es `object-hash`:

```bash
npm install
```

### 3. Configurar las variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

En Windows con Git Bash funciona igual. Si usas PowerShell:

```powershell
Copy-Item .env.example .env
```

Edita el archivo `.env` con tus claves reales. Debe quedar así, sin comillas y sin espacios alrededor del signo `=`:

```env
TEXTO_API_KEY=tu_clave_de_texto
TEXTO_URL=https://api.groq.com/openai/v1/chat/completions
TEXTO_MODELO=openai/gpt-oss-20b
IMAGEN_API_KEY=tu_clave_de_imagen
IMAGEN_URL=https://api.cloudflare.com/client/v4/accounts/TU_ACCOUNT_ID/ai/run/@cf/black-forest-labs/flux-1-schnell
```

**Importante:** El archivo `.env` está en `.gitignore` y nunca debe subirse al repositorio. El archivo `.env.example` sí se sube y solo contiene los nombres de las variables.

## Uso

Ejecuta el programa con el siguiente comando:

```bash
npm start -- "situación" "mundo" <color1> <color2> <color3> <color4> <color5>
```

### Ejemplo

```bash
npm start -- "una ciudad flotante" "mundo acuático" rojo azul verde amarillo violeta
```

### Salida esperada

```text
Paso 1: mundo guardado en .../data/mundo_9971138b.json
Paso 2: JSON leído desde el disco (id 9971138b)
Paso 3: descripción guardada en .../descripciones/mundo_9971138b.txt
Paso 4: imagen guardada en .../imagenes/mundo_9971138b.jpg
Listo: el mundo está completo.
```

Si se ejecuta otra vez el mismo comando:

```text
Paso 3: la descripción ya existe, se reutiliza (.../descripciones/mundo_9971138b.txt)
Paso 4: la imagen ya existe, se reutiliza (.../imagenes/mundo_9971138b.jpg)
```

## Validaciones

El programa exige las siguientes condiciones:

- Exactamente 7 argumentos.
- Ningún argumento puede estar vacío ni contener solamente espacios.
- Los 5 colores deben ser distintos, sin importar si están escritos en mayúsculas o minúsculas.

Si algo falla, muestra un mensaje en español con un ejemplo de uso y termina con `process.exitCode = 1`.

## Errores explicados

| Situación | Mensaje que muestra el programa |
|---|---|
| Clave inválida o sin permisos | "La API key no es válida o no tiene permisos. Revisa tu archivo .env." |
| Límite de uso alcanzado | "Superaste el límite gratuito. Espera un momento y vuelve a intentar." |
| Modelo o URL incorrectos | "El modelo o la URL no existen. Revisa tu configuración." |
| Sin conexión a internet | "No se pudo conectar. Revisa tu internet o la URL del servicio." |
| Se acabó el tiempo de espera | "El servicio tardó demasiado en responder. Intenta de nuevo más tarde." |

Las claves nunca se imprimen en consola ni aparecen en los mensajes de error.

## Estructura de carpetas

```text
mundos-ia/
├── src/
│   ├── index.js     # Orquesta los pasos 1 a 4 y traduce los errores
│   ├── mundo.js     # Valida los argumentos, crea el objeto y lo guarda o lee (JSON)
│   ├── texto.js     # Consulta al modelo de lenguaje (fetch)
│   └── imagen.js    # Consulta al modelo de imágenes (fetch) y devuelve los bytes
├── .env             # Tus claves reales (NO va a Git)
├── .env.example     # Mismos nombres de variable, sin claves reales
├── .gitignore
├── package.json
└── README.md
```

### Carpetas que se crean al ejecutar el programa

Estas carpetas son generadas automáticamente y Git las ignora:

```text
data/               # mundo_<id>.json
descripciones/      # mundo_<id>.txt
imagenes/           # mundo_<id>.jpg
```

Las rutas se construyen con:

```javascript
path.join(import.meta.dirname, '..', 'data')
```

Es decir, a partir de la ubicación del archivo y no del directorio desde donde se ejecuta el comando.

## Servicios usados

### Servicio de texto

- **Proveedor:** Groq.
- **Modelo:** `openai/gpt-oss-20b`.
- **Documentación:** https://console.groq.com/docs

### Servicio de imagen

- **Proveedor:** Cloudflare Workers AI.
- **Modelo:** `@cf/black-forest-labs/flux-1-schnell`.
- **Documentación:** https://developers.cloudflare.com/workers-ai/models/

### Compatibilidad con otros servicios de imágenes

`imagen.js` detecta el proveedor mirando la URL de `IMAGEN_URL`, así que el mismo código funciona con tres servicios sin cambiar nada más que el `.env`:

| Servicio | Cómo llega la imagen |
|---|---|
| Cloudflare Workers AI | Base64 dentro de `result.image` |
| NVIDIA FLUX.1-schnell | Base64 dentro de `artifacts[0].base64` |
| Pollinations | Directamente como bytes (`arrayBuffer()`) |

**Nota:** Pollinations no necesita clave, pero tiene un límite de una imagen cada 45 segundos por IP, así que solo sirve para pruebas individuales.

## Cómo se calcula el ID

El `id` son los primeros 8 caracteres del hash de `{ situacion, mundo, colores }`, calculado con `object-hash`.

El campo `creadoEn` no entra en el hash. Si entrara, el `id` cambiaría en cada ejecución y nunca se podrían reutilizar los archivos.

## Ahorro de cuota

Cada llamada a las APIs consume créditos gratuitos. El programa evita repetirlas con `fs.existsSync`.

Si `descripciones/mundo_<id>.txt` o `imagenes/mundo_<id>.jpg` ya existen, no llama al modelo correspondiente y simplemente informa en consola que reutiliza el archivo.

Si un paso falla, los archivos de los pasos anteriores quedan guardados y, al volver a ejecutar el programa, continúa desde donde quedó.

## Publicación y el experimento con .gitignore

El comando:

```bash
npm publish --dry-run
```

Muestra qué archivos se incluirían en el paquete sin publicarlo de verdad.

Como el proyecto no tiene `.npmignore`, npm usa el `.gitignore` para decidir qué excluir.

### Resultado con el .gitignore activo

La lista incluye:

- `src/`
- `README.md`
- `package.json`
- `.env.example`

Y no aparecen:

- `.env`
- `data/`
- `descripciones/`
- `imagenes/`

Este es el resultado correcto.

### Experimento obligatorio

Se renombró `.gitignore` a `.gitignore.off` y se repitió el comando.

Al no existir `.gitignore` ni `.npmignore`, npm dejó de excluir esos archivos y en la lista aparecieron:

- `.env`
- `data/`
- `descripciones/`
- `imagenes/`

### ¿Por qué es peligroso?

El archivo `.env` contiene las claves reales de las APIs. Si se publicara el paquete en esas condiciones, cualquiera podría leerlas, usarlas y agotar la cuota o generar cargos.

Además, el paquete se llenaría de archivos generados que no son parte del código.

Por eso, después del experimento se restauró el nombre original del archivo con:

```bash
mv .gitignore.off .gitignore
```

## Preguntas de reflexión

### 1. ¿Por qué el ID se calcula sin la fecha? ¿Qué pasaría si la incluyeras?

Porque el ID debe depender solo de los datos del mundo. Si incluyera `creadoEn`, cada ejecución produciría un ID distinto, se crearían archivos nuevos cada vez y se perdería la reutilización.

Se gastaría cuota llamando a las APIs por un mundo que ya existe en disco. Los mismos datos deben producir siempre el mismo ID.

### 2. ¿Por qué se le pide al modelo de texto la descripción en inglés?

Porque los modelos de generación de imágenes entienden mejor el inglés y producen resultados más coherentes con la descripción.

Así, el prompt que se envía al modelo de imagen no depende de una traducción automática intermedia.

### 3. ¿Qué diferencia hay entre una respuesta JSON de texto y una respuesta con los bytes de una imagen? ¿Qué es Base64?

La respuesta JSON es texto plano que se puede leer y convertir en objeto con `JSON.parse`.

La imagen es información binaria y no se puede interpretar como texto.

Base64 es una codificación que convierte esos bytes en caracteres ASCII para que puedan viajar dentro de un JSON. Al recibirla, se decodifica con:

```javascript
Buffer.from(texto, 'base64')
```

### 4. ¿Qué pasaría si guardaras la imagen con `utf-8`? ¿Por qué?

El archivo quedaría dañado y no se abriría con ningún visor.

`utf-8` es una codificación de texto: al escribir bytes binarios con ese encoding, Node los reinterpreta como caracteres y altera su contenido.

Por eso se usa:

```javascript
fs.writeFileSync(ruta, bytes)
```

Sin pasar ningún encoding.

### 5. ¿Qué pasos consumen cuota gratuita y cómo evitaste repetirlos?

Los pasos 3 y 4, que llaman al modelo de texto y al modelo de imágenes.

Se evitan con `fs.existsSync`: si el `.txt` o el `.jpg` del mundo ya existen, el programa los reutiliza y solo lo informa en consola.

### 6. Si usaste IA: ¿qué fue lo más difícil de pedirle y qué tuviste que corregir tú?

Lo más difícil fue que respetara las restricciones del taller. Al principio proponía usar `dotenv` y `axios`, que están prohibidos, y también quería leer las claves desde el código.

Hubo que corregir el manejo de Base64, el timeout del servicio de imagen que fallaba con descripciones reales y adaptar la respuesta al formato de cada proveedor cuando el servicio original dejó de responder.