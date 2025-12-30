# Worklog — BI Platform Implementation

Please work on implementing the full BI feature.
Continue to update this worklog regularly as you work, do not work on more than a few files without updating the worklog; it will be your source of truth after compaction.

## Instructions

- Follow `src/features/bi/docs/PLAN-bi-implementation.md` as the source of truth
- Also read all docs in `src/features/bi/docs`
- Write your progress here, and mark off checkboxes and add notes as needed in src/features/bi/docs/CHECKLIST-sql-workbench-gate.md
- Use your best judgement on which order to tackle slices
- Read `src/features/bi/docs/*` artifacts as needed.
- Use TDD for engine layer; write tests before implementation.
- If golden masters change or mismatch, document the improvement and update fixtures/tests.
- When choosing between approaches, record the decision and update the relevant doc/contracts.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Run `pnpm test src/features/bi` to run BI-specific tests.
- Run `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono` to spin up dev and make sure it works, and to be able to use Chrome Dev Tools
- Once you have actually written functionality that has a UI, use Chrome Dev Tools mcp to interact with the feature and make sure it works and has good ux.
- Log any blockers, questions, and technical debt you find here.
- If you run into issues with any part of the development, move on to the next after noting the issue here.
- Do not return control to the user until you have attempted to fully complete every single feature and every single file (though, as noted, you may move on if blocked)
- Another agent is working on another worklog. Please let them know in their worklog if you think they broke something for you, or you might be doing something that affects them docs/sin-rfp/worklogs/WORKLOG-gap-closure.md

## Session Log

### 2025-12-29 21:45:00: Example session

- Initialized worklog
- Question for user: What <>
- Blockers: Couldn't log in to dev server, tried following what is in CLAUDE.md, killing 5173 and restarting the server, using the proper admin@example.com and testpassword123, but it still didn't work
- Tech debt: I think file a and file b could be a part of x pattern, and the original plan could be improved, but I'm not going to refactor right now.
