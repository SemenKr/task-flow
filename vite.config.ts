import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            '/samurai-api': {
                target: 'https://social-network.samuraijs.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/samurai-api/, '/api/1.1'),
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom', 'react-router'],
                    redux: ['@reduxjs/toolkit', 'react-redux', 'axios'],
                    forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
                    ui: [
                        '@radix-ui/react-checkbox',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-label',
                        '@radix-ui/react-popover',
                        '@radix-ui/react-progress',
                        '@radix-ui/react-scroll-area',
                        '@radix-ui/react-select',
                        '@radix-ui/react-separator',
                        '@radix-ui/react-slot',
                        '@radix-ui/react-switch',
                        '@radix-ui/react-tooltip',
                        'lucide-react',
                        'sonner',
                    ],
                    theme: ['next-themes'],
                },
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
