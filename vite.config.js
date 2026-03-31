import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                committees: resolve(__dirname, 'committees.html'),
                secretariat: resolve(__dirname, 'secretariat.html'),
                registration: resolve(__dirname, 'registration.html'),
            },
        },
    },
})
