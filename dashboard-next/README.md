# Pearls AQI Intelligence Console

Next.js dashboard for the Pearls AQI Predictor. It renders directly from the parent project's verified `artifacts/` outputs.

## Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Production

```bash
npm run build
npm start
```

The process working directory must remain `dashboard-next/` so the server can resolve `../artifacts`.
