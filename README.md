# Wirebase

A social media platform combining medieval dungeon fantasy aesthetics with Windows 98 retro web design.

## Overview

Wirebase is a unique social platform that blends the dark, mysterious aesthetics of medieval dungeons with the nostalgic charm of Windows 98 interfaces. The platform focuses on user customization and creative expression through a series of interconnected features.

## Design Theme

- **Color Scheme**: Dark purple, gold, and orange
- **Visual Elements**: Gothic stone textures, pixelated shadows, gothic fonts, Windows 98/Web 1.0 UI elements
- **Aesthetic**: Medieval dungeon fantasy meets retro computing

## Core Features

- **Customizable Profiles**: Users have full control over their personal profile pages using raw HTML/CSS
- **Terminal Mode Editor**: Text-based interface for editing site content directly
- **RSS/ATOM Feed Integration**: For each user page
- **Global Discovery Feed**: Shows recent user page updates and Scrapyard submissions

## Scrapyard Marketplace

The Scrapyard is a user-powered marketplace of content feeds:

- **Widget Graveyard**: Embeds, iframe tools, micro-apps
- **Template Crypt**: Full-page HTML/CSS layouts
- **Icon Vault**: Favicons, buttons, glyphs
- **Banner Keep**: Headers, banners, visual assets
- **GIF Dungeon**: GIFs and motion assets

## Streetpass Widget

- Displays a list of recent visitors and stats
- Visitors can leave emotes or glyph impressions
- Customizable and tradeable emotes

## Micro-Economy

- **Loot Tokens**: Virtual currency for the platform economy
- **Badges**: Awarded for top contributors and special events

## Community Features

- **Forum**: Categories for discussion, trading, feedback, and ARG puzzles
- **Customizable Glyphs**: Symbols appearing in comments, Streetpass logs, and across the forum
- **Status Messages & Icons**: Customizable online presence indicators
- **Activity Pings**: Notifications for the global feed

## Design Elements

- Gothic stone backgrounds and pixelated textures
- Three.js visuals for page headers and footers
- Toggleable Old Browser Skins
- Custom pixel and gothic serif fonts
- User-customizable cursors

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript, Three.js
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js
- **Templates**: Handlebars

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure the database connection in `server.js`
4. Start the server: `npm start`

## Development

- Development mode: `npm run dev`
- Customize the theme in `public/css/styles.css`
- Add new features by extending the routes in `server/routes`

## License

This project is a conceptual design exercise and not intended for production use.