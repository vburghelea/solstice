# AI Feature Options for viaSport SIN Platform

## Context

The RFP requests "potential AI-enabled features" and "AI-enabled insights" as desirable capabilities. This ticket documents options for AI features that could be added to strengthen the proposal, ranked by impact and effort.

**Target users:**

- PSO staff (non-technical, submitting data)
- viaSport admins (policy analysis, reporting)

**Data context:**

- 20M+ historical rows
- 60 sport organizations
- Forms, submissions, reports, documents

---

## Option 1: AI Report Narratives (RECOMMENDED FIRST)

**Value:** ⭐⭐⭐⭐⭐ | **Effort:** Low-Medium (1-2 days)

### What it does

Generates natural language summaries from data/reports. User runs a query or views a dashboard, clicks "Generate Summary," and receives a 2-3 paragraph narrative suitable for board reports or policy documents.

### User story

> "As a viaSport admin, I want to generate a written summary of participation data so I can quickly create board reports without manual writing."

### Implementation

1. Add "Generate Summary" button to report/dashboard views
2. Collect current data context (query results, filters, timeframe)
3. Send to LLM with prompt template:
   ```
   You are a sports policy analyst. Summarize this data for a board report.
   Data: {data}
   Timeframe: {timeframe}
   Focus on: trends, notable changes, actionable insights
   ```
4. Display generated text in modal with edit capability
5. User can copy/export or regenerate

### Technical requirements

- LLM API integration (Claude or OpenAI)
- Prompt templates stored in DB (admin-editable)
- Rate limiting per user
- Audit logging of AI usage

### Responsible AI considerations

- Human reviews output before using
- Clear "AI-generated" labeling
- No PII in prompts (aggregate data only)
- User can edit/reject output

---

## Option 2: Natural Language Data Query

**Value:** ⭐⭐⭐⭐⭐ | **Effort:** Medium (3-5 days)

### What it does

Users ask questions in plain English ("How many athletes registered in 2023 by sport?") and get answers without writing SQL or navigating complex filters.

### User story

> "As a PSO admin, I want to ask questions about our data in plain English so I can get answers without technical skills."

### Implementation

1. Chat-style interface or search bar with "Ask AI" mode
2. User enters natural language question
3. LLM converts to SQL query (with schema context)
4. Execute query against read-only replica
5. Return results + visualization suggestion
6. Option to save as dashboard widget

### Technical requirements

- LLM with function calling or SQL generation
- Schema documentation for LLM context
- Read-only DB connection (safety)
- Query validation/sandboxing
- Result caching

### Responsible AI considerations

- Query review before execution (optional)
- Row-level security still enforced
- Audit log of all AI-generated queries
- Fallback to human support if AI can't help

### Risks

- SQL injection via prompt injection (mitigate with parameterized queries)
- Incorrect queries returning wrong data (mitigate with confidence scoring)

---

## Option 3: AI Dashboard Builder

**Value:** ⭐⭐⭐⭐ | **Effort:** Medium (3-5 days)

### What it does

User describes desired visualization in plain language ("Show registration trends by region for the last 3 years"), and AI generates the chart configuration.

### User story

> "As a viaSport analyst, I want to describe a chart I need and have it created automatically so I can build dashboards faster."

### Implementation

1. "Create with AI" button in dashboard builder
2. User describes desired visualization
3. LLM generates chart config (type, dimensions, measures, filters)
4. Preview generated chart
5. User can adjust and save

### Technical requirements

- LLM integration with structured output
- Chart config schema for LLM
- Preview/sandbox environment
- Save to user's dashboard

### Responsible AI considerations

- User reviews before saving
- Can always manually edit
- No data exposure in prompts (just schema)

---

## Option 4: Semantic Document Search

**Value:** ⭐⭐⭐⭐ | **Effort:** Low-Medium (2-3 days)

### What it does

Search across all submissions, documents, and records by meaning rather than exact keywords. "Find submissions about accessibility programs" returns relevant results even if they don't contain the word "accessibility."

### User story

> "As a viaSport admin, I want to search for submissions related to a topic so I can find relevant data without knowing exact terms."

### Implementation

1. Generate embeddings for submissions/documents (batch job)
2. Store in vector database (pgvector or Pinecone)
3. On search, embed query and find nearest neighbors
4. Return ranked results with relevance scores
5. Hybrid search: combine semantic + keyword

### Technical requirements

- Embedding model (OpenAI ada, Cohere, or open-source)
- Vector storage (pgvector extension or external)
- Batch embedding job for existing data
- Incremental embedding on new submissions

### Responsible AI considerations

- Embeddings don't expose raw data
- Search respects existing access controls
- No PII in embedding model calls (or use on-prem model)

---

## Option 5: Data Quality AI

**Value:** ⭐⭐⭐ | **Effort:** Medium (3-4 days)

### What it does

Automatically detects anomalies, suggests corrections for obvious errors, and flags outliers for human review.

### User story

> "As a viaSport admin, I want the system to catch data quality issues automatically so I spend less time manually reviewing submissions."

### Implementation

1. Run anomaly detection on new submissions
2. Compare against historical patterns (same org, same period last year)
3. Flag statistical outliers (>2 std dev from expected)
4. Suggest corrections for common issues (typos, format errors)
5. Dashboard showing flagged items for review

### Technical requirements

- Statistical analysis module
- Historical baseline calculations
- LLM for correction suggestions (optional)
- Review queue UI

### Responsible AI considerations

- AI flags, human decides
- Transparent reasoning ("flagged because 10x higher than last year")
- No auto-correction without approval

---

## Option 6: Submission Assistant

**Value:** ⭐⭐⭐ | **Effort:** Low (1-2 days)

### What it does

Helps PSOs fill out forms correctly by suggesting values based on their history, explaining field requirements, and catching errors before submission.

### User story

> "As a PSO admin filling out a form, I want helpful suggestions so I complete it correctly the first time."

### Implementation

1. Inline help tooltips powered by LLM (explain complex fields)
2. Auto-suggest values based on previous submissions
3. Pre-submission validation with friendly error messages
4. "Ask for help" chat for form-specific questions

### Technical requirements

- LLM integration for help text generation
- Historical data lookup per org
- Form field metadata

### Responsible AI considerations

- Suggestions are optional, user controls final input
- Clear distinction between required and suggested
- No auto-filling sensitive fields

---

## Recommendation

### For proposal (no code required):

Position all features as Year 1 roadmap items, prioritized with viaSport based on their needs.

### If adding one feature before submission:

**AI Report Narratives** - lowest effort, highest demo impact, easiest to build responsibly.

### If adding two features:

1. AI Report Narratives
2. Semantic Document Search

---

## Implementation Notes

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
- Austin's Clio AI experience: Wrote company AI best practices guide
