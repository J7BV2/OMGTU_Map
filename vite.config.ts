import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    assetsInclude: ['**/*.glb', '**/*.gltf'], // 👈 Сообщаем Vite, что .glb это ассеты
});