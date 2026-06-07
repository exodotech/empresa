# Exodo Tech - SPA para Netlify

Single Page Application leve para a Exodo Tech, preparada para deploy nativo na Netlify com captura de leads por Netlify Function.

## Estrutura

```text
exodo-tech/
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   ├── js/i18n.js
│   ├── js/app.js
│   └── assets/favicon.svg
├── netlify/functions/
│   └── send-email.js
├── netlify.toml
└── package.json
```

## O que mudou

- O frontend roda como SPA estática publicada a partir de `frontend/`.
- O Chat com IA foi removido.
- O Blueprint Global é local, sem servidor pesado: identifica nichos por termos semânticos e bloqueia entradas ofensivas, inseguras ou fora de escopo.
- O formulário de contacto alterna entre WhatsApp e E-mail, detecta o país por IP para pré-selecionar o DDI e salva leads no `localStorage` quando o envio falha.
- O envio real é feito pela função `netlify/functions/send-email.js`.

## Variáveis de ambiente na Netlify

Defina pelo painel da Netlify em `Site configuration > Environment variables`.

### SMTP

```text
CONTACT_TO_EMAIL=geral@exodotech.com
MAIL_FROM=no-reply@exodotech.com
SMTP_HOST=smtp.seuprovedor.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=utilizador_smtp
SMTP_PASS=password_smtp
```

### Alternativa Resend

```text
CONTACT_TO_EMAIL=geral@exodotech.com
RESEND_FROM=Exodo Tech <no-reply@exodotech.com>
RESEND_API_KEY=re_xxxxxxxxx
```

Se `RESEND_API_KEY` existir, a função usa Resend. Caso contrário, usa SMTP via `nodemailer`.

## Deploy

1. Suba este repositório para GitHub/GitLab/Bitbucket.
2. Crie um novo site na Netlify apontando para o repositório.
3. A Netlify lê `netlify.toml` automaticamente:
   - publish: `frontend`
   - functions: `netlify/functions`
4. Configure as variáveis de ambiente.
5. Faça deploy.

## Validação local

```bash
npm install
npm run check
```

Para testar a função localmente com o roteamento real da Netlify, use Netlify CLI:

```bash
netlify dev
```

O endpoint usado pelo frontend é:

```text
/.netlify/functions/send-email
```

Também existe o alias:

```text
/api/send-email
```

## Nota sobre o backend antigo

A pasta `backend/` é legado da versão Express/Gemini e não é usada pelo deploy Netlify configurado neste projeto. A arquitetura ativa é SPA estática + Netlify Function.
