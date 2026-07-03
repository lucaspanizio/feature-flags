# demo-react-app

App React (Vite) mínimo para ver, na prática, um componente mudando de acordo com uma feature
flag do Unleash rodando em [`../docker-compose.yml`](../docker-compose.yml).

## Rodando

1. Suba o Unleash (na raiz do repo): `docker compose up -d`.
2. Copie `.env.example` para `.env.local` e cole o token de **frontend** que está no `.env` da
   raiz do repo (`INIT_FRONTEND_API_TOKENS`).
3. `npm install && npm run dev` e abra `http://localhost:5173`.

## O que ele mostra

A tela lê a flag `minha-feature-exemplo` ([`src/App.tsx`](src/App.tsx)) via
`@unleash/proxy-client-react` e troca o botão:

- flag ligada → botão roxo "Botão novo (feature ativa)"
- flag desligada → botão cinza "Botão antigo"

Troque a flag pela Admin UI do Unleash (`http://localhost:4242` → Feature flags →
`minha-feature-exemplo` → ambiente `development`) e espere ~5s: o app faz polling
(`refreshInterval: 5` em [`src/main.tsx`](src/main.tsx)) e atualiza sozinho, sem reload.
