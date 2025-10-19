# ContrataMais

Plataforma de atendimento que integra a WhatsApp Cloud API, a OpenAI API e um dashboard web para acompanhar conversas com clientes.

## Visão geral

O projeto está dividido em dois serviços:

- **API (`/api`)** – API REST em Node.js + Express com Prisma/SQLite. Responsável por receber webhooks do WhatsApp, enviar mensagens, gerar respostas com a OpenAI API e expor dados para o dashboard.
- **Web (`/web`)** – Dashboard React + Vite que lista clientes, exibe conversas em tempo real e permite enviar mensagens (manuais ou via IA) diretamente pelo navegador.

Um banco SQLite armazena contatos e mensagens. Docker Compose orquestra os serviços.

## Pré-requisitos

- Docker e Docker Compose (recomendado para desenvolvimento rápido)
- Node.js 20+ e npm 9+ (caso prefira executar localmente)

## Configuração inicial

1. **Copie as variáveis de ambiente**

   ```bash
   cp .env.example .env
   ```

   Preencha os valores das chaves obtidas na Meta (WhatsApp Cloud API) e na OpenAI:

   - `WHATSAPP_TOKEN`: token de acesso do WhatsApp Cloud
   - `WHATSAPP_PHONE_ID`: ID do número configurado no WhatsApp Cloud
   - `WHATSAPP_VERIFY_TOKEN`: token escolhido para validar o webhook
   - `OPENAI_API_KEY`: chave da OpenAI API
   - `OPENAI_MODEL`: modelo utilizado (ex.: `gpt-4o-mini`)

2. **Instale as dependências (opcional fora do Docker)**

   ```bash
   npm install --prefix api
   npm install --prefix web
   ```

3. **Gere o banco com Prisma**

   ```bash
   npx --prefix api prisma migrate dev --name init --schema=../prisma/schema.prisma
   npx --prefix api prisma generate --schema=../prisma/schema.prisma
   ```

## Executando com Docker Compose

```bash
cd /root/tato

# primeira execução (ou após alterar dependências)
docker compose build --no-cache api web
docker compose up -d

# migrações do Prisma
docker compose exec api npx -y prisma migrate dev --name init --schema=/app/prisma/schema.prisma
docker compose exec api npx -y prisma generate --schema=/app/prisma/schema.prisma

# smoke tests
docker compose exec api curl http://localhost:4000/api/health
docker compose exec api curl http://localhost:4000/api/clients

# acompanhar logs
docker logs -f tato-web-1
docker logs -f tato-api-1
```

O dashboard estará disponível em `http://localhost:5173` e a API em `http://localhost:4000`.

## Endpoints principais da API

- `GET /api/health` – healthcheck simples
- `GET /api/clients` – lista contatos com estatísticas básicas
- `GET /api/messages?contactId=<id>` – histórico de mensagens de um contato
- `POST /api/messages` – envia mensagens (com ou sem IA). Corpo esperado:

  ```json
  {
    "contactId": "uuid do contato",
    "message": "texto a ser enviado",
    "useAI": true,
    "context": "contexto opcional para a IA"
  }
  ```

- `GET /api/webhooks/whatsapp` – verificação do webhook da Meta
- `POST /api/webhooks/whatsapp` – recebe notificações de mensagens do WhatsApp Cloud API

## Fluxo das integrações

1. **Webhook do WhatsApp** atualiza/insere o contato, registra a mensagem recebida e exibe no dashboard.
2. **Dashboard Web** consome `GET /api/clients` e `GET /api/messages`, atualizando periodicamente a lista e as conversas.
3. **Envio de mensagens** pode ser manual ou via IA. Quando `useAI=true`, a API chama `POST https://api.openai.com/v1/chat/completions` para gerar a resposta antes de encaminhar via WhatsApp Cloud (`POST /{phoneId}/messages`).
4. **Banco de dados** centraliza os registros e atualiza o `updatedAt` dos contatos para facilitar ordenação.

## Desenvolvimento local sem Docker

```bash
# Terminal 1 – API
cd api
npm install
npm run dev

# Terminal 2 – Web
cd web
npm install
npm run dev
```

Certifique-se de que o arquivo `.env` esteja acessível (raiz do projeto ou dentro de `api/.env`).

## Estrutura de diretórios

```
.
├── api
│   ├── src
│   │   ├── config
│   │   ├── repositories
│   │   ├── routes
│   │   ├── services
│   │   └── utils
│   ├── package.json
│   └── tsconfig.json
├── web
│   ├── src
│   │   ├── hooks
│   │   ├── lib
│   │   └── App.tsx
│   └── package.json
├── prisma
│   └── schema.prisma
├── docker-compose.yml
└── README.md
```

## Próximos passos sugeridos

- Implementar autenticação no dashboard.
- Criar fila/background worker para envio massivo.
- Registrar eventos adicionais do webhook (mensagens de mídia, status etc.).
- Adicionar testes automatizados (unitários e integração).
