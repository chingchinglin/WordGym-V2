import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: '/WordGym-V2/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
