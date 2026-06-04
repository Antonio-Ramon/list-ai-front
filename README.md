# Lista AI — Frontend

Web app que extrai listas de compras de notas fiscais usando inteligência artificial. O usuário envia uma foto da nota, a IA retorna os itens estruturados, e a lista pode ser copiada com um clique.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Angular 21 (standalone components, signals) |
| UI System | Angular Material v3 — dark theme customizado |
| Tipografia | Space Grotesk (Google Fonts) |
| Ícones | Material Icons (self-hosted via `material-icons`) |
| Estilos | SCSS com design tokens `--la-*` |
| Testes | Vitest |
| Build | Angular CLI / esbuild |

---

## Funcionalidades

- **Upload de imagem** — JPG, PNG ou WEBP até 10 MB; preview thumbnail antes de enviar
- **Extração por IA** — chamada ao backend com loading animado e mensagens de progresso
- **Formato configurável** — `Checklist` ou `Asterisco`
- **Tela de resultado** — lista paginável com nome, quantidade e unidade de cada item
- **Copiar lista** — `navigator.clipboard` com feedback inline; fallback via snackbar
- **Voltar** — retorna ao formulário sem recarregar a página
- **Mobile-first** — viewport mínima de 360 px totalmente funcional

---

## Backend

O frontend consome a API pública do serviço Lista AI:

```
POST https://list-ai-service-production.up.railway.app/extract?format={checklist|asterisk}
Content-Type: multipart/form-data
Campo: image (File)
```

Rate limit: 10 requisições/min por IP. Timeout do cliente: 60 s.

---

## Primeiros passos

### Pré-requisitos

- Node.js ≥ 20.17
- npm ≥ 10

### Instalação

```bash
npm install
```

### Rodar em desenvolvimento

```bash
npm start
# http://localhost:4200
```

### Build de produção

```bash
npm run build
# dist/lista-ai-frontend/
```

### Testes

```bash
npm test
```

---

## Estrutura do projeto

```
src/
├── app/
│   ├── components/
│   │   ├── upload-form/       # Formulário de upload + preview de imagem
│   │   ├── result-card/       # Card de resultados + ações VOLTAR / COPIAR
│   │   └── error-message/     # Mensagens de erro inline (role=alert)
│   ├── services/
│   │   └── extraction.service.ts   # Chamada HTTP ao backend
│   ├── types/
│   │   └── extraction.types.ts     # ExtractionItem, ExtractionFormat, etc.
│   ├── utils/
│   │   └── error-mapper.ts         # Mapeamento de erros da API para strings PT-BR
│   ├── app.ts                 # Máquina de estados principal (signals)
│   ├── app.html
│   └── app.scss
├── environments/
│   └── environment.ts         # URL da API
└── styles.scss                # Design tokens --la-* + tema Material
```

---

## Design System

Tokens visuais definidos em `src/styles.scss` como variáveis CSS `--la-*`.

| Token | Valor | Uso |
|---|---|---|
| `--la-color-bg` | `#1A1A2E` | Fundo da página |
| `--la-color-surface` | `#16213E` | Superfície de containers |
| `--la-color-primary` | `#7C4DFF` | Ação principal (violeta) |
| `--la-color-accent` | `#00E5FF` | Dados / output (cyan) |
| `--la-color-error` | `#FF5252` | Erros inline |
| `--la-gradient-accent` | `violet → cyan` | Accent-bar do topo |
