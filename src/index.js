import { crearMundo, guardarMundo, leerMundo } from './mundo.js';

const mundo = crearMundo(process.argv.slice(2));
const ruta = guardarMundo(mundo);
console.log('Guardado en:', ruta);
console.log(leerMundo(ruta));
