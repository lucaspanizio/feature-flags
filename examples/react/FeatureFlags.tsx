// Exemplo de app React (client-side) consumindo a Frontend API do Unleash.
// npm install @unleash/proxy-client-react

import { FlagProvider, useFlag, IConfig } from '@unleash/proxy-client-react';

// Token de FRONTEND (não é o mesmo token usado pelo PHP). Ele é seguro para
// ficar exposto no bundle do navegador: só permite avaliar flags, não lê a
// configuração completa do projeto.
const config: IConfig = {
  url: `${import.meta.env.VITE_UNLEASH_URL ?? 'http://localhost:4242'}/api/frontend`,
  clientKey: import.meta.env.VITE_UNLEASH_FRONTEND_TOKEN ?? 'default:development.unleash-insecure-frontend-api-token',
  refreshInterval: 15,
  appName: 'meu-app-react',
};

export function App() {
  return (
    <FlagProvider config={config}>
      <MinhaFeature />
    </FlagProvider>
  );
}

function MinhaFeature() {
  const habilitada = useFlag('minha-feature-exemplo');
  return <div>{habilitada ? 'Feature habilitada' : 'Feature desabilitada'}</div>;
}
