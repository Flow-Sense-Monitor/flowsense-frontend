# FlowSense — Frontend

Dashboard React 18 + Vite + Recharts. Fala com o backend somente por HTTP REST (leitura atual a cada 2 s).

Documentação completa no [README da raiz do projeto](../README.md).

## Organização

- `src/services/api.js` — todas as chamadas à API.
- `src/hooks/usePolling.js` — busca periódica.
- `src/context/DataContext.jsx` — dispositivo, leitura atual e estado do servidor, compartilhados entre os componentes.
- `src/components/` — `Cabecalho`, `Avisos` (faixas de alerta/offline), `Card`, `ControleRele`, `Graficos`, `ListaEventos`, `Configuracao`.
- `src/utils/formatacao.js` — formatação e regra de "dispositivo offline".

## Desenvolvimento

```bash
cp .env.example .env
```

```bash
npm install
```

```bash
npm run dev
```

O Vite repassa `/api` para `http://localhost:8080` (ajuste `VITE_PROXY_BACKEND`). Em produção, o `Dockerfile` gera o build e o nginx (`nginx.conf`) serve o site e repassa `/api` ao backend.
