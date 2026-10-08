import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' — относительные пути, чтобы сборка работала на GitHub Pages
// (https://<user>.github.io/level-up-my-life/) без привязки к имени репозитория.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
