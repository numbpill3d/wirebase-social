# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Wirebase Social Platform

A retro cyber-aesthetic social platform combining medieval dungeon fantasy with Windows 98 web design.

### Key Non-Obvious Patterns

- Database uses Supabase with Knex.js, but migration scripts are specific to certain tables (forum, streetpass, wir)
- Forum categories are stored in database but hardcoded in some places - need to check both
- User profiles use raw HTML/CSS with DOMPurify sanitization - XSS protection is critical
- Streetpass visitor tracking uses both database and session storage
- Scrapyard file uploads go to `/tmp` in production, but use project-relative paths in dev
- WIR transactions require both user balance updates and transaction logging
- CSRF protection enabled in production but disabled during testing
- View caching system requires manual cache clearing after model updates
- Theme switching affects both session and database user preferences

### Environment Setup

- Copy `.env.example` to `.env` with Supabase credentials and session secret
- Database URL optional - falls back to Supabase if not provided
- Seed users created via `node scripts/seed.js` (requires proper env vars)

### Database Migrations

- Forum tables: `npm run migrate:forum`
- Streetpass table: `npm run migrate:streetpass`
- WIR transactions: `npm run migrate:wir`
- Main migrations: `npm run migrate` (runs all)

### Testing

- Jest with jsdom environment for component testing
- Single test: `npm test -- tests/path/to/test.test.js`
- Memory monitoring tests require careful setup
- API route tests use supertest

### Security Notes

- All user-generated HTML/CSS is sanitized with DOMPurify
- Rate limiting applies to API routes, not static assets
- CSRF tokens required for POST requests in production
- File uploads limited to specific types per category
- Trusted IPs bypass rate limiting in production

### Performance

- View caching enabled - clear manually after template changes
- Database connection pooling configured for production
- Static assets cached for 7 days
- Memory monitoring runs automatically in production