import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import svgr from 'vite-plugin-svgr';
const __dirname = dirname(fileURLToPath(import.meta.url))


export default defineConfig({
  plugins: [react(), svgr(),],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src/content.js"),
        background: resolve(__dirname, "src/background.js"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
})
