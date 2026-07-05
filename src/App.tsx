import { useFlag, useFlagsStatus } from '@unleash/proxy-client-react'

const FLAG_NAME = 'minha-feature-exemplo'
const CARD = 'max-w-lg mx-auto my-16 p-8 text-center font-sans'
const BTN = 'mt-4 rounded-lg border-none px-6 py-3 text-[1.1rem] text-white cursor-pointer transition-colors duration-200'

function App() {
  const enabled = useFlag(FLAG_NAME)
  const { flagsReady, flagsError } = useFlagsStatus()

  if (!flagsReady) {
    return <div className={CARD}>Carregando flags do Unleash...</div>
  }

  if (flagsError) {
    return <div className={CARD}>Erro ao falar com o Unleash: {String(flagsError)}</div>
  }

  return (
    <div className={CARD}>
      <h1>Demo Unleash + React</h1>
      <p>
        Flag <code>{FLAG_NAME}</code>: <strong>{enabled ? 'ligada' : 'desligada'}</strong>
      </p>

      <button className={`${BTN} ${enabled ? 'bg-violet-700' : 'bg-gray-500'}`}>
        {enabled ? '✨ Botão novo (feature ativa)' : 'Botão antigo'}
      </button>

      <p className="mt-6 text-[0.85rem] text-gray-500">
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
