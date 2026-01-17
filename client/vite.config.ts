import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Оптимизация размера бандла
    rollupOptions: {
      output: {
        manualChunks: {
          // Выносим vendor-библиотеки в отдельные чанки
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'clsx'],
          'date-vendor': ['date-fns'],
          'chart-vendor': ['recharts'],
        }
      }
    },
    // Увеличиваем лимит предупреждения
    chunkSizeWarningLimit: 600,
  },
  // Базовый путь для production
  base: './',
})
