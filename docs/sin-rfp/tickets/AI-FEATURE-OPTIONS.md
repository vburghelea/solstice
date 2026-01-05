# AI Feature Options for viaSport SIN Platform

## Context

The RFP requests "potential AI-enabled features" and "AI-enabled insights" as desirable capabilities. This ticket scopes options for AI features that could be added to strengthen the proposal, ranked by impact and effort. All AI work assumes TanStack Start + TanStack AI as the SDK layer (provider-agnostic adapters, streaming, and server-function tooling).

**Target users:**

- PSO staff (non-technical, submitting data)
- viaSport admins (policy analysis, reporting)

**Data context:**

- 20M+ historical rows
- 60 sport organizations
- Forms, submissions, reports, documents

**Constraints to respect:**

- No PII in prompts (aggregate/anonymize first)
- Row-level security still applies to all results
- Human review before externally shared outputs
- Full audit logging of AI usage

---

## Option 0: AI Foundation Layer (RECOMMENDED PREWORK)

**Value:** ⭐⭐⭐⭐⭐ | **Effort:** Medium (4-7 days)

### What it does

Creates a shared AI platform layer used by every feature so future AI work is faster, safer, and consistent.

### MVP scope

- Provider registry using TanStack AI adapters (text + embeddings) with per-env config.
- Central `ai` service wrapper with retries, timeouts, and cost logging.
- Prompt template registry (DB) with versioning, owner, and audience metadata.
- Structured outputs with Zod validation and schema-based response parsing.
- Usage logging (org, user, prompt version, tokens, latency, cost estimate).
- Feature flags + quotas per tenant and per user (rate limiting via Pacer).

### Architecture outline

- `ai` execution wrapper (server-only) that standardizes calls, handles retries,
  and returns structured results.
- Provider/model configuration with per-env overrides and safe defaults.
- Prompt registry service (create, update, activate, archive) with version pins.
- Output validation layer with Zod schemas per feature to avoid free-form output.
- Guardrails: prompt assembly helpers that strip/aggregate sensitive fields.
- Observability pipeline: usage logs, cost estimates, latency, and error types.
- Rate limiting and quotas wired to user/org scopes with clear failure messages.

### MVP deliverables

- Config module for model/provider selection + env-based settings.
- Reusable server function helper (or `createServerFnTool`) for AI calls.
- Tables for prompt templates and usage logs (schema drafted only, no migration).
- Shared UI primitives for streaming responses and "AI generated" labeling.
- Admin-only prompt management stub (view + select active version).

### Non-goals (MVP)

- Full evaluation harness, auto-redaction ML, or prompt A/B testing.
- Tenant-specific model routing or budget automation.

### Phase 2

- Response caching/deduping for repeated prompts (report summaries, searches).
- Evaluation harness with gold-standard examples for regression checks.
- Data redaction/aggregation helpers for safe prompt construction.
- Admin UI for prompt management and model selection.

### Why this helps

- Single place to enforce safety, logging, and costs.
- Shared tooling makes Options 1-6 cheaper and more consistent.

### Dependencies / decisions

- Initial model/provider choice (Claude vs Azure OpenAI vs OpenAI).
- Data residency policy and redaction rules per tenant.
- Where prompt templates live (DB vs config files) for auditability.
- Logging target (DB tables vs external observability sink).

---

## Option 1: AI Report Narratives (RECOMMENDED FIRST)

**Value:** ⭐⭐⭐⭐⭐ | **Effort:** Low-Medium (1-2 days after Option 0)

### What it does

Generates natural language summaries from existing reports/dashboards. User clicks "Generate Summary" and receives a narrative suitable for board reports or policy briefs.

### Scope (MVP)

- Button on analytics/report views (use existing filters and timeframe).
- Inputs: top metrics, period-over-period deltas, and key charts as structured data.
- Outputs: 2-3 paragraphs + 3-5 bullet callouts + optional "next steps".
- Editable output with regenerate, copy, and export.

### Phase 2

- Templates by audience (board, funding partners, internal ops).
- Bilingual summaries (English/French) with locale toggle.
- Scheduled summaries (monthly/quarterly) delivered via email.

### Technical requirements

- TanStack AI `generate` on server with structured output schema.
- Prompt templates stored in DB and versioned.
- Cache summaries by report id + filters to reduce cost.

### Responsible AI considerations

- Clearly label as AI-generated.
- Only aggregate data in prompts (no PII).
- User review required before sharing/exporting.

### Success signals

- % of reports with summaries generated.
- Average time saved per report (self-reported).
- Low edit time (indicates useful output).

---

## Option 2: Natural Language Data Query

**Value:** ⭐⭐⭐⭐⭐ | **Effort:** Medium (3-5 days after Option 0)

### What it does

Users ask questions in plain English ("How many athletes registered in 2023 by sport?") and get answers without writing SQL or navigating complex filters.

### Scope (MVP)

- "Ask AI" input on analytics page.
- LLM returns a structured query intent: metrics, dimensions, filters, timeframe.
- User reviews a preview and confirms before execution.
- Results returned with a table and suggested visualization.

### Phase 2

- Multi-turn follow-ups ("Now compare to 2022").
- Save as a reusable report or dashboard widget.
- Auto-generated narrative summary of the result.

### Technical requirements

- Semantic layer (catalog of approved metrics/dimensions).
- Safe query builder (no raw SQL) with RLS.
- Read-only DB connection and query sandboxing.
- TanStack AI tool calling + Zod output validation.

### Responsible AI considerations

- Preview/approval gate before executing.
- Explain query intent in plain language.
- Audit log of all AI-generated queries.

### Risks

- Incorrect queries returning wrong data (mitigate with validation + confidence).
- Prompt injection attempts (mitigate with strict tool schema + allowlist).

---

## Option 3: AI Dashboard Builder

**Value:** ⭐⭐⭐⭐ | **Effort:** Medium (3-5 days after Option 0)

### What it does

User describes a visualization ("Show registration trends by region for the last 3 years"), and AI generates the chart configuration.

### Scope (MVP)

- "Create with AI" in dashboard builder.
- LLM produces a chart config (type, metrics, dimensions, filters).
- Preview + manual edits before saving.
- Initial chart types: line, bar, pie, table.

### Phase 2

- Multi-chart dashboards from one prompt.
- Auto-layout and narrative captions.
- Suggested "next charts" based on current view.

### Technical requirements

- Chart config schema and visualization mapping.
- Shared semantic layer with Option 2.
- TanStack AI structured output with validation.

### Responsible AI considerations

- User review required before saving.
- No data in prompts (schema only).

---

## Option 4: Semantic Document Search

**Value:** ⭐⭐⭐⭐ | **Effort:** Low-Medium (2-3 days after Option 0)

### What it does

Search across submissions, documents, and records by meaning rather than exact keywords.

### Scope (MVP)

- Embed document text and store vectors (pgvector or external).
- Hybrid search (semantic + keyword) with relevance ranking.
- Result snippets with highlighted matching phrases.

### Phase 2

- AI-generated summaries of top results.
- Auto-tagging of documents by topic.
- "Related documents" recommendations.

### Technical requirements

- Embedding model via TanStack AI adapter.
- Batch job for backfill + incremental embeddings on new uploads.
- Access control filtering at query time.

### Responsible AI considerations

- Embeddings respect access control.
- No sensitive data sent to external model without approval.

---

## Option 5: Data Quality AI

**Value:** ⭐⭐⭐ | **Effort:** Medium (3-4 days after Option 0)

### What it does

Detects anomalies, suggests corrections for obvious errors, and flags outliers for human review.

### Scope (MVP)

- Rule-based checks + statistical outlier detection.
- AI-generated explanations for why a record was flagged.
- Review queue for staff decisions.

### Phase 2

- Pattern-based suggestions for corrections.
- Duplicate detection and normalization hints.
- Trend alerts (sudden drops/spikes per org).

### Technical requirements

- Historical baselines per org/sport/time period.
- Anomaly scoring thresholds and alert routing.
- Optional AI summarization for review context.

### Responsible AI considerations

- AI flags only; humans decide.
- Transparent reasoning for every flag.

---

## Option 6: Submission Assistant

**Value:** ⭐⭐⭐ | **Effort:** Low (1-2 days after Option 0)

### What it does

Helps PSOs fill out forms correctly by suggesting values, explaining fields, and catching errors before submission.

### Scope (MVP)

- Inline "Explain this field" help (LLM-generated from field metadata).
- Suggestions based on prior submissions for the same org.
- Pre-submit check with friendly, actionable guidance.

### Phase 2

- Form-specific chat assistant.
- Translation support for bilingual users.
- "Missing data" prompts before submission.

### Technical requirements

- Field metadata registry and historical value lookup.
- TanStack AI text generation for explanations.

### Responsible AI considerations

- Suggestions are optional; user remains in control.
- Clear distinction between required vs suggested values.

---

## Recommendation

### For proposal (no code required)

Present the AI Foundation Layer as Phase 0, then prioritize 1-2 visible features based on viaSport needs.

### If adding one feature before submission

**AI Report Narratives** - highest demo impact, lowest risk.

### If adding two items before submission

1. AI Foundation Layer (enables all future work)
2. AI Report Narratives

---

## Implementation Notes

### TanStack AI integration

- Use `@tanstack/ai` with provider adapters (text + embeddings) and `@tanstack/ai-react` where a shared tool is useful.
- Prefer `createServerFnTool` to share tool logic between AI workflows and TanStack Start server functions.
- Keep server-only imports inside handlers (or use `serverOnly()`), since top-level imports in server function files are bundled to the client.

### LLM Provider Options

| Provider          | Pros                            | Cons                      |
| ----------------- | ------------------------------- | ------------------------- |
| Claude API        | Best reasoning, safety          | Cost                      |
| OpenAI GPT-4      | Widely understood, good tooling | Data residency concerns   |
| Azure OpenAI      | Canadian region available       | More setup                |
| Local/Open Source | Full control, no data leaving   | More infra, lower quality |

### Data Residency

For PIPEDA compliance, consider:

- Azure OpenAI in Canada East region
- Anthropic's data handling policies
- No PII in prompts (aggregate/anonymize first)

### Cost Estimates

- LLM calls: ~$0.01-0.10 per query (depends on model/length)
- Embeddings: ~$0.0001 per 1K tokens
- Vector DB: ~$0-50/month depending on scale

---

## References

- RFP Section: "AI-enabled features" (desirable)
- System Req: RP-AGG-005 (Self-Service Analytics)
- TanStack AI local docs: /Users/austin/dev/ai/README.md
- Austin's Clio AI experience: Wrote company AI best practices guide

## Update Log

- 2026-01-04: Expanded feature scopes, added AI foundation layer, and noted TanStack AI integration.
- 2026-01-04: Added architecture and deliverables details for Option 0.
