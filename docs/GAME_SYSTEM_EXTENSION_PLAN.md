# Game System Extension Plan

## Overview

This plan outlines enhancements to the `gameSystem` entity so that players can explore rich information about each game system and discover sessions or campaigns that feature it. The feature includes a public landing page, content management tools, and an automated crawler to populate game system data from external sources.

## Key Requirements

- Public landing page for every game system with descriptive content and imagery
- Search capabilities for sessions and campaigns by game system
- CMS features for managing landing page content and FAQs
- Crawler service to aggregate game system data from external providers

## Implementation Checklist

### Database & Data Model

- [ ] Extend `gameSystem` schema with fields: `slug`, `description`, `heroImageUrl`, `galleryImages`, `minPlayers`, `maxPlayers`, `mechanics`, `genres`, `publisherUrl`, `releaseDate`, and `faq`
- [ ] Create tables or relations for mechanics and genres to reference shared lookup tables
- [ ] Index `slug` for fast lookups and enforce uniqueness
- [ ] Ensure game sessions and campaigns reference `gameSystem` by id/slug

### Backend & APIs

- [ ] Expose REST/GraphQL endpoints to retrieve game system details and related sessions/campaigns
- [ ] Add search filter parameters for `gameSystem` to existing session and campaign listing endpoints
- [ ] Implement admin endpoints for content managers to update game system details and FAQ entries
- [ ] Validate incoming data using Zod schemas and handle errors gracefully

### Frontend

- [ ] Create public route `/game-systems/[slug]` displaying hero image, gallery, description, min/max players, mechanics, genres, publisher link, release date, FAQ, and related sessions/campaigns
- [ ] Implement responsive gallery component and ensure accessibility of images and links
- [ ] Add search UI allowing users to filter sessions and campaigns by game system
- [ ] Build admin interface for content managers to edit landing page content and FAQs

### Crawler Service

- [ ] Implement a crawler that fetches game system data from:
  - `https://startplaying.games/play/game-systems`
  - BoardGameGeek XML API (`https://boardgamegeek.com/wiki/page/BGG_XML_API2`)
- [ ] Map external data to internal schema fields, including images and metadata
- [ ] Store new or updated game systems in the database
- [ ] Schedule periodic crawls and provide manual trigger capability
- [ ] Log crawler activity and handle rate limiting or API failures

### Testing & Documentation

- [ ] Write unit tests and integration tests for backend APIs, crawler logic, and frontend components
- [ ] Verify crawler and search features in staging environment before production deployment
- [ ] Update developer documentation and user guides related to game systems

### Deployment Considerations

- [ ] Migrate database schema using Drizzle or relevant migration tools
- [ ] Seed initial game system data from crawler output
- [ ] Monitor crawler and landing pages after deployment for missing data or errors
