# Post-Launch Checklist

This document outlines the key steps to verify before and immediately after launching Wirebase to production.

## Production Readiness

- **Environment Setup**
  - [ ] Copy `.env.example` to `.env` and fill in production values.
  - [ ] Set `NODE_ENV=production` and configure `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`, `SESSION_SECRET`, and `PORT`.
  - [ ] Install dependencies using `npm ci`.
  - [ ] Ensure the server is running on Node.js v16 or later.

- **Database Migrations**
  - [ ] Run `npm run migrate` to apply all migrations.
  - [ ] Use `migrate:market`, `migrate:streetpass`, `migrate:forum`, and `migrate:wir` if additional tables are required.
  - [ ] Verify connection to the production Supabase instance.
  - [ ] Seed initial data with `npm run seed` if needed.
  - [ ] Enable regular backups.

- **User Authentication**
  - [ ] Test registration and login flows end‑to‑end.
  - [ ] Confirm session cookies are properly configured and secure.
  - [ ] Verify CSRF protection and rate limiting middleware.
  - [ ] Check password reset or account recovery (if configured).

- **Analytics & Monitoring**
  - [ ] Enable analytics tracking.
  - [ ] Configure error logging and alerting.
  - [ ] Ensure memory monitoring and database health checks are active.
  - [ ] Set up uptime and performance monitoring dashboards.

- **Deployment Verification**
  - [ ] Start the server with `NODE_ENV=production npm start`.
  - [ ] Confirm the site is reachable over HTTPS.
  - [ ] Perform manual smoke tests and run automated tests.
  - [ ] Review SEO metadata.

## Future Follow‑Up Tasks

- Expand unit test coverage, especially for monitoring utilities.
- Implement advanced analytics dashboards.
- Add localization and accessibility improvements.
- Automate scaling policies for traffic spikes.

## Known Issues

- Some Jest test suites currently fail (memory monitor, avatar upload, and index routes).
- `scrapyard-item.test.js` fails to parse due to a syntax error.
- Additional forum and marketplace features are still under development.
