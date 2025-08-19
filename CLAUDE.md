# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wirebase is a social media platform that combines medieval dungeon fantasy aesthetics with Windows 98 retro web design. Users can create highly customizable profile pages using raw HTML/CSS, interact through a Streetpass-style system, and share resources through the Scrapyard marketplace.

## Development Commands

### Primary Commands
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint on the codebase

### Database Operations
- `npm run migrate` - Run all migrations
- `npm run migrate:forum` - Create forum tables
- `npm run migrate:streetpass` - Create streetpass table
- `npm run migrate:wir` - Create WIR transactions table
- `npm run seed` - Seed database with sample data

### Testing
- Tests are located in the `tests/` directory
- Jest configuration in `jest.config.js`
- Run specific test: `npm test -- tests/path/to/test.test.js`
- Coverage reports generated in `coverage/` directory

## Architecture Overview

### Backend Structure
- **Entry Point**: `server.js` - Main application server with comprehensive error handling and monitoring
- **Database**: Supabase (PostgreSQL) with Knex.js query builder
- **Authentication**: Passport.js with local strategy and bcrypt password hashing
- **Templating**: Handlebars for server-side rendering
- **Middleware**: Custom security, performance, and error handling middleware

### Key Directories
- `server/models/` - Data models (User, Thread, ScrapyardItem, etc.)
- `server/routes/` - Route handlers organized by feature
- `server/utils/` - Utility functions (database, security, performance monitoring)
- `server/middleware/` - Custom middleware (security, error handling, query timeout)
- `server/views/` - Handlebars templates and layouts
- `public/` - Static assets (CSS, JS, images)
- `scripts/` - Database migrations and utility scripts

### Database Models
Core models include User, Thread, Reply, ScrapyardItem, WIRTransaction, Streetpass, and Visit. Models use Supabase client with proper error handling and caching integration.

### Frontend Architecture
- Vanilla JavaScript with modular component structure
- CSS using custom properties and Windows 98-inspired UI components
- Three.js integration for 3D elements
- Custom widget system for embeddable components

### Security Features
- Content Security Policy (CSP) implementation
- XSS protection with DOMPurify and xss-clean
- CSRF protection using csurf
- Rate limiting with express-rate-limit
- Input validation using Joi
- Secure session handling with express-session

### Performance Optimizations
- View caching system (`server/utils/view-cache.js`)
- Memory monitoring (`server/utils/memory-monitor.js`)
- Database connection pooling and query optimization
- Static asset compression and caching headers
- Database leak detection and monitoring

## Environment Setup

Copy `.env.example` to `.env` and configure:
- Supabase credentials (URL, anon key, service key)
- Session secret for authentication
- Database URL (optional direct PostgreSQL connection)
- File upload limits and image processing settings
- Rate limiting configuration

## Key Features to Understand

### Profile Customization
Users have full control over their profiles using raw HTML/CSS. Profiles are rendered through `server/views/profile/` templates with XSS protection and content sanitization.

### Scrapyard Marketplace
Digital asset sharing system with categories: Widget Graveyard, Template Crypt, Icon Vault, Banner Keep, and GIF Dungeon. Handles file uploads with Sharp for image processing.

### Streetpass System
Nintendo 3DS-inspired visitor tracking system. Users can leave emotes and impressions when visiting profiles, handled through WebSocket-like interactions.

### Forum System
Traditional forum with threads and replies, supporting the platform's retro aesthetic while maintaining modern functionality.

### WIR Economy
Internal token system for marketplace transactions, with full transaction logging and balance management.

## Database Schema Notes

The application uses Supabase with PostgreSQL. Key tables:
- `users` - Core user data with profile customization fields
- `threads` and `replies` - Forum system
- `scrapyard_items` - Marketplace items with file metadata
- `wir_transactions` - Internal economy transactions
- `streetpass_visits` - Profile visit tracking
- `collections` and `purchases` - Marketplace transaction history

## Testing Strategy

- Unit tests for models and utilities
- Route testing with Supertest
- Component testing for client-side JavaScript
- Memory leak detection tests
- Database transaction testing

## Code Style and Conventions

- ESLint configuration enforces consistent code style
- Handlebars templates for server-side rendering
- Modular CSS with custom properties for theming
- Error handling with proper logging through Winston/Pino
- Async/await pattern for database operations
- Comprehensive input validation and sanitization