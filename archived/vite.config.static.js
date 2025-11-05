// Vite config for static GitHub Pages build
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace with your GitHub repository name
// For GitHub Pages, if repo is username.github.io, use empty string
// Otherwise use the repo name
const repoName = process.env.GITHUB_REPO_NAME || 'Tweetheart';
const basePath = repoName === 'Tweetheart' ? '' : `/${repoName}/`; // Empty for root, or repo name

export default defineConfig({
  plugins: [react()],
  base: basePath, // GitHub Pages base path
  build: {
    outDir: 'dist-static',
    assetsDir: 'assets',
  },
  define: {
    'import.meta.env.VITE_STATIC_MODE': '"true"',
    'import.meta.env.MODE': '"static"',
    'import.meta.env.VITE_API_URL': '"/api"'
  }
})
