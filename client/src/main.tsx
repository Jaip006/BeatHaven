import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartContext.tsx'
import { LikedBeatsProvider } from './context/LikedBeatsContext.tsx'
import { DownloadsProvider } from './context/DownloadsContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <LikedBeatsProvider>
        <DownloadsProvider>
          <App />
        </DownloadsProvider>
      </LikedBeatsProvider>
    </CartProvider>
  </StrictMode>,
)
