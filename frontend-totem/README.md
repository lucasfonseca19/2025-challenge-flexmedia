# Frontend Totem

Interface publica do hospede em kiosk mode.

## Rodando

```bash
npm install
npm run dev
```

URL local: `http://localhost:5173`.

## Build

```bash
npm run build
```

## Contexto

- Stack: React 19, TypeScript, Vite, Tailwind CSS v4.
- API: `/api` proxyado para `http://localhost:8080`.
- Uploads: `/uploads` proxyado para `http://localhost:8080`.
- Biometria: `@vladmandic/human` local no browser.
- Idle customizada: preset do Totem Studio atribuido ao cadastro do totem.

Documentacao detalhada: `../docs/frontend-totem.md`.
