# Google Doc Comments Mapping (Round 2)

Comments extracted from the Google Doc review (DraftRFP 2.html). Each comment is mapped to the source section and specific text being commented on.

---

## Comment Summary

| #   | Letter | Section                          | Brief Description                                                 |
| --- | ------ | -------------------------------- | ----------------------------------------------------------------- |
| 1   | [a]    | At a Glance                      | Change "TBD" to scheduled date                                    |
| 2   | [b]    | Key Highlights                   | Add community engagement framing to timeline                      |
| 3   | [c]    | Advisory Partner Profiles        | Bio added (acknowledgement)                                       |
| 4   | [d]    | Proposed Solution Statement      | Frame team as community-focused/led                               |
| 5   | [e]    | Proposed Solution Statement      | Soleil is Montreal-based, not BC                                  |
| 6   | [f]    | Backup, Recovery, and Encryption | Add AWS Backup Vault Lock for backup protection                   |
| 7   | [g]    | Backup, Recovery, and Encryption | Change "TBD" to scheduled implementation week                     |
| 8   | [h]    | Help Desk and Ticketing Model    | Change "Best effort" to "10 Business Days"                        |
| 9   | [i]    | Appendix B: System Architecture  | Replace ASCII diagram with actual diagram                         |
| 10  | [j]    | Regulatory Alignment             | Add transit encryption and SSL/HTTPS mention                      |
| 11  | [k]    | Security Model Summary           | Highlight encryption at rest, in transit, and processing controls |

---

## Detailed Comments

### Comment [a] (cmnt1)

**Section:** At a Glance
**Commented Text:** "final validation run TBD"
**Location:** Performance row in At a Glance table

> Change "final validation run TBD" to "Scheduled for Pre-Launch Phase." or equivalent

---

### Comment [b] (cmnt2)

**Section:** Key Highlights
**Commented Text:** "The proposed 30-week timeline targets Fall 2026 launch with comprehensive UX research and community engagement. The timeline enables proper user research with viaSport staff and PSO representatives, UAT with accessibility validation, and phased rollout. The core platform is already built, so the additional time focuses on getting the user experience right rather than building new features."
**Location:** Key Highlights section, timeline description

> Maybe something more directly stating the importance of community engagement in the process. This timeline allows us to recruit well and engage the community meaningfully instead of just checking a box kinda thing

---

### Comment [c] (cmnt3)

**Section:** Advisory Partner Profiles
**Commented Text:** "Multistakeholder system transformation (Designer at Coeuraj): Delivered multistakeholder research projects through workshops, interviews, and designed artifacts working with over 200+ participants. Applied methods such as systems thinking, foresight, and human-centered design for strategic outputs for clients."
**Location:** Soleil's bio/experience section

> Added a bio

_Note: This is an acknowledgement that the bio was added._

---

### Comment [d] (cmnt4)

**Section:** Proposed Solution Statement
**Commented Text:** "The team combines enterprise data engineering with direct sport sector operations experience. Soleil Heaney brings perspective as a PSO executive, ensuring the platform reflects how sport organizations actually work. [Soleil to confirm wording]"
**Location:** Team description paragraph

> I think we could frame this more as we are community focused or led by community which is why we have a member of the community on our team as a system navigator which will help us build a strong working relationship with the people who the product is intended for. Not only does Soleil have the experience she also connects us to the large community. Something like that. Maybe something about breaking down silos and being back by the community helps product longevity

---

### Comment [e] (cmnt5)

**Section:** Proposed Solution Statement
**Commented Text:** "BC based"
**Location:** Team member location description

> I'm based in Montreal, so we might have to reword this

---

### Comment [f] (cmnt6)

**Section:** Backup, Recovery, and Encryption Standards
**Commented Text:** "Not enabled (single-region for data residency)"
**Location:** Cross-Region Replication row in backup table

> How is the solution protecting backups? If possible I would suggest implementing something like AWS Backup Vault lock as this will provide an additional layer of defense that protects backups (recovery points) from inadvertent or malicious deletions.

---

### Comment [g] (cmnt7)

**Section:** Backup, Recovery, and Encryption Standards
**Commented Text:** "Final production drill TBD"
**Location:** Disaster Recovery testing row

> Change "Final production drill TBD" to "Scheduled for Implementation Week X."

---

### Comment [h] (cmnt8)

**Section:** Help Desk and Ticketing Model
**Commented Text:** "Best effort"
**Location:** Low priority target response time

> change the "Low" priority target from "Best effort" to "10 Business Days" or "Next Release Cycle."

---

### Comment [i] (cmnt9)

**Section:** Appendix B: System Architecture
**Commented Text:** ASCII art diagram ("+---------------------------------------------------------------+")
**Location:** System architecture visualization

> With the diagrams that have been generated I don't think this section is necessary or should be replaced with the actual high-level diagram that you have in the diagrams folder

---

## Action Items by Section

### 01-executive-summary/final.md (At a Glance)

- [ ] [a] Change "final validation run TBD" to "Scheduled for Pre-Launch Phase" in Performance row

### 01-executive-summary/final.md (Key Highlights)

- [ ] [b] Reframe 30-week timeline to emphasize meaningful community engagement (not just "checking a box")

### 02-vendor-fit/final.md (Advisory Partner Profiles)

- [ ] [c] Bio has been added (no action needed)
- [ ] [d] Reframe Soleil's description as community-focused/community-led, emphasizing connection to sport community and product longevity
- [ ] [e] Change "BC based" to reflect Montreal location (or remove location reference)

### 03-service-approach/infrastructure/final.md (Backup, Recovery)

- [ ] [f] Add AWS Backup Vault Lock as additional protection for backups against deletion
- [ ] [g] Change "Final production drill TBD" to "Scheduled for Implementation Week X"

### 03-service-approach/service-levels/final.md (Help Desk)

- [ ] [h] Change Low priority target from "Best effort" to "10 Business Days" or "Next Release Cycle"

### 08-appendices/final.md (Appendix B)

- [ ] [i] Replace ASCII system architecture diagram with actual diagram from diagrams folder

### 03-service-approach/data-warehousing/final.md (Regulatory Alignment)

- [ ] [j] Add transit encryption and SSL/HTTPS to Regulatory Alignment table

### 01-executive-summary/final.md (Security Model Summary)

- [ ] [k] Expand encryption description to highlight all three layers: at rest, in transit, and processing controls

---

## Additional Comments (Round 2.5 - 2026-01-08)

### Comment [j] (new)

**Section:** Regulatory Alignment
**Commented Text:** Regulatory Alignment table (PIPEDA row)
**Location:** Service Approach: Data Warehousing section

> Worth adding data transit is encrypted and APIs are SSL enabled

**Proposed Update:**

- Update PIPEDA row Implementation column from:
  "Canadian data residency, encryption, access controls, audit logging"
  to:
  "Canadian data residency, TLS 1.2+ encryption in transit, AES-256 at rest, access controls, audit logging"
- Or add new row: "Transport security | All APIs served over HTTPS (TLS 1.2+), no unencrypted endpoints"

---

### Comment [k] (new)

**Section:** 1.2 Security Model Summary
**Commented Text:** "encryption in transit and at rest"
**Location:** Standard Assumptions and Security Posture section

> I would highlight data security encryption at rest, in transit and table based encryption for processing controls

**Proposed Update:**
Expand the current sentence to explicitly list all three encryption layers:

Current:

> "encryption in transit and at rest"

Proposed:

> "encryption at rest (AES-256 via AWS KMS for database, storage, and backups), in transit (TLS 1.2+ for all API endpoints and database connections), and column-level encryption for processing controls on highly sensitive fields"

---
