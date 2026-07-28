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
        // Servicio de tarjetas digitales. `jc` es la tarjeta real de JC:
        // es a la vez el destino del QR impreso y el demo vivo que /tarjetas/
        // usa como prueba. Ruta corta a propósito — cada carácter de más
        // densifica el QR y lo hace fallar al imprimirlo a 2 cm.
        tarjetas: "tarjetas/index.html",
        jc: "jc/index.html",
        // Tarjeta del Dr. Angel Inostroza (primer cliente). Ruta corta por la
        // misma razón que /jc: menos caracteres = QR menos denso al imprimir.
        // Renombrable SOLO hasta que su QR se imprima; después es intocable.
        ati: "ati/index.html",
        privacidad: "privacidad/index.html",
        eliminacion: "eliminacion-de-datos/index.html",
        condiciones: "condiciones/index.html",
      },
    },
  },
});
