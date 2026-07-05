import { useFlag, useFlagsStatus, useUnleashContext } from '@unleash/proxy-client-react'
import { useState } from 'react'

import { Page } from './components/Page'
import { Example } from './components/Example'
import { StatusDot } from './components/StatusDot'

const FLAG_NAME = 'feature-example'
const VIP_FLAG_NAME = 'vip-email'
const VIP_DOMAIN = '@vip.com'

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
    return <Page>Carregando flags do Unleash...</Page>
  }

  if (flagsError) {
    return <Page>Erro ao falar com o Unleash: {String(flagsError)}</Page>
  }

  return (
    <Page>
      <Example name={FLAG_NAME}>
        <StatusDot active={enabled} />

        <button
          data-active={enabled}
          className="mb-4 rounded-lg border-none bg-gray-500 px-6 py-3 text-[1.1rem] text-white cursor-pointer transition-colors duration-200 data-[active=true]:bg-violet-700"
        >
          {enabled ? '✨ Botão novo' : 'Botão antigo'}
        </button>

        <p className="text-[0.85rem] text-gray-500">
          Troque a flag <code>{FLAG_NAME}</code> em{' '}
          <a href={UNLEASH_URL} target="_blank" rel="noreferrer" className="underline underline-offset-3 text-blue-500">
            {UNLEASH_URL}
          </a><br />
          (Feature flags → {FLAG_NAME} → ambiente development)
        </p>
      </Example>

      <Example name={VIP_FLAG_NAME} className="mt-8 flex flex-col items-center gap-3">
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
          <div
            data-active={isVip}
            className="w-full rounded-lg bg-gray-500 px-6 py-4 text-center text-white transition-colors duration-200 data-[active=true]:bg-violet-700"
          >
            {isVip ? `🎉  UI VIP` : 'UI padrão'}
          </div>
        )}
      </Example>
    </Page>
  )
}
