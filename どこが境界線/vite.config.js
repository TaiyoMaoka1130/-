import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 同一Wi-Fi / LAN内のiPadや別PCからアクセス可能にする
    port: 5173,
  },
})

