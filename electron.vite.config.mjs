import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

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
        plugins: [react()]
    },
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                settings: resolve(__dirname, 'settings.html') // ✅ 添加 settings 页面
            }
        }
    }
})
