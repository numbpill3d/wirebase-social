# API Endpoints

This document summarizes the JSON endpoints served under `/api`.

## General Notes
- Paths are relative to the server root (e.g. `https://yourdomain.com`).
- Endpoints that require authentication are marked **(auth)**.

## Core API

| Method | Route | Parameters | Description |
|-------|-------|------------|-------------|
| GET | `/api/users` | – | List recent users |
| GET | `/api/users/:username` | `username` | Get user by username |
| GET | `/api/me` | – | Return the currently authenticated user **(auth)** |
| GET | `/api/scrapyard` | `category` (query) | List scrapyard items |
| GET | `/api/scrapyard/:id` | `id` | Get scrapyard item details |
| GET | `/api/market/items` | `page`, `limit`, `category`, `search`, `minPrice`, `maxPrice`, `sort`, `tags` (query) | Get marketplace items |
| GET | `/api/market/items/:id` | `id` | Get marketplace item |
| POST | `/api/streetpass/visit` | `profileId`, optional `emote` (body) | Record a profile visit **(auth)** |
| GET | `/api/streetpass/visitors/:profileId` | `profileId`, `limit` (query) | Recent visitors for a profile |
| PUT | `/api/streetpass/emote` | `visitId`, `emote` (body) | Update emote for a visit **(auth)** |
| GET | `/api/health` | – | Health check |

## Vivid Market API
These routes are mounted at `/api/market`.

| Method | Route | Parameters | Description |
|-------|-------|------------|-------------|
| GET | `/api/market/items` | `page`, `limit`, `category`, `search`, `minPrice`, `maxPrice`, `sort`, `tags`, `creator` (query) | Filter items |
| GET | `/api/market/items/:id` | `id` | Retrieve an item |
| GET | `/api/market/categories` | – | List categories |
| GET | `/api/market/tags` | `limit` (query) | Popular tags |
| GET | `/api/market/collections` | `page`, `limit`, `creator`, `search`, `sort` (query) | Get collections |
| GET | `/api/market/collections/:id` | `id` | Collection details |
| GET | `/api/market/featured` | – | Featured items and collections |
| GET | `/api/market/stats` | – | Marketplace statistics |
| POST | `/api/market/items` | `title`, `description`, `category`, `content`, `wirPrice`, `tags`, `featuredInMarket`, `previewImage` (body) | Create an item **(auth)** |
| PUT | `/api/market/items/:id` | same as above (body), `id` | Update an item **(auth)** |
| DELETE | `/api/market/items/:id` | `id` | Delete an item **(auth)** |
| POST | `/api/market/items/:id/purchase` | `id` | Purchase an item **(auth)** |
| GET | `/api/market/user/items` | – | Items created by the user **(auth)** |
| GET | `/api/market/user/purchased` | – | Items purchased by the user **(auth)** |
| GET | `/api/market/user/wishlist` | – | Wishlist items **(auth)** |
| GET | `/api/market/user/collections` | – | Collections by the user **(auth)** |
| GET | `/api/market/user/wir` | – | WIR balance and transactions **(auth)** |
| GET | `/api/market/wir/transactions` | `userId` (optional), `limit`, `offset` (query) | List WIR transactions **(auth)** |
| POST | `/api/market/wir/convert` | `direction`, `amount` (body) | Convert between WIR and Loot **(auth)** |
| POST | `/api/market/wir/transfer` | `receiverUsername`, `amount`, `notes` (body) | Transfer WIR **(auth)** |

