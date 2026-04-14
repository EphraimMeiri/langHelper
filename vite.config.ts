import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './data'),
    },
  },
  server: {
    proxy: {
      '/cal-proxy': {
        target: 'https://cal.huc.edu',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/cal-proxy/, ''),
      },
      '/sedra-proxy': {
        target: 'https://sedra.bethmardutho.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/sedra-proxy/, ''),
      },
    },
  },
})
