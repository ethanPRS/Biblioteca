import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { SpeedInsights } from "@vercel/speed-insights/react"
import './styles/index.css'
import './styles/theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <SpeedInsights />
  </React.StrictMode>,
)
