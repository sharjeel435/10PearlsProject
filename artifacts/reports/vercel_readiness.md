# Pearls AQI Vercel Readiness

Assessment date: 2026-08-17

| Check | Status | Evidence |
|---|---|---|
| Frontend build | PASS | Next.js 15 production build completed; six routes emitted |
| TypeScript | PASS | `tsc --noEmit` completed with zero errors |
| Lint | PASS | ESLint completed with zero warnings/errors |
| Frontend tests | PASS | Vitest category, formatting, transformation, city and state tests pass |
| FastAPI tests | PASS | Existing Python suite: 20 passed |
| Environment variables | PASS | `.env.example`; API origin and canonical URL documented |
| Secret scan | PASS | No frontend secret values or server secrets exposed |
| Hardcoded localhost URLs | PASS | Localhost appears only in development defaults/documentation |
| Absolute local paths | PASS | No production frontend source contains developer filesystem paths |
| Model artifact size | FAIL for Full Vercel | RF joblib is 474.99 MB before Python dependencies |
| Production inference | PASS via split deployment | Existing FastAPI loads verified RF artifact externally |
| Responsive UI | PASS (code review) | Breakpoints cover mobile, tablet and desktop; no fixed page width |
| Accessibility | PARTIAL | Semantic routes, focus indicators, labels, status text and live states; chart screen-reader depth needs further testing |

## Selected architecture

Split deployment: Next.js on Vercel, FastAPI and the 475 MB production Random Forest bundle on an external ML-capable service. Configure origins through environment variables; no source rewrite is required.

## Required Vercel variables

- `NEXT_PUBLIC_API_BASE_URL`: public HTTPS origin of FastAPI.
- `NEXT_PUBLIC_SITE_URL`: canonical Vercel production URL.

Backend-only `HOPSWORKS_API_KEY` must never be configured as `NEXT_PUBLIC_*`.
