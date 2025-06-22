import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ReactLatex1-2/', // <-- Add this line (use your repo name)
})
