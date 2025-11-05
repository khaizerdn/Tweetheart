import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './utils/styles/index.css'

// Initialize mock API in static mode (must be imported before other modules)
const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true' || import.meta.env.MODE === 'static';
if (isStaticMode) {
  // Import to trigger global fetch override
  import('./mock/mockApi.js').then(module => {
    if (module.setupFetchOverride) {
      module.setupFetchOverride();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
