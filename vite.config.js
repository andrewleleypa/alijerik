import { defineConfig } from "vite";

// Sitio multipágina: el one-page cósmico + las 3 páginas legales (canónicas
// en alijerik.com, requisito de Meta). URLs limpias vía carpeta/index.html.
export default defineConfig({
  appType: "mpa",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        eficore: "eficore/index.html",
        eficoreAlternativa: "eficore/alternativa-panamena/index.html",
        eficoreLey81: "eficore/ley-81/index.html",
        // El método del lenguaje visual, publicado. Vive en la RAÍZ y no bajo
        // /eficore/ a propósito: es la metodología de Alijerik, no una feature
        // del producto. Espejo del repo github.com/andrewleleypa/formula-antislop.
        formulaAntislop: "formula-antislop/index.html",
        // Servicio de tarjetas digitales. `jc` es la tarjeta real de JC:
        // es a la vez el destino del QR impreso y el demo vivo que /tarjetas/
        // usa como prueba. Ruta corta a propósito — cada carácter de más
        // densifica el QR y lo hace fallar al imprimirlo a 2 cm.
        tarjetas: "tarjetas/index.html",
        jc: "jc/index.html",
        privacidad: "privacidad/index.html",
        eliminacion: "eliminacion-de-datos/index.html",
        condiciones: "condiciones/index.html",
      },
    },
  },
});
