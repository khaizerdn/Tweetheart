import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This will make the server accessible on the local network
    port: 5173, // Vite default port
    proxy: {
      // Proxy API requests to Docker backend
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      // Proxy Socket.io requests
      '/socket.io': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      }
    }
  }
})
