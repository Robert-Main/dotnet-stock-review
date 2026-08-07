# StockReview Frontend

Next.js (App Router) + TypeScript + Tailwind CSS UI for the StockReview .NET API.

## Getting started

1. **Run the API** (the .NET backend) with the **`http`** profile so it listens on
   `http://localhost:5276`:

   ```bash
   cd ../StockReview
   dotnet run --launch-profile http
   ```

   > The CORS policy allows `http://localhost:3000`. If you use the `https`
   > profile instead, the API redirects HTTP → HTTPS and CORS headers are lost
   > on the redirect, so keep the `http` profile for local dev.

2. **Install and run the frontend**:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000), register an account,
   and sign in.

## Configuration

| Variable                | Default                    | Purpose                     |
| ----------------------- | -------------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`   | `http://localhost:5276`    | Base URL of the .NET API    |

Create a `.env.local` to override the defaults (see `.env.local`).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint

## Notes

- Auth: JWT is stored in `localStorage` (`stockreview_token`) and attached as a
  `Bearer` header by `src/lib/api.ts`. A 401 anywhere in the app clears the
  session and redirects to `/login`.
- API responses are PascalCase (Newtonsoft serialization) — see `src/lib/types.ts`.
- The search box filters by **symbol** only (the API ANDs `Symbol` and
  `CompanyName`, so passing both breaks company-name search).
