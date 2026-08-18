# Vercel setup

Import `sharjeel435/10PearlsProject`; set Root Directory to `dashboard-next`, Framework Preset **Next.js**, Install Command `npm ci`, Build Command `npm run build`, and leave Output Directory at the framework default. Node 22 is compatible with the lockfile and Next.js 16.

Set browser-public variables for Development, Preview, and Production:

- `NEXT_PUBLIC_API_BASE_URL=https://<render-service>.onrender.com`
- `NEXT_PUBLIC_SITE_URL=https://<canonical-vercel-domain>` (USER FILLS THIS AFTER FIRST DEPLOY)

Deploy the backend first. After the frontend URL exists, add that exact URL to Render `ALLOWED_ORIGINS`, restart Render, set `NEXT_PUBLIC_SITE_URL`, and redeploy Vercel. For previews, prefer explicit origins; if frequent previews are necessary, use the tightly scoped project/team regex described in the Render guide. Never use wildcard CORS.
