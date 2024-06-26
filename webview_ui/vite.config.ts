import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
    esbuild: {
      pure: mode === 'production' ? ['console.log'] : [],
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`
        }
      },
      chunkSizeWarningLimit: 1024,
      sourcemap: true, // TODO: 区分生产和开发
    },
  }
})
