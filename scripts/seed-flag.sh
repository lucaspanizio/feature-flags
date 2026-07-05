#!/bin/sh
# Cria as flags de exemplo usadas pela demo React (src/App.tsx), caso ainda não existam:
# - feature-example: toggle simples on/off.
# - vip-email: só liga para context.properties.email terminado em @vip.com.
# Chamado automaticamente pelo serviço "flag-seed" no docker compose up; também pode ser rodado
# manualmente (ex.: depois de resetar o volume do Postgres) com `yarn seed`.
#
# Autentica com login de usuário (não com INIT_ADMIN_API_TOKENS): esse token só é criado na
# primeira inicialização do banco, então não funciona se o volume do Postgres já existia antes
# dele ser adicionado ao .env. Login com usuário/senha do admin sempre funciona.
set -eu

cd "$(dirname "$0")/.." 2>/dev/null || true
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

UNLEASH_URL="${UNLEASH_URL:-http://localhost:4242}"
ADMIN_USERNAME="${UNLEASH_ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${UNLEASH_ADMIN_PASSWORD:-admin}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

curl -sf -c "$COOKIE_JAR" -X POST "$UNLEASH_URL/auth/simple/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" \
  > /dev/null

create_feature() {
  name="$1"
  description="$2"
  curl -sf -b "$COOKIE_JAR" -X POST "$UNLEASH_URL/api/admin/projects/default/features" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"type\":\"release\",\"description\":\"$description\"}" \
    && echo "flag $name criada" \
    || echo "flag $name já existe, seguindo em frente"
}

create_feature "feature-example" "Flag de exemplo usada pela demo React (src/App.tsx)"
create_feature "vip-email" "So liga para context.properties.email terminado em @vip.com (src/App.tsx)"

# Estratégia com constraint: só ativa quando o email do context termina em @vip.com.
# O POST de estratégia não é idempotente (cria uma nova a cada chamada), então checa antes se já
# existe uma estratégia com essa constraint pra não duplicar a cada `docker compose up`.
FEATURE_JSON="$(curl -sf -b "$COOKIE_JAR" "$UNLEASH_URL/api/admin/projects/default/features/vip-email")"
if echo "$FEATURE_JSON" | grep -q '"contextName":"email"'; then
  echo "estratégia da flag vip-email já existe, seguindo em frente"
else
  curl -sf -b "$COOKIE_JAR" -X POST "$UNLEASH_URL/api/admin/projects/default/features/vip-email/environments/development/strategies" \
    -H "Content-Type: application/json" \
    -d '{"name":"default","constraints":[{"contextName":"email","operator":"STR_ENDS_WITH","values":["@vip.com"],"caseInsensitive":true}]}' \
    && echo "estratégia da flag vip-email criada"
fi

# Habilita a flag no ambiente development (sem isso, nenhuma estratégia é avaliada).
curl -sf -b "$COOKIE_JAR" -X POST "$UNLEASH_URL/api/admin/projects/default/features/vip-email/environments/development/on" \
  && echo "flag vip-email ligada no ambiente development"
