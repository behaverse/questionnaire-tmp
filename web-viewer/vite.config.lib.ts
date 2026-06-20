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
    lib: {
      entry: { renderer: 'src/renderer/lib.ts', scoring: 'src/scoring/lib.ts' },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { entryFileNames: '[name].js', assetFileNames: 'renderer.[ext]' },
    },
  },
})
