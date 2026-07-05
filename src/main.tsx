import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FlagProvider, type IConfig } from '@unleash/proxy-client-react'
import './index.css'
import { App } from './App.tsx'

const config: IConfig = {
  url: `${import.meta.env.VITE_UNLEASH_URL}/api/frontend`,
  clientKey: import.meta.env.VITE_UNLEASH_FRONTEND_TOKEN,
  refreshInterval: 5,
  appName: 'demo-react-app',
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlagProvider config={config}>
      <App />
    </FlagProvider>
  </StrictMode>,
)
