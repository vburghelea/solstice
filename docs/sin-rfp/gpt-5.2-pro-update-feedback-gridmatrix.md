<Austin notes: I will give feedback on this response in brackets>

Below is feedback on your four plans plus the open-decision answers you embedded. I’m going to be blunt where something could hurt scoring or create evaluator friction.

---

## 1) The overall direction is right

### What’s strong (keep it)

- **Breadth-first + proof-first** is exactly how you reduce evaluator fatigue and improve scoring velocity.
- You’ve standardized a **repeatable requirement template** (Req text → how you meet it → evidence → finalization scope). That’s the “procurement-friendly” pattern.
- You’re correctly treating the **prototype as a scoring tool**, not a gimmick: guided path, minimal narrative, high-confidence evidence.

### The one big risk

Your current plan is _very evidence-heavy_, which is good, but it can backfire if screenshots are too small or inconsistent. GridMatrix’s “proof” works because:

- screenshots are **big enough to read**
- evidence is **visually predictable** (table grid, consistent captioning)
- the evaluator can find the point in <10 seconds

So: keep “proof-first,” but design it around readability over density.

---

## 2) Visual layout feedback (concrete tweaks)

### 2.1 Header vs footer

GridMatrix mostly relies on a **footer** (section name + page) and keeps the top clean. Your header+footer plan can work, but I’d simplify it:

**Recommendation**

- Use **either** header _or_ footer for navigation, not both. <just footer>
- If you keep both, make the header extremely light (just a thin rule and short label).

**If you want the “GridMatrix feel”:**

- Put the navigation string in the **footer only**, right-aligned:
  - `Section Title // Page X`

- Put your company/date/RFP ref in a smaller line below it (like GridMatrix does). <don't need an id, can be like
  Strength in Numbers // Page x
  Austin Wallace Tech // Jan 14, 2026>

This keeps pages visually calm (which matters when you also have screenshots/diagrams everywhere).

---

### 2.2 Evidence callout boxes: good idea, but enforce a readability rule

Your “Evidence” box standard is solid, but don’t let it become “tiny screenshot postage stamps.”

**Hard rule I’d adopt:**

- If the screenshot contains UI text that must be read, it must be **at least half-page width** (or be **cropped** to the relevant area).
- Use thumbnails only for “recognition” screenshots (dashboard overview, nav, etc.).

**Small improvement that pays off**
Inside each Evidence box, add a single line called:

- **Evaluator path:** `sin-uat → Admin → Reporting → Cycles → “2026 Annual”`

That one line massively increases evaluator success.

---

### 2.3 Figure numbering scheme: pick one and make it idiot-proof

Right now you have a mix of `Figure ES-1`, `Figure VF-1`, etc. That’s good—**keep the prefixes**. But also ensure your crosswalk can reference them cleanly.

**Recommendation**

- Use `Figure DM-1`, `Figure RP-3`, `Figure SEC-2` etc. (short, category-based)
- Use `Video V1–V6` everywhere (same numbering as your video index)

Example evidence references:

- `Evidence: Figure SEC-1, Video V1`
- `Evidence: Figure DM-4`

This makes your compliance crosswalk _much_ easier to scan.

---

### 2.4 Fonts: avoid anything that might not embed cleanly <we can use a standard font>

You listed Serifa/Scandia Web from viaSport branding notes. Those may be licensed and may not embed reliably.

**Procurement-safe rule**

- Use fonts that will embed cleanly in PDF and render identically on Windows.
- If you must emulate the viaSport typography: choose an open font pairing that behaves similarly.

If you _do_ use Serifa/Scandia: **embed fonts in the exported PDF** and test on a different machine.

---

## 3) Structure feedback (what I’d add / adjust)

### 3.1 You should still include contact info even if you drop “Authorized Contacts”

You wrote: “we don’t need to do this, it’s just me.” Fair. But don’t make evaluators hunt for how to reach you.

**Best compromise**

- No dedicated “Authorized Contacts” page.
- Add a **Contact box** in one of these places:
  - Cover page (bottom left/right) <yes>
  - Executive Summary page 1 (right column under “At a Glance”)
  - Appendix A (Demo Access)

That keeps it lean while still looking “complete.”

---

### 3.2 Add one page you don’t currently have: “Assumptions, Dependencies, and Finalization Scope”

You already use “Finalization Scope” per requirement. Great.

But I strongly recommend a **single consolidated 1-page table** early (right after the Prototype Evaluation Guide or right before Service Approach) that includes:

- Assumption (e.g., “No attachment migration required”)
- Dependency on viaSport (e.g., “Legacy DB credentials and export schedule”)
- Decision needed (e.g., “Retention durations by data type”)
- Impact if delayed
- Mitigation

This reduces perceived risk and shows you’re managing delivery like an adult. <let's make it, and we can decide whether to keep or cut it>

---

### 3.3 Add “Submission completeness” mini-checklist (optional but high-signal) <not going to add this>

A tiny “Administrative Compliance” box helps evaluators feel safe:

- Proposal document
- Pricing
- Demo access + credentials
- Evidence pack
- Videos (YouTube + ZIP backup)

It can be half a page or even a sidebar. It’s procurement comfort food.

---

## 4) Wording/positioning feedback (small changes, big credibility) <sure, but can keep some in>

### 4.1 Your wording rules are good; add two more global replacements

Add these to your “replace globally” list:

| Replace     | With                           |
| ----------- | ------------------------------ |
| “guarantee” | “target” or “commitment”       |
| “always”    | “by default” or “configurable” |

Procurement readers get allergic to absolutes unless they’re contract-backed.

---

### 4.2 Be careful with “all data stays in Canada” <already addressed>

You already addressed the email boundary caveat—good. Do the same for:

- video hosting (YouTube)
- any monitoring/alerting systems (if you mention them)

Even if the _system of record_ is in Canada, supporting tools might not be.

---

### 4.3 SSO needs to be handled explicitly (from the viaSport Q&A) <agree>

viaSport signaled:

- staff use M365
- PSOs may want Google/Microsoft/Apple
- passwordless is under consideration

**Don’t bury this.**
Make it a “Finalization Scope” item under SEC-AGG-001 (or wherever auth lives), with a clear approach:

- What exists now (email/password, Google OAuth, MFA)
- What will be finalized (which IdPs at launch)
- What you propose (phased: start with Microsoft for viaSport staff, then add social logins)

That makes you look realistic, not evasive.

---

## 5) Your open-decision answers: feedback + what I’d lock in

### 5.1 Company name and legal details <agree>

You selected: **“Austin Wallace Tech Corporation”**.

**Recommendation**

- First use: **Austin Wallace Tech Corporation (Austin Wallace Tech)**
- After that: “Austin Wallace Tech” in prose, but keep legal name in the footer or in a legal line in the appendix.

Also: you have a critical typo risk:

- You wrote `austin@solticeapp.ca` and `sinuat.solticeapp.ca` in multiple places.
- If the real domain is `solsticeapp.ca`, fix this everywhere. A single typo here makes you look sloppy and can literally block access.

This is a “drop everything and fix” item. <austin@solsticeapp.ca is correct, sin-uat is the environment name, sinuat.solsticeapp.ca is the url; soltice is a typo>

---

### 5.2 Pricing figures

You gave: `<600k, 200k, 1.2, 1.6>` which I interpret as: <yes>

- Implementation fee: **$600,000**
- Annual subscription: **$200,000**
- 3-year total: **$1,200,000**
- 5-year total: **$1,600,000**

Math checks out:

- 3-year: 600k + (200k×3)=600k → 1.2M
- 5-year: 600k + (200k×5)=1.0M → 1.6M

**How to present it cleanly**
Put this in a pricing table with explicit rows:

- Implementation (one-time)
- Annual subscription (recurring)
- Optional add-ons (priced)
- In-kind contributions (clearly marked as credits or offsets; don’t mix them into totals without labeling)

Procurement readers hate “blended totals” unless the arithmetic is extremely transparent.

---

### 5.3 Cover letter and authorized contacts

- You chose **no cover letter**. Fine.
- You chose **no authorized contacts page**. Also fine.

**But:** replace them with a tight contact box as described above so it doesn’t feel like something is missing. <yes>

---

### 5.4 Demo credentials handling and rate limiting <yes>

You’ve decided:

- credentials in the appendix
- clear “demo-only / not production” disclaimer
- environment available for the full review period

That’s the right call.

**Rate limiting: do not fully disable it.**
Instead:

- **Raise thresholds** enough that evaluators won’t hit it during normal use.

  Example approach:
  - allow ~30 login attempts per 15 minutes per account/IP before throttling
  - lockout after repeated failures still exists, but with a clear unlock path

- Add a line in the demo appendix:
  - “If you get locked out, email `support@solsticeapp.ca` for immediate unlock.”

**Why I’m pushing this:**
Rate limiting is part of your security story. Disabling it entirely makes your security claims feel “demo-only.” But being too aggressive will frustrate evaluators. The middle ground is generous thresholds + quick unlock support.

**One more very practical addition**
Add a “Reset demo data” mechanism (even if it’s manual for you) so if an evaluator changes settings or creates noise, you can restore a known baseline fast.

---

### 5.5 Video delivery method <yes>

Your plan is strong:

- unlisted YouTube links as primary
- MP4 backup in ZIP
- use youtu.be short links, no QR codes

**Two additions I’d make**

1. Add **durations** in the video index (e.g., “V3 – Import Wizard (4:10)”).
2. Add a one-liner fallback everywhere videos are referenced:
   - “If YouTube is blocked, see `/videos/` in the submission ZIP.”

---

### 5.6 Branding choice: viaSport palette for proposal

Good call. It aligns with “make it easy to mentally map to their world.”

**Just keep it restrained:**

- primary teal for headers/rules
- light mint for callouts
- avoid neon greens for body elements (use sparingly as “status/success” only)

Also ensure grayscale printing still works. <we have docs/sin-rfp/viasport-brand-colors.md>

---

## 6) The sin-uat branding question: should you match the website branding?

You asked if updating `sinuat.solsticeapp.ca` to follow the website’s branding is a good idea.

### My take

**Yes—if you do it as “tenant theming capability,” not as a cosmetic reskin.** <see docs/tickets/VIASPORT-BRANDING-UPDATE.md and see if we want to update at all>

Because:

- It directly supports your missing UI-AGG-007 “design consistency / branding” evidence.
- It helps evaluators imagine adoption (“this looks like it belongs to us”).

### The guardrails (important)

To avoid looking like you’re impersonating viaSport or implying endorsement:

- **Do not use viaSport’s logo** unless you have explicit permission. <agree>
- Use **colors + typography style**, but label it clearly:
  - “viaSport demo theme (evaluation environment)” <basically we will say that for UX we have initially used a design compatible with Viasport's branding, but during discovery we will work directly to follow explicit brand guidelines and improve design and ux based on user research>

- Add a persistent small banner in the app header for demo:
  - “Evaluation environment — synthetic data — not production”

### Best version (if you can swing it)

Add a simple toggle:

- Theme: `Solstice` / `viaSport demo theme`

That turns “branding debate” into “we support multi-tenant branding,” which is objectively valuable.

---

## 7) Action items I would turn into tickets immediately

### Must-do (quality / scoring / risk)

1. **Fix all domain/email typos** (`solticeapp.ca` vs `solsticeapp.ca`, `sinuat` vs `sin-uat`) everywhere.
2. **Standardize figure + video IDs** and make crosswalk references match.
3. **Add evaluator-path lines** to evidence callouts (where to click in sin-uat).
4. **Implement or explicitly scope** the three missing items:
   - TO-AGG-002 onboarding walkthrough
   - UI-AGG-005 search/filter
   - UI-AGG-007 design consistency montage / theming proof

### Strongly recommended (makes eval smoother)

5. Retake screenshots in a **single controlled capture setup** (same viewport size, same data baseline, consistent crop rules).
6. Add a **one-page “Assumptions / Dependencies / Finalization Scope”** table early.
7. Add **video durations + fallback note** (“see ZIP if blocked”).

---

## 8) Quick note on your “retake all evidence screenshots” plan

That’s a good instinct, especially if you’re moving to a consistent branded visual system.

If you do it, enforce consistency:

- same browser window size
- same zoom
- same seed dataset state
- same naming convention tied to figure IDs
  (so “Figure DM-1” always maps to the exact same file)

That consistency is what makes the evidence pack feel professional instead of “screenshots we grabbed.”

---

If you want one high-leverage next step: **lock the figure/video numbering + evidence index first**, then design layouts around that. It prevents you from redoing captions and crosswalk references later when things move around.
