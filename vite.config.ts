import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Relative base: the same build works at https://jthrilly.github.io/k53/ and in any sub-folder.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', assetsDir: 'assets', chunkSizeWarningLimit: 900 },
});
