import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({ 
  output: 'server', 
  adapter: node({ mode: "standalone" }), 
  integrations: [react()],
  security: {
    checkOrigin: false
  },
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "src": path.resolve(__dirname, "./src")
      }
    },
    plugins: [tailwindcss()]
  }
});
