# Sports Registration Platform

This is a web application built with [SST](https://sst.dev/) and [TanStack](https://tanstack.com/), deployed on AWS.

## Prerequisites

- Node.js (v16+)
- AWS CLI
- AWS SSO credentials

## AWS Configuration

This project uses AWS SSO for authentication. Make sure you have the AWS CLI installed and configured.

### SSO Login

1. Configure SSO:
   ```
   aws configure sso
   ```

2. Log in with SSO for development:

   ```
   aws sso login --profile soleil-dev
   ```

## Running the Project

When running `npx sst dev`, pay attention to AWS credentials. The project looks for credentials in this order:

1. Environment variables
2. SST config
3. AWS config
4. Credential files

To avoid credential issues when running locally, you can explicitly set the profile:

```
AWS_PROFILE=soleil-dev npx sst dev
```

This ensures the right AWS profile is used, overriding any other profile that might be set in your environment variables.

## Project Structure

- `/sports-reg-platform` - The main application code
  - Built with TanStack Router and React
  - Uses Prisma for database access
  - Styled with Tailwind CSS

## Development

1. Install dependencies:
   ```
   cd sports-reg-platform
   npm install
   ```

2. Run the development server:
   ```
   AWS_PROFILE=soleil-dev npx sst dev
   ```

3. In another terminal, start the frontend:
   ```
   cd sports-reg-platform
   npm run dev
   ```

## Deployment

Deployments are managed through SST and target the configured AWS account.





# Solstice

Solstice is a **modern web platform for managing memberships, teams, and events**. It leverages a cutting-edge tech stack to deliver fast, dynamic user experiences while being highly extensible.

## Overview and Purpose

The Solstice platform streamlines sports league management – initially serving **Quadball Canada** (the national quadball governing body) and eventually adaptable to other sports organizations. The platform enables athletes, team leaders, and administrators to handle all essential activities in one place.

**Key Features:**

- **Member Registration & Management:** User accounts, profiles, waivers, and annual memberships
- **Team Setup & Roster Management:** Team creation, player invitations, and roster management
- **Event Creation & Registration:** Tournament/league management with team/individual registration
- **Payments & Finance:** Integration with a payment platform for membership and event fees
- **Role-Based Access Control:** Admin, Team Lead, and Player permission layers
- **Communication & Notifications:** Email confirmations and announcements
- **Future Extensibility:** Multi-organization, multi-sport capability