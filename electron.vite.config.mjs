import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import ViteMonacoPlugin from 'vite-plugin-monaco-editor-esm'
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true
        }
      }
    },
    plugins: [
      react(),
      ViteMonacoPlugin({
        languageWorkers: ['editorWorkerService', 'json']
      })
    ],
    worker: {
      format: 'es',
      plugins: [],
      rollupOptions: {
        output: {
          format: 'iife'
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          format: 'es'
        }
      }
    }
  }
})
