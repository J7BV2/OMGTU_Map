import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite' 


// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin(), tailwindcss()],
    /* before: 
    server: {
        port: 55139,
    }

    Now:
    */
    server: {
        proxy: {
          '/omgtu-api': {
            target: 'https://rasp.omgtu.ru',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/omgtu-api/, '/api'),
          },
        },
    },
})
