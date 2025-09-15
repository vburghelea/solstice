# Game System Extension Plan

## Overview

This plan outlines enhancements to the `gameSystem` entity so that players can explore rich information about each game system and discover sessions or campaigns that feature it. The feature includes a public landing page, content management tools, and an automated crawler to populate game system data from external sources.

## Existing Context

- `gameSystemMechanics` and `gameSystemCategories` tables already model mechanics and categories.
- `gameSessions` and `campaigns` reference `gameSystems` by `id`.
- The platform exposes only REST endpoints (no GraphQL layer).
- External data crawler will be run manually when needed.

## Key Requirements

- Public landing page for every game system with descriptive content and imagery
- Search capabilities for sessions and campaigns by game system
- CMS features for managing landing page content and FAQs
- Manual crawler service to aggregate game system data from external providers

## Phased Implementation Checklist

### Phase 1: Database Enhancements

- [ ] Add fields to `gameSystems`: `slug`, `description`, `heroImageUrl`, `galleryImages` (JSON array), `minPlayers`, `maxPlayers`, `publisherUrl`, `releaseDate`, `landingPageContent` (rich text/JSON), and `faq` (JSON array)
- [ ] Create migration adding the fields and a unique index on `slug`
- [ ] Verify `gameSystemMechanics` and `gameSystemCategories` relations still work with the extended schema
- [ ] Seed initial values for new fields where data exists

### Phase 2: Backend REST API & CMS

- [ ] `GET /game-systems/:slug` returns game system details including mechanics, categories, and related session/campaign counts
- [ ] `GET /game-systems` supports pagination and search by name, mechanic, or category
- [ ] Add `gameSystemId` filter to existing `GET /game-sessions` and `GET /campaigns` endpoints
- [ ] `POST /game-systems` and `PUT /game-systems/:id` allow content managers to create or update details, gallery, landing content, and FAQ
- [ ] Optional `POST /game-systems/:id/faq` and `DELETE /game-systems/:id/faq/:faqId` for individual FAQ entries
- [ ] Validate all endpoints with Zod; restrict CMS routes to authorized users

### Phase 3: Public Landing Page & Search UI

- [ ] Route `/game-systems/[slug]` displays hero image, gallery, description, min/max players, mechanics, categories, publisher link, release date, landing content, FAQ, and related sessions/campaigns
- [ ] Enhance search pages to filter sessions and campaigns by game system
- [ ] Autocomplete game system selection in session/campaign creation forms
- [ ] Admin UI for editing game system details, uploading images, and managing FAQ entries

### Phase 4: Manual External Crawler

- [ ] Implement script `pnpm crawl:game-systems` that:
  - [ ] Fetches data from StartPlaying (`https://startplaying.games/play/game-systems`) and BGG XML API
  - [ ] Normalizes data to internal schema and downloads images
  - [ ] Inserts new records or updates existing ones
  - [ ] Logs summary of created/updated entries and any errors
- [ ] Handle rate limits and network errors gracefully
- [ ] Document how to run the crawler and review its output

### Phase 5: Testing & Deployment

- [ ] Unit and integration tests for REST endpoints and schema utilities
- [ ] Smoke tests for crawler using mocked external API responses
- [ ] Frontend tests for new route and search functionality
- [ ] Update developer documentation and CMS guides
- [ ] Run database migrations and execute crawler once to seed initial data
- [ ] Monitor logs and landing pages for missing or malformed content after deployment
