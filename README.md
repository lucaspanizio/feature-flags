# feature-flags

POC para entender na prática como funcionaria um serviço self-hosted de feature flags:
[Unleash](https://www.getunleash.io/) (open-source) + PostgreSQL, com uma app de demonstração em
React que liga/desliga uma feature em tempo real através da Admin UI do Unleash.

## Tecnologias

- **[Unleash](https://www.getunleash.io/)** — servidor de feature flags (Admin UI + API).
- **PostgreSQL 15** — armazenamento das flags, via Docker Compose.
- **React 19 + Vite + TypeScript** — app de demonstração.
- **Tailwind CSS v4** — estilos da app.
- **[@unleash/proxy-client-react](https://www.npmjs.com/package/@unleash/proxy-client-react)** — SDK que consome a Frontend API do Unleash direto do browser.

## Pré-requisitos

- Node.js 20+ e Yarn (para a app React)
- Algo para rodar o Unleash + Postgres localmente: o `docker-compose.yml` na raiz cobre isso, mas
  não há Dockerfile/compose para a própria app React — ela roda direto com Vite. No Windows, o mais
  simples é ter Docker Engine dentro do WSL2 (sem precisar de Docker Desktop).

## Como rodar

1. Suba o Unleash e o Postgres:

   ```bash
   cp .env.example .env
   # edite o .env: troque DATABASE_PASSWORD e UNLEASH_ADMIN_PASSWORD. Os tokens de exemplo já
   # servem para dev local (VITE_UNLEASH_FRONTEND_TOKEN já vem igual ao INIT_FRONTEND_API_TOKENS).
   # Atenção: essas senhas ficam gravadas no volume do Postgres na PRIMEIRA subida. Trocar no .env
   # depois não tem efeito — veja "Solução de problemas".

   docker compose up -d
   docker compose logs -f unleash   # acompanhar até o healthcheck passar
   ```

   Acesse `http://localhost:4242`, faça login com `UNLEASH_ADMIN_USERNAME` / `UNLEASH_ADMIN_PASSWORD`
   definidos no `.env` e troque a senha pela própria UI no primeiro acesso.

   O serviço `flag-seed` já cria as flags `feature-example` (desligada) e `vip-email` (com a
   estratégia/constraint já configurada) nessa subida — não precisa criá-las manualmente na Admin
   UI. Se precisar recriá-las (ex.: depois de apagar o volume do Postgres) sem reiniciar tudo, rode
   `yarn seed`.

2. Suba a app React:

   ```bash
   yarn install
   yarn dev
   ```

   Abra `http://localhost:5173`. A porta é fixa: se estiver ocupada, o Vite falha em vez de subir em
   outra (o CORS só libera as origens de `UNLEASH_FRONTEND_API_ORIGINS`). Libere a 5173 ou use
   `yarn dev --port 5174` (já liberada no `.env.example`; outras portas precisam ser adicionadas lá).

A tela ([`src/App.tsx`](src/App.tsx)) demonstra dois jeitos de usar o Unleash via
`@unleash/proxy-client-react`:

- **Toggle simples** — a flag `feature-example` troca o botão (cinza → roxo). Troque-a pela
  Admin UI (`http://localhost:4242` → Feature flags → `feature-example` → ambiente
  `development`) e espere ~5s — o app faz polling (`refreshInterval: 5` em
  [`src/main.tsx`](src/main.tsx)) e atualiza sozinho, sem reload.
- **Segmentação por context** — a flag `vip-email` só liga para quem tem `properties.email`
  terminado em `@vip.com` (constraint configurada pelo `flag-seed`). Digite um e-mail no campo da
  tela (ex.: `a@vip.com`): o app chama `useUnleashContext()` pra atualizar o context do SDK e a UI
  muda com base na resposta do Unleash pra aquele e-mail.

### Rodando via WSL2 (sem Docker Desktop)

Se o Docker estiver instalado direto dentro de uma distro WSL2 (Docker Engine, sem Docker Desktop):

- Seu usuário precisa estar no grupo `docker` para rodar `docker`/`docker compose` sem `sudo`
  (`sudo usermod -aG docker $USER`, depois abra um novo terminal para o grupo valer).
- O WSL2 desliga a VM automaticamente após alguns minutos sem terminal aberto, o que derruba o
  Postgres e o Unleash. Mantenha um terminal WSL aberto ou configure `vmIdleTimeout=-1` em
  `%UserProfile%\.wslconfig` (seção `[wsl2]`).
- O `localhost` do Windows pode não alcançar portas publicadas dentro do WSL2 (o navegador mostra
  `ERR_CONNECTION_REFUSED` em `http://localhost:4242`, mesmo com o Unleash saudável). Para resolver,
  use rede espelhada no `%UserProfile%\.wslconfig` e rode `wsl --shutdown`:

  ```ini
  [wsl2]
  networkingMode=mirrored
  vmIdleTimeout=-1
  ```

  Alternativa sem mexer no WSL: use o IP da distro (`wsl hostname -I`) no lugar de `localhost`,
  tanto no navegador quanto em `VITE_UNLEASH_URL` (e reinicie o `yarn dev`). Esse IP muda quando a
  VM reinicia.

## Solução de problemas

| Sintoma | Causa | Correção |
|---|---|---|
| `password authentication failed for user "unleash_user"` nos logs do Unleash (container reiniciando, `unhealthy`) | O volume do Postgres já existia e guarda a senha da primeira subida, diferente do `DATABASE_PASSWORD` atual do `.env`. | Recupere a senha antiga no `.env`, ou, **perdendo os dados**, recrie o banco: `docker compose down -v && docker compose up -d`. |
| Login no Admin UI retorna 401 / `flag-seed` sai com `ERRO: login no Unleash ... falhou` | Unleash fora do ar, ou a `UNLEASH_ADMIN_PASSWORD` do `.env` não é a senha atual do admin (ela só é aplicada na criação do admin; se você trocou a senha pela UI, vale a nova). Também acontece se o `.env` tiver CRLF/BOM e você carregá-lo com `source` à mão (o `\r` vira parte da senha; o `yarn seed` já limpa isso). | Confira `docker compose ps`; use a senha atual do admin; em último caso, `docker compose down -v` (perde os dados) e suba de novo. Depois `yarn seed`. |
| `ERR_CONNECTION_REFUSED` em `localhost:4242` (Docker no WSL2) | Encaminhamento de `localhost` do WSL2 não está funcionando. | Veja "Rodando via WSL2" acima. |
| `Port 5173 is already in use` ao rodar `yarn dev` | Outro dev server ocupa a 5173. | Pare o outro processo ou use `yarn dev --port 5174`. |
| Erro de CORS ou `401` na chamada a `/api/frontend` | Origem fora de `UNLEASH_FRONTEND_API_ORIGINS`, ou `VITE_UNLEASH_FRONTEND_TOKEN` diferente do `INIT_FRONTEND_API_TOKENS`. | Ajuste o `.env`, rode `docker compose up -d` (recria o Unleash se mudou a origem) e reinicie o `yarn dev` (o Vite só lê o `.env` ao iniciar). |
| A tela não mostra a flag `vip-email` | O `flag-seed` falhou (veja `docker compose logs flag-seed`). | Corrija a causa (geralmente a senha do admin) e rode `yarn seed`. |

## Tokens de API

O Unleash tem dois tipos de token de API:

| Tipo | Uso |
|---|---|
| **Backend/Client** (`INIT_BACKEND_API_TOKENS`) | SDKs server-side — tem acesso de leitura completo à configuração das flags. |
| **Frontend** (`INIT_FRONTEND_API_TOKENS`) | Clientes não confiáveis (browser, executáveis distribuídos) — só avalia flags para um contexto. |

Os tokens `INIT_*` no `.env` só são aplicados na **primeira inicialização do banco** — se o volume
do Postgres já existia antes de você definir/alterar um desses valores, ele não tem efeito
retroativo (só um `docker compose down -v` recria do zero). Para qualquer ambiente além do
desenvolvimento local, crie tokens definitivos em **Admin UI → Settings → API access**.

O `flag-seed` (`scripts/seed-flag.sh`) não usa um token — ele autentica na Admin API fazendo login
com `UNLEASH_ADMIN_USERNAME`/`UNLEASH_ADMIN_PASSWORD`, porque esse login sempre funciona,
independente de quando o volume do Postgres foi criado.

## Antes de expor fora da sua máquina/rede local

- [ ] Trocar `DATABASE_PASSWORD` e `UNLEASH_ADMIN_PASSWORD` no `.env`.
- [ ] Gerar tokens reais pela Admin UI e parar de depender dos tokens `INIT_*` de bootstrap.
- [ ] Colocar o Unleash atrás de um reverse proxy com HTTPS (nginx, Traefik, Caddy).
- [ ] Restringir `UNLEASH_FRONTEND_API_ORIGINS` às origens reais da app (evitar `*`).
- [ ] Configurar backup do volume `unleash_db_data` (ou do Postgres via `pg_dump`).
