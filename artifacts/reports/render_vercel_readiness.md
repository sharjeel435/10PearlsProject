# Render and Vercel readiness

| Check | Status | Evidence |
|---|---|---|
| Backend tests | PARTIAL | 36 passed, 5 known sklearn 1.5.2/1.9.0 reload failures, 1 skipped locally |
| Frontend typecheck/build/lint/tests | PASS | typecheck and lint clean; 8 tests passed; Next.js production build passed |
| FastAPI routes/health/CORS | PASS | API tests pass; readiness and origin parsing added |
| Model download/cache/reuse/inference | PASS | pinned loader, singleton, configurable cache, one startup three-city inference refresh |
| Model reload/integrity | PARTIAL | SHA-256 passes; local deserialization blocked by incompatible sklearn 1.9.0 |
| Secrets/environment | PASS | examples contain placeholders only; frontend variables are browser-safe |
| Render/Vercel configuration | PASS | blueprint and exact dashboard guides added |
| Large artifact protection | PASS | model/cache patterns ignored |
| Documentation/smoke test | PASS | master guide and credential-free endpoint smoke script added |

Overall: repository configuration is prepared, but release approval is **PARTIAL** until Python 3.12 model reload and the frontend command suite complete successfully.
