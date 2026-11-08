import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Build en un seul fichier HTML autonome (pratique pour l'héberger n'importe où
// ou le republier comme artifact Claude).
export default defineConfig({
  plugins: [viteSingleFile()],
});
