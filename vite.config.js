import { defineConfig } from "vite";

// Sitio multipágina: el one-page cósmico + las 2 páginas legales (canónicas
// en alijerik.com, requisito de Meta). URLs limpias vía carpeta/index.html.
export default defineConfig({
  appType: "mpa",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        privacidad: "privacidad/index.html",
        eliminacion: "eliminacion-de-datos/index.html",
      },
    },
  },
});
