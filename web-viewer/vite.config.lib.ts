import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss('./tailwind.lib.config.ts'), autoprefixer()] } },
  build: {
    outDir: 'dist-lib',
    emptyOutDir: true,
    lib: { entry: 'src/renderer/lib.ts', formats: ['es'], fileName: () => 'renderer.js' },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { assetFileNames: 'renderer.[ext]' },
    },
  },
})
