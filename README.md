# future-flags

Serviço self-hosted de feature flags usando [Unleash](https://www.getunleash.io/) (open-source) +
PostgreSQL, via Docker Compose. Serve como backend de feature flags para aplicações PHP, React e
módulos desktop em Delphi.

## Arquitetura

- **`unleash`**: servidor Unleash (imagem oficial `unleashorg/unleash-server`), expõe:
  - Admin UI / Admin API (porta `4242`) — gestão de flags, projetos, tokens.
  - Client API (`/api/client/*`) — para SDKs *server-side* (ex.: PHP), usando um **token de backend**.
  - Frontend API (`/api/frontend`) — para clientes *não confiáveis* que rodam fora do seu servidor
    (browser React, executáveis Delphi distribuídos), usando um **token de frontend**.
- **`db`**: PostgreSQL 15, dados persistidos em volume nomeado `unleash_db_data`, sem porta exposta
  ao host (só acessível pela rede interna do compose).

## Subindo o serviço

```bash
cp .env.example .env
# edite o .env: troque DATABASE_PASSWORD, UNLEASH_ADMIN_PASSWORD e os tokens INIT_*

docker compose up -d
docker compose logs -f unleash   # acompanhar até o healthcheck passar
```

### Rodando via WSL2 (sem Docker Desktop)

Se o Docker estiver instalado direto dentro de uma distro WSL2 (Docker Engine, sem Docker Desktop):

- Seu usuário precisa estar no grupo `docker` para rodar `docker`/`docker compose` sem `sudo`
  (`sudo usermod -aG docker $USER`, depois abra um novo terminal para o grupo valer).
- Por padrão o WSL2 desliga a VM automaticamente depois de alguns minutos sem nenhum terminal
  WSL aberto — isso derruba o Postgres e o Unleash junto. Mantenha um terminal WSL aberto enquanto
  usa o serviço, ou configure `vmIdleTimeout=-1` em `%UserProfile%\.wslconfig` (seção `[wsl2]`) se
  quiser que ele fique sempre no ar independente de terminal aberto.

Acesse `http://localhost:4242`, faça login com `UNLEASH_ADMIN_USERNAME` / `UNLEASH_ADMIN_PASSWORD`
definidos no `.env` e troque a senha pela própria UI no primeiro acesso.

## Tokens de API

O Unleash tem dois tipos de token, e a escolha entre eles é a parte que garante a compatibilidade
segura entre os três tipos de cliente pedidos:

| Tipo de token | Onde usar | Por quê |
|---|---|---|
| **Backend/Client** (`INIT_BACKEND_API_TOKENS`) | App PHP (server-side) | Roda no seu servidor, então pode guardar um segredo com acesso de leitura completo à configuração das flags. |
| **Frontend** (`INIT_FRONTEND_API_TOKENS`) | App React (browser) e módulos Delphi (executável distribuído) | Esses ambientes são "não confiáveis" (o código roda na máquina do usuário e pode ser inspecionado/decompilado). O token de frontend só permite avaliar flags para um contexto, nunca ler a configuração completa. |

Os tokens definidos em `INIT_BACKEND_API_TOKENS` / `INIT_FRONTEND_API_TOKENS` no `.env` só são
aplicados na **primeira inicialização do banco**. Para qualquer ambiente além do seu desenvolvimento
local, crie tokens definitivos em **Admin UI → Settings → API access** e use-os nas aplicações em
vez dos tokens de bootstrap.

## Demo funcionando

[`demo-react-app/`](demo-react-app/) é um app React (Vite) rodando de verdade contra este Unleash:
um botão muda de cinza para roxo conforme a flag `minha-feature-exemplo` é ligada/desligada pela
Admin UI, sem reload da página. Ver [`demo-react-app/README.md`](demo-react-app/README.md).

## Integração por stack

Exemplos completos estão em [`examples/`](examples/).

### PHP (server-side) — [`examples/php`](examples/php)

SDK oficial [`unleash/client`](https://packagist.org/packages/unleash/client) (requer uma
implementação PSR-18 de HTTP client, ex. Guzzle, e uma implementação PSR-16 de cache):

```bash
composer require unleash/client guzzlehttp/guzzle symfony/cache
```

```php
$unleash = UnleashBuilder::create()
    ->withAppUrl('http://localhost:4242/api')
    ->withAppName('meu-app-php')
    ->withHeader('Authorization', '<TOKEN_DE_BACKEND>')
    ->withCacheHandler(new Psr16Cache(new FilesystemAdapter()))
    ->build();

$unleash->isEnabled('minha-feature-exemplo');
```

### React (browser) — [`examples/react`](examples/react)

SDK oficial [`@unleash/proxy-client-react`](https://www.npmjs.com/package/@unleash/proxy-client-react),
fala direto com a Frontend API embutida no servidor (não precisa mais do container
`unleash-proxy` separado):

```bash
npm install @unleash/proxy-client-react
```

```tsx
const config = {
  url: 'http://localhost:4242/api/frontend',
  clientKey: '<TOKEN_DE_FRONTEND>',
  appName: 'meu-app-react',
};
```

Lembre de incluir a origem do app React em `UNLEASH_FRONTEND_API_ORIGINS` no `.env` (CORS).

### Delphi (desktop) — [`examples/delphi`](examples/delphi)

Não existe SDK oficial para Delphi. [`UnleashClient.pas`](examples/delphi/UnleashClient.pas) é um
cliente mínimo que chama a Frontend API diretamente via `System.Net.HttpClient`:

```
GET {UNLEASH_URL}/api/frontend
Authorization: <TOKEN_DE_FRONTEND>
```

```pascal
var
  Flags: TUnleashClient;
begin
  Flags := TUnleashClient.Create('http://localhost:4242', '<TOKEN_DE_FRONTEND>');
  if Flags.IsEnabled('minha-feature-exemplo') then
    ShowMessage('Feature habilitada');
end;
```

Em produção, chame `Refresh` periodicamente (ex.: `TTimer` a cada 30–60s) em vez de só na criação,
para captar mudanças de flags sem reiniciar o app.

## Checklist antes de expor fora da sua máquina/rede local

- [ ] Trocar `DATABASE_PASSWORD` e `UNLEASH_ADMIN_PASSWORD` no `.env`.
- [ ] Gerar tokens reais pela Admin UI e parar de depender dos tokens `INIT_*` de bootstrap.
- [ ] Colocar o Unleash atrás de um reverse proxy com HTTPS (nginx, Traefik, Caddy).
- [ ] Restringir `UNLEASH_FRONTEND_API_ORIGINS` às origens reais do app React (evitar `*`).
- [ ] Configurar backup do volume `unleash_db_data` (ou do Postgres via `pg_dump`).
- [ ] Manter a porta do Postgres sem publicação no host (já é o padrão neste `docker-compose.yml`).
