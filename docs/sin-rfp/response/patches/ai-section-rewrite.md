## **Automation and AI**

Solstice includes a production-ready AI foundation built on AWS Bedrock, hosted exclusively in AWS Canada (Central) for data residency compliance. This foundation already powers one implemented feature—Natural Language Data Query—and supports additional AI capabilities as governed, optional modules enabled only with viaSport's explicit approval.

### _Automation (Production-Ready)_

| Feature                 | Schedule        | Purpose                                     |
| :---------------------- | :-------------- | :------------------------------------------ |
| Scheduled notifications | Every 5 minutes | Process reminder and alert queue            |
| Retention enforcement   | Daily           | Archive and purge data per policy           |
| Data quality monitoring | Daily           | Detect missing fields and validation errors |
| Batch import worker     | On demand       | Process large imports with checkpointing    |
| Health monitoring       | On demand       | Service health checks with alerts           |

### _AI Enablement Foundation (Built)_

The AI infrastructure is fully implemented and resides exclusively within AWS Canada (Central). This foundation enables current and future AI capabilities while maintaining strict data residency and governance controls:

| Component                    | Description                                                             |
| :--------------------------- | :---------------------------------------------------------------------- |
| AWS Bedrock integration      | Claude models via AWS Bedrock in ca-central-1                           |
| Central AI service           | Unified interface with retries, timeouts, and error handling            |
| Prompt template registry     | Versioned prompts with audit trail and rollback capability              |
| Structured output validation | Zod schema validation ensuring AI responses match expected formats      |
| Usage logging and costs      | Per-request tracking of tokens, latency, cost estimates by org and user |
| Quota enforcement            | Rate limiting and budget controls per tenant and user                   |
| Embedding support            | Cohere Embed v4 for semantic search (via AWS Bedrock)                   |

AI features use AWS Bedrock hosted in AWS Canada (Central) (ca-central-1). We log per-request token usage, latency, and cost estimates by organization/user for auditability, and we can provide usage reports/exports to viaSport. No AI provider outside Canada will be used without explicit written authorization from viaSport, and viaSport data will not be used for model fine-tuning/training without explicit written approval.

### _AI Feature: Natural Language Data Query (Implemented)_

The first feature built on this foundation is Natural Language Data Query, fully implemented and available in the evaluation environment. Users can ask questions about their data in plain English and receive structured results without navigating complex filters or learning query syntax.

**How It Works:**

1. User types a question: _"How many athletes registered in 2023 by sport?"_
2. The system interprets the question and shows a **query preview** with metrics, dimensions, and filters
3. User reviews and confirms (or edits) before execution
4. Results are displayed with a suggested visualization and export options

**Technical Implementation:**

| Component            | Description                                                                                  |
| :------------------- | :------------------------------------------------------------------------------------------- |
| Semantic catalog     | Metrics and dimensions derived from the existing BI layer with role-based filtering          |
| Query interpretation | Claude via AWS Bedrock converts natural language to structured query intent                  |
| Preview and confirm  | Human-in-the-loop gate ensures users approve queries before execution                        |
| Guardrails           | All queries run through existing BI security: org scoping, row limits, parameterized filters |
| Audit logging        | Dedicated NL query audit table with tamper-evident checksum chain                            |

**Responsible AI Controls:**

- **No raw SQL generation**—the LLM produces a structured intent validated against a whitelist of metrics and dimensions
- **Preview before execution**—users see exactly what will be queried and can edit or cancel
- **Confidence scoring**—low-confidence interpretations are flagged for user review
- **No PII in prompts**—only schema metadata is sent to the model, never actual data values
- **Full audit trail**—every interpretation and execution is logged with user, timestamp, and query details

**Evaluation:** Navigate to **Analytics → Ask AI** in the sin-uat environment to try natural language queries.

### _AI Feature Candidates (Available for Prioritization)_

The following AI features can be prioritized with viaSport during Discovery. Each would build on the same foundation and governance controls as Natural Language Query:

| Feature                  | Description                                                                     | Target Users    | Value                                   |
| :----------------------- | :------------------------------------------------------------------------------ | :-------------- | :-------------------------------------- |
| AI report narratives     | Generate natural language summaries from analytics dashboards for board reports | viaSport admins | Reduce manual report writing by 60-80%  |
| AI dashboard builder     | Describe a visualization in words and generate chart configurations             | viaSport admins | Faster dashboard creation               |
| Semantic document search | Search submissions and documents by meaning rather than exact keywords          | All users       | Find relevant records faster            |
| Data quality AI          | Detect anomalies and outliers in submissions with plain-language explanations   | viaSport admins | Catch errors before they affect reports |
| Submission assistant     | Contextual guidance while completing forms based on historical patterns         | PSO staff       | Reduce submission errors and rework     |

### _Prioritization Approach_

Additional AI features will not be enabled without user research. Our approach:

1. **Discovery interviews** with viaSport staff and PSO representatives to understand pain points
2. **Value mapping** to identify which features address the highest-impact workflows
3. **Prototype testing** of prioritized features with real users before production release
4. **Iterative rollout** starting with the highest-value feature, gathering feedback before expanding

The Natural Language Query feature demonstrates this approach in practice: the foundation is built, the feature is implemented with responsible AI controls, and it's ready for user feedback during evaluation and Discovery.
