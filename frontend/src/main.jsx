import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import 'antd/dist/reset.css';  // Se vuoi includere il CSS base senza caricare tutto il CSS di Ant Design
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
