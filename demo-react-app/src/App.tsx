import { useFlag, useFlagsStatus } from '@unleash/proxy-client-react'
import './App.css'

const FLAG_NAME = 'minha-feature-exemplo'

function App() {
  const enabled = useFlag(FLAG_NAME)
  const { flagsReady, flagsError } = useFlagsStatus()

  if (!flagsReady) {
    return <div className="card">Carregando flags do Unleash...</div>
  }

  if (flagsError) {
    return <div className="card">Erro ao falar com o Unleash: {String(flagsError)}</div>
  }

  return (
    <div className="card">
      <h1>Demo Unleash + React</h1>
      <p>
        Flag <code>{FLAG_NAME}</code>: <strong>{enabled ? 'ligada' : 'desligada'}</strong>
      </p>

      <button className={(enabled ? 'btn btn-new' : 'btn btn-old')}>
        {enabled ? '✨ Botão novo (feature ativa)' : 'Botão antigo'}
      </button>

      <p className="hint">
        Troque a flag <code>{FLAG_NAME}</code> em{' '}
        <a href="http://localhost:4242" target="_blank" rel="noreferrer">
          http://localhost:4242
        </a>{' '}
        (Feature flags → {FLAG_NAME} → ambiente development) e espere até 5s — o botão muda sozinho,
        sem reiniciar a página.
      </p>
    </div>
  )
}

export default App
