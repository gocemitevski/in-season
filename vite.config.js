import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the same build works at a domain root or a GitHub
  // Pages project subpath (https://user.github.io/repo/).
  base: './',
  plugins: [react(), tailwindcss()],
})
