# Wirebase

<div align="center">
  <img src="public/images/wirebase-logo.svg" alt="Wirebase" width="120">
  <h3>Join Us On The Wired: Social Platform with Retro/Laincore CyberAesthetics</h3>
</div>

Wirebase is a unique social media platform that combines retro  cyber-fantasy aesthetics with Wired/Surreal spirit-based web design. Users can create highly customizable profile pages, interact with others via the Streetpass-style system, and share resources through the Scrapyard marketplace.

## Features

### Core Features
- **Custom Profile Pages**: Users have full control over their personal profiles using raw HTML/CSS
- **Terminal Mode Editor**: Text-based interface for directly editing site content
- **RSS/ATOM Feed Integration**: Subscribable feeds for each user page and category
- **Global Discovery Feed**: Browse recent user updates and Scrapyard submissions

### Scrapyard Marketplace
- **Widget Graveyard**: Embeds, iframe tools, and micro-apps
- **Template Crypt**: Full-page HTML/CSS layouts
- **Icon Vault**: Favicons, buttons, and glyphs
- **Banner Keep**: Headers and visual assets
- **GIF Dungeon**: GIFs and motion graphics

### Advanced Features
- **Streetpass Widget**: Track profile visitors and leave emotes/impressions
- **Micro-Economy**: Loot tokens for marketplace transactions
- **Retro UI Skins**: Toggle between classic browser interfaces

## Live Demo

Visit the live demo at: [https://wirebase.city](https://wirebase.city)

## Screenshots

<div align="center">
  <img src="docs/screenshots/home.png" alt="Home Page" width="45%">
  <img src="docs/screenshots/profile.png" alt="Profile Page" width="45%">
</div>

## Demo Accounts

You can use these accounts to explore the platform:

- **Username**: DungeonMaster
  - **Email**: master@wirebase.com
  - **Password**: password123
  - **Role**: Admin

- **Username**: PixelKnight
  - **Email**: knight@wirebase.com
  - **Password**: password123

- **Username**: RetroQueen
  - **Email**: queen@wirebase.com
  - **Password**: password123

## Local Development

### Prerequisites
- Node.js (v16 or higher)
- Supabase project credentials

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/wirebase-social.git
   cd wirebase
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   SESSION_SECRET=your-session-secret
   NODE_ENV=development
   # Optional: full Postgres connection string
   DATABASE_URL=postgres://user:password@localhost:5432/database
   # URL where your site will be hosted
   SITE_URL=http://localhost:3000
   # File upload limit (bytes)
   MAX_UPLOAD_SIZE=5242880
   # Image size limits for marketplace previews
   MARKET_PREVIEW_MAX_WIDTH=1000
   MARKET_PREVIEW_MAX_HEIGHT=1000
   # Default theme slug
   DEFAULT_THEME=dark-dungeon
   # Rate limiting controls
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   # Comma separated list of trusted IPs
   TRUSTED_IPS=
   # Enable additional logging
   DEBUG=false
   ```

4. Seed the database with initial data
   ```
   node scripts/seed-defaults.js
   ```

5. Start the development server
   ```
   npm run dev
   ```

6. Visit `http://localhost:3000` in your browser

## Deployment to Render

### Automatic Deployment

1. Fork this repository to your GitHub account

2. Create a new Web Service on Render
   - Connect your GitHub repository
   - Select the "render.yaml" configuration
   - Render will automatically set up the web service and database

3. Configure environment variables in Render dashboard if needed
   - Include `TRUSTED_IPS` if you want certain IPs to bypass rate limiting. The server will check `x-forwarded-for` when behind a proxy.

### Manual Deployment

1. Create a new Web Service on Render
   - Select your repository
   - Set the build command: `npm install`
   - Set the start command: `node server.js`

2. Add environment variables:
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: (generate a random string)
   - `PORT`: `10000` (or use Render assigned port)
 `SUPABASE_URL`: your Supabase project URL  
- `SUPABASE_KEY`: your Supabase anon key  
- `SUPABASE_SERVICE_KEY`: your service role key 

## Customization

### Themes and Appearance

The platform's look and feel can be customized by modifying the CSS files:

- `public/css/styles.css` - Main styling
- Additional theme files in `public/css/themes/`

### User Content

Users can create their profiles with raw HTML/CSS, either through:
- The visual editor interface
- Terminal Mode for text-based editing
- Importing templates from the Scrapyard

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript, Three.js
- **Database**: PostgreSQL with Supabase
- **Authentication**: Passport.js with Supabase Auth
- **Templates**: Handlebars

## API Documentation

See [docs/API.md](docs/API.md) for a summary of available `/api` routes.

## Environment Setup
Create a `.env` file by copying the provided example:

```bash
cp .env.example .env
```

Then update the values inside `.env`:

```bash
# Required environment variables
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SESSION_SECRET=your-secret
PORT=3000
NODE_ENV=development

# Optional connection string for PostgreSQL
DATABASE_URL=postgres://user:password@localhost:5432/database
# URL of your site
SITE_URL=http://localhost:3000
# File upload limit (bytes)
MAX_UPLOAD_SIZE=5242880
# Marketplace preview dimensions
MARKET_PREVIEW_MAX_WIDTH=1000
MARKET_PREVIEW_MAX_HEIGHT=1000
# Default theme
DEFAULT_THEME=dark-dungeon
# Rate limiting settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
# Whitelisted IPs for rate limiting
TRUSTED_IPS=
# Enable debug logging
DEBUG=false
```

## Continuous Integration

Run the following commands in your CI pipeline:

```bash
npm ci
npm run lint
npm test
```

## License

This project is available under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Design inspired by Windows 98 UI and medieval fantasy aesthetics, as well as by the Ethos and Feeling of the Wired, from Serial Experiments Lain. Temple OS also.
- Built with Express.js, Supabase, and Handlebars
