import { useState } from 'react'
import { useFlag, useFlagsStatus, useUnleashContext } from '@unleash/proxy-client-react'

const FLAG_NAME = 'feature-example'
const VIP_FLAG_NAME = 'vip-email'
const VIP_DOMAIN = '@vip.com'
const CARD = 'flex flex-col items-center justify-center flex-1'
const EXAMPLE = 'relative w-full max-w-lg rounded-lg border border-gray-700 p-6'
const LEGEND = 'px-2 text-xs text-gray-500'

const UNLEASH_URL = import.meta.env.VITE_UNLEASH_URL

export function App() {
  const enabled = useFlag(FLAG_NAME)
  const isVip = useFlag(VIP_FLAG_NAME)
  const { flagsReady, flagsError } = useFlagsStatus()
  const updateContext = useUnleashContext()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void updateContext({ properties: { email } }).then(() => setSubmitted(true))
  }

  if (!flagsReady) {
    return <div className={CARD}>Carregando flags do Unleash...</div>
  }

  if (flagsError) {
    return <div className={CARD}>Erro ao falar com o Unleash: {String(flagsError)}</div>
  }

  return (
    <div className={CARD}>
      <fieldset className={EXAMPLE}>
        <legend className={LEGEND}>{FLAG_NAME}</legend>

        <div className="absolute top-2 right-4 flex items-center gap-2 text-sm">
          <span className={`h-2.5 w-2.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span>{enabled ? 'Ativa' : 'Desativada'}</span>
        </div>

        <button className={`mb-4 rounded-lg border-none px-6 py-3 text-[1.1rem] text-white cursor-pointer transition-colors duration-200 ${enabled ? 'bg-violet-700' : 'bg-gray-500'}`}>
          {enabled ? '✨ Botão novo' : 'Botão antigo'}
        </button>

        <p className="text-[0.85rem] text-gray-500">
          Troque a flag <code>{FLAG_NAME}</code> em{' '}
          <a href={UNLEASH_URL} target="_blank" rel="noreferrer" className="underline underline-offset-3 text-blue-500">
            {UNLEASH_URL}
          </a><br />
          (Feature flags → {FLAG_NAME} → ambiente development)
        </p>
      </fieldset>

      <fieldset className={`${EXAMPLE} mt-8 flex flex-col items-center gap-3`}>
        <legend className={LEGEND}>{VIP_FLAG_NAME}</legend>

        <p className="text-[0.85rem] text-gray-500">
          Digite um e-mail e clique em Enviar <br />(termine com <code>{VIP_DOMAIN}</code> pra ligar a
          flag <code>{VIP_FLAG_NAME}</code>)
        </p>
        <form onSubmit={handleEmailSubmit} className="flex w-full gap-2">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={`voce${VIP_DOMAIN}`}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!email}
            className="shrink-0 rounded-lg border-none bg-gray-700 px-4 py-2 text-sm text-white cursor-pointer transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            Enviar
          </button>
        </form>

        {submitted && (
          <div className={`w-full rounded-lg px-6 py-4 text-center text-white transition-colors duration-200 ${isVip ? 'bg-violet-700' : 'bg-gray-500'}`}>
            {isVip ? `🎉  UI VIP` : 'UI padrão'}
          </div>
        )}
      </fieldset>
    </div>
  )
}
