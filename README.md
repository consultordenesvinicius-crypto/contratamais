# ContrataMais

Plataforma de atendimento inteligente que integra o OpenAI API com o WhatsApp Cloud API e oferece um painel administrativo para acompanhar conversas, enviar respostas automáticas e registrar o histórico em um banco de dados (arquivo JSON). O projeto foi pensado para ser executado em ambientes simples, como a hospedagem da Hostinger, sem dependências nativas adicionais.

## Recursos principais

- **Integração OpenAI**: geração automática de respostas personalizadas para o contexto da ContrataMais.
- **Integração WhatsApp Cloud API**: envio de mensagens automáticas ou manuais diretamente pelo painel.
- **Webhook do WhatsApp**: recepção de mensagens e atualização do histórico em tempo real.
- **Dashboard administrativo**: interface web responsiva para visualizar conversas, histórico de mensagens e enviar respostas.
- **Banco de dados baseado em arquivo**: armazenamento local em `data/database.json`, fácil de fazer backup ou migrar para outro SGBD futuramente.

## Pré-requisitos

- Node.js 18 ou superior (para utilizar o `fetch` nativo).
- Variáveis de ambiente configuradas:
  - `OPENAI_API_KEY` – chave de API da OpenAI.
  - `OPENAI_MODEL` *(opcional)* – modelo a ser utilizado (padrão `gpt-4o-mini`).
  - `OPENAI_BASE_URL` *(opcional)* – URL para proxies como Azure OpenAI.
  - `WHATSAPP_ACCESS_TOKEN` – token de acesso do WhatsApp Cloud.
  - `WHATSAPP_PHONE_NUMBER_ID` – identificador do número conectado ao WhatsApp Cloud.
  - `WHATSAPP_VERIFY_TOKEN` – token de verificação utilizado no webhook.
  - `PORT` *(opcional)* – porta para executar o servidor (padrão `3000`).

Crie um arquivo `.env` na raiz do projeto se preferir:

```env
OPENAI_API_KEY=coloque_sua_chave_aqui
WHATSAPP_ACCESS_TOKEN=token_meta
WHATSAPP_PHONE_NUMBER_ID=000000000000000
WHATSAPP_VERIFY_TOKEN=token_de_verificacao
```

## Instalação

Como todo o projeto utiliza apenas módulos nativos do Node, não há dependências externas obrigatórias. Basta clonar o repositório (ou enviar os arquivos para o servidor) e executar:

```bash
npm start
```

O servidor ficará disponível em `http://localhost:3000`.

## Estrutura do projeto

```
├── data/
│   └── database.json        # "Banco" de dados em formato JSON
├── public/
│   ├── admin.html           # Painel administrativo
│   ├── app.js               # Lógica do painel (fetch das APIs)
│   └── styles.css           # Estilos do painel
├── src/
│   ├── controllers/
│   │   └── api.js           # Rotas da API e webhook do WhatsApp
│   ├── services/
│   │   ├── openai.js        # Comunicação com a API da OpenAI
│   │   └── whatsapp.js      # Comunicação com o WhatsApp Cloud API
│   ├── utils/
│   │   ├── env.js           # Carregamento simples do arquivo .env
│   │   ├── http.js          # Helpers de parsing e resposta HTTP
│   │   ├── logger.js        # Logger simples com timestamp
│   │   └── static.js        # Servidor de arquivos estáticos
│   ├── database.js          # Repositório em JSON
│   └── server.js            # Servidor HTTP principal
├── package.json
└── README.md
```

## Webhook do WhatsApp

Configure a URL `https://seu-dominio/webhooks/whatsapp` na Meta e utilize o mesmo `WHATSAPP_VERIFY_TOKEN`. O endpoint implementa tanto a verificação por GET quanto o processamento das mensagens recebidas via POST.

## Próximos passos sugeridos

- Migrar o armazenamento para um banco gerenciado (PostgreSQL, MySQL, etc.).
- Adicionar autenticação ao painel administrativo.
- Agendar tarefas (cron) para envio de campanhas ou lembretes.
- Implementar filas de processamento para volumes maiores de mensagens.

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` (adicione se necessário).
