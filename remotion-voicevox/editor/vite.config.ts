import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    watch: {
      // 音声・画像などの大きなバイナリディレクトリを watch 対象から除外
      ignored: ['**/public/voices/**', '**/public/content/**', '**/public/images/**', '**/public/bgm/**', '**/public/se/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
})
