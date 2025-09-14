# External Integrations

This document covers all external service integrations for the Roundup Games platform.

## SendGrid Email

**Status**: ⏳ Planned

### Configuration

```bash
SENDGRID_API_KEY=         # API key from SendGrid
SENDGRID_WEBHOOK_KEY=     # Webhook verification
SENDGRID_FROM_EMAIL=staff@roundup.games
SENDGRID_FROM_NAME=Roundup Games Staff
```

### Planned Implementation

**Service Location**: `src/lib/email/sendgrid.ts` (not yet created)

**Email Types**:

1. **Transactional**:
   - Welcome emails
   - Payment confirmations
   - Event registrations
   - Password resets

2. **Marketing**:
   - Event announcements
   - Newsletter
   - Member updates

**Templates**: Will be managed in SendGrid dashboard for easy updates without code changes.

## Cloudinary Media Storage

**Status**: ⏳ Planned

### Configuration

```bash
CLOUDINARY_CLOUD_NAME=    # Account identifier
CLOUDINARY_API_KEY=       # API credentials
CLOUDINARY_API_SECRET=    # Secret key
```

### Planned Usage

1. **Team Logos**: Automatic resizing and optimization
2. **Event Photos**: Gallery management
3. **User Avatars**: Privacy-aware storage
4. **Documents**: Secure PDF storage for waivers

## Social Media APIs

**Status**: ⏳ Planned

### Planned Integrations

1. **Instagram Basic Display API**:
   - Embed recent posts
   - Show event highlights
   - No user data collection

2. **Facebook Page API**:
   - Event cross-posting
   - Page feed display

## Development Guidelines

### Adding New Integrations

1. **Environment Variables**:
   - Add to `.env.example` with clear descriptions
   - Document in this file
   - Add validation in `src/lib/env.server.ts`

2. **Service Wrapper**:
   - Create typed wrapper in `src/lib/[service-name]/`
   - Include error handling and logging
   - Write unit tests for critical paths

3. **Webhook Handlers**:
   - Always validate signatures
   - Use database transactions
   - Log all events for debugging

4. **Documentation**:
   - Update this file with configuration steps
   - Add integration guide if complex
   - Include troubleshooting section

### Security Best Practices

1. **API Keys**: Never commit to repository
2. **Webhooks**: Always validate signatures
3. **Rate Limiting**: Implement for all external calls
4. **Error Handling**: Never expose internal errors to users
5. **Logging**: Track all external API interactions

## Monitoring

All integrations should report to application monitoring:

```typescript
// Example integration wrapper
async function callExternalAPI() {
  const start = Date.now();
  try {
    const result = await externalAPI.call();
    metrics.record("external_api.success", Date.now() - start);
    return result;
  } catch (error) {
    metrics.record("external_api.error", Date.now() - start);
    logger.error("External API failed", { error });
    throw new ExternalServiceError("Service temporarily unavailable");
  }
}
```

## Troubleshooting

### Email Delivery

- **Emails not sending**: Verify API key and sender domain
- **Spam folder**: Check SPF/DKIM records
- **Rate limits**: Implement queuing for bulk sends

### Media Upload

- **Upload fails**: Check file size limits
- **Transformation errors**: Verify format support
- **Slow loading**: Enable CDN caching
