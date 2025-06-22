import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ReactLatex1/', // <-- Trailing slash, matches your repo name!
})
