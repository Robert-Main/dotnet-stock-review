# StockReview — running the app

Two processes are needed: the .NET API and the Next.js frontend.

## Backend API (port 5276)

```bash
cd StockReview
dotnet run --no-build --urls http://localhost:5276
```

The API uses `appsettings.Development.json` for the SQLite connection and FMP config. No artifacts beyond normal `dotnet build` output are required.

## Frontend (port 3000)

```bash
cd frontend
npm run dev
```

Requires `node_modules` (install with `npm install`). The API base URL is `http://localhost:5276`, sourced from `NEXT_PUBLIC_API_URL` in `frontend/.env.local` if present, else the default in `src/lib/api.ts`.

## Smoke test

- `GET http://localhost:5276/api/stock` should return 401 (auth required) — proves the API is up.
- `GET http://localhost:3000/login` should return the login page — proves the frontend is up.
