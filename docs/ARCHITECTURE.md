# Wirebase Architecture Documentation

## Overview

Wirebase is a social media platform that combines medieval dungeon fantasy aesthetics with Windows 98 retro web design. The application is built using Node.js, Express, and Supabase for data storage.

## System Architecture

### Backend

- **Node.js/Express**: The main application server
- **Supabase**: PostgreSQL database with real-time capabilities
- **Passport.js**: Authentication middleware
- **Handlebars**: Server-side templating

### Frontend

- **Vanilla JavaScript**: Core client-side functionality
- **CSS3**: Styling with custom properties and responsive design
- **Windows 98 UI**: Custom implementation of Windows 98-style UI components
- **Medieval Fantasy Elements**: Custom UI elements with a medieval dungeon theme

## Directory Structure

```
wirebase-social/
├── docs/                  # Documentation
├── public/                # Static assets
│   ├── css/               # Stylesheets
│   ├── js/                # Client-side JavaScript
│   ├── images/            # Images and icons
│   ├── fonts/             # Custom fonts
│   └── uploads/           # User uploads
├── scripts/               # Utility scripts
├── server/                # Server-side code
│   ├── models/            # Data models
│   ├── routes/            # Route handlers
│   ├── utils/             # Utility functions
│   └── views/             # Handlebars templates
├── tests/                 # Test files
├── .env                   # Environment variables
├── server.js              # Main application entry point
└── package.json           # Project metadata and dependencies
```

## Key Components

### Authentication System

The authentication system uses Passport.js with local strategy. User credentials are stored securely in Supabase with bcrypt password hashing.

**Key files:**
- `server/utils/passport-config.js`: Passport configuration
- `server/routes/users.js`: User authentication routes
- `server/models/User.js`: User model

### Database Layer

Wirebase uses Supabase (PostgreSQL) for data storage with Knex.js as the query builder.

**Key files:**
- `server/utils/database.js`: Database connection and utilities
- `server/models/*.js`: Data models for different entities

### UI Components

The UI combines Windows 98 aesthetics with medieval fantasy elements.

**Key files:**
- `public/css/styles.css`: Main stylesheet
- `public/css/accessibility.css`: Accessibility enhancements
- `public/js/main.js`: Client-side JavaScript

### Performance Optimizations

Several performance optimizations are implemented:

**Key files:**
- `server/utils/performance.js`: Performance utilities
- `server/utils/view-cache.js`: View caching middleware
- `server/utils/memory-monitor.js`: Memory usage monitoring

### Security Measures

Security is enhanced through various middleware and utilities:

**Key files:**
- `server/utils/security.js`: Security utilities
- `server/middleware/security.js`: Security middleware

## Data Flow

1. **Request Handling**:
   - Incoming requests are processed by Express middleware
   - Authentication status is checked
   - Rate limiting and security checks are applied

2. **Route Processing**:
   - Routes are defined in `server/routes/`
   - Controllers handle business logic
   - Models interact with the database

3. **Response Generation**:
   - Handlebars templates render HTML
   - JSON responses for API endpoints
   - Static assets are served directly

## Authentication Flow

1. User submits login credentials
2. Passport.js verifies credentials against database
3. On success, a session is created
4. Session ID is stored in a cookie
5. Subsequent requests include the session cookie
6. Passport deserializes the user from the session

## Key Features

### Profile Customization

Users can customize their profiles with HTML and CSS.

**Key files:**
- `server/routes/profile.js`: Profile routes
- `server/views/profile/*.handlebars`: Profile templates

### Scrapyard (Asset Marketplace)

Users can share and download digital assets.

**Key files:**
- `server/routes/scrapyard.js`: Scrapyard routes
- `server/models/ScrapyardItem.js`: Scrapyard item model

### Streetpass System

Users can leave traces when visiting other profiles.

**Key files:**
- `public/js/streetpass.js`: Streetpass client-side logic
- `server/routes/api.js`: API endpoints for streetpass

## Testing

The application uses Jest for testing.

**Key files:**
- `tests/`: Test directory
- `jest.config.js`: Jest configuration

## Deployment

The application is configured for deployment on various platforms.

**Key files:**
- `render.yaml`: Render deployment configuration

## Performance Considerations

- Static assets are cached and compressed
- Database queries are optimized
- Memory usage is monitored
- View caching for static pages

## Security Considerations

- Content Security Policy (CSP)
- XSS protection
- CSRF protection
- Rate limiting
- Input validation and sanitization
- Secure session handling

## Accessibility

The application is designed with accessibility in mind:

- ARIA attributes
- Keyboard navigation
- Focus management
- High contrast mode
- Reduced motion support
- Screen reader compatibility
