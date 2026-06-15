import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { StoreProvider } from './store/store'
import { BetModalProvider } from './components/BetModal'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <BetModalProvider>
        <App />
      </BetModalProvider>
    </StoreProvider>
  </StrictMode>,
)
