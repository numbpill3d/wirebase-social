# Project Architecture Rules (Non-Obvious Only)

- Database uses Supabase with Knex.js, but migration scripts are specific to certain tables (forum, streetpass, wir)
- Forum categories are stored in database but hardcoded in some places - need to check both
- User profiles use raw HTML/CSS with DOMPurify sanitization - XSS protection is critical
- Streetpass visitor tracking uses both database and session storage
- Scrapyard file uploads go to `/tmp` in production, but use project-relative paths in dev
- WIR transactions require both user balance updates and transaction logging
- CSRF protection enabled in production but disabled during testing
- View caching system requires manual cache clearing after model updates
- Theme switching affects both session and database user preferences