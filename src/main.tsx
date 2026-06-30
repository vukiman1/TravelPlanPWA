import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App.tsx'
import { TripProvider } from '@/store/trip-store'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TripProvider>
        <App />
      </TripProvider>
    </BrowserRouter>
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-line)',
        },
      }}
    />
  </StrictMode>,
)
