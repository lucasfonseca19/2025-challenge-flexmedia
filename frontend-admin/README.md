# Frontend Admin

Painel administrativo do CheckIn Hub.

## Rodando

```bash
npm install
npm run dev
```

URL local: `http://localhost:5174`.

## Build

```bash
npm run build
```

## Contexto

- Stack: React 19, TypeScript, Vite, Tailwind CSS v4.
- API: `/api` proxyado para `http://localhost:8080`.
- Uploads: `/uploads` proxyado para `http://localhost:8080`.
- Auth: JWT salvo em `localStorage`.
- Totem Studio: rota `/conteudo`.

Documentacao detalhada: `../docs/frontend-admin.md`.
