# Solstice

[![CI](https://github.com/austeane/solstice/actions/workflows/ci.yml/badge.svg)](https://github.com/austeane/solstice/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/austeane/solstice/branch/main/graph/badge.svg)](https://codecov.io/gh/austeane/solstice)
[![Deploy Preview](https://github.com/austeane/solstice/actions/workflows/deploy-preview.yml/badge.svg)](https://github.com/austeane/solstice/actions/workflows/deploy-preview.yml)

## Overview

Solstice is a personal project exploring a modern information management and
league/event management platform. It pairs data governance and analytics with
day-to-day operations like memberships, teams, and event registrations.

## Why this architecture works

- Unified data model for reporting and operations
- Multi-tenant isolation with role-based access control
- Serverless, autoscaling API for seasonal spikes
- Event-driven workflows for reminders, exports, and batch imports
- Audit-first design with immutable logs and retention controls
- Modular features that can be enabled per deployment

## Core capabilities

Information management:

- Dynamic form builder with validation and versioned submissions
- Reporting cycles, review workflows, and audit-ready exports
- Self-service analytics with field-level access controls
- Bulk imports with mapping templates, previews, and rollback
- Data quality checks and governance guardrails

League and event management:

- Organization hierarchy with delegated access
- Membership lifecycle, rosters, and eligibility checks
- Event creation, registration, and scheduling
- Payment workflows and receipts
- Notifications, reminders, and support workflows

## Architecture

- TanStack Start full-stack app with file-based routing
- PostgreSQL with Drizzle ORM for transactional data
- Object storage for uploads and artifacts
- Queue + scheduler for background jobs (imports, reminders, exports)
- Email delivery for transactional communications
- Observability hooks for audit, security, and analytics

## Tech stack

- TanStack Start + React
- Better Auth (sessions + MFA)
- Drizzle ORM + PostgreSQL
- Tailwind CSS v4 + shadcn/ui
- Vite 7
- SST on AWS (Lambda, CloudFront, RDS, S3, SQS, SES)

## Repository map

- `src/features/` - domain modules (forms, reporting, imports, analytics, audit)
- `src/routes/` - thin route files and API endpoints
- `src/lib/` - auth, security, notifications, privacy, shared services
- `src/db/` - Drizzle schemas and migrations
- `docs/` - product and technical documentation
