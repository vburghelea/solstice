# Evaluator Quick Reference

**Austin Wallace Tech Corporation - viaSport RFP Response**

---

## Evaluation Environment

**URL:** https://sinuat.solsticeapp.ca

**Environment:** sin-uat (User Acceptance Testing)

**Data:** Synthetic test data only (no viaSport confidential data)

---

## Demo Credentials

| User                      | Password        | Role                       | Access Scope                                  |
| :------------------------ | :-------------- | :------------------------- | :-------------------------------------------- |
| `viasport-staff@demo.com` | demopassword123 | viaSport Admin + Org Owner | Full access including Analytics (recommended) |
| `global-admin@demo.com`   | demopassword123 | Platform Admin             | Platform admin pages only                     |
| `pso-admin@demo.com`      | demopassword123 | BC Hockey Admin            | Organization features + Analytics             |
| `club-reporter@demo.com`  | demopassword123 | Club Reporter              | Reporting + Analytics                         |
| `member@demo.com`         | demopassword123 | Viewer                     | View-only (no Analytics)                      |

**Recommended:** Start with `viasport-staff@demo.com` for full access to all features.

**MFA:** Disabled on all demo accounts for convenience. To evaluate the MFA capability, navigate to **Settings > Security** to enroll your own authenticator app.

**Credentials valid during evaluation period only.** Credentials will be rotated after review concludes.

---

## 15-Minute Walkthrough

| Step | Action                                              | Requirement |
| :--: | :-------------------------------------------------- | :---------- |
|  1   | Login with viasport-staff@demo.com                  | SEC-AGG-001 |
|  2   | View dashboard and navigation                       | UI-AGG-002  |
|  3   | Admin → Forms → Open a form → Submit test data      | DM-AGG-001  |
|  4   | Admin → Import → Upload CSV → Map fields → Complete | DM-AGG-006  |
|  5   | Admin → Reporting → Create cycle → Assign tasks     | RP-AGG-003  |
|  6   | Analytics → Explore → Build pivot → Export CSV      | RP-AGG-005  |
|  7   | Admin → Audit → Filter by date → Verify hash chain  | SEC-AGG-004 |
|  8   | Settings → Security → Enable MFA (optional)         | SEC-AGG-001 |

---

## Video Demonstrations

Videos are available via YouTube (primary) or in the `/videos/` folder of this submission.

| ID  | Title                      | Duration | YouTube             |
| :-- | :------------------------- | :------- | :------------------ |
| V1  | Authentication & MFA Login | 24s      | [youtu.be link TBD] |
| V2  | Form Submission Workflow   | 29s      | [youtu.be link TBD] |
| V3  | Data Import Wizard         | 54s      | [youtu.be link TBD] |
| V4  | Reporting Workflow Cycle   | 10s      | [youtu.be link TBD] |
| V5  | Analytics & Export         | 26s      | [youtu.be link TBD] |
| V6  | Audit Trail Verification   | 25s      | [youtu.be link TBD] |

**If YouTube is blocked:** See `/videos/` folder in the submission ZIP.

---

## Support

**Email:** support@solsticeapp.ca

**Response time:** Within 4 business hours during evaluation period

**If locked out:** Email support for immediate account unlock

---

## Key Documents

| Document                      | Location                                        |
| :---------------------------- | :---------------------------------------------- |
| Full RFP Response             | `Austin-Wallace-Tech-viaSport-RFP-Response.pdf` |
| Prototype Evaluation Guide    | RFP Response, Section 2                         |
| System Requirements Crosswalk | RFP Response, Section 10                        |
| Evidence Pack                 | `/evidence/` folder                             |
| Videos                        | `/videos/` folder                               |

---

**Austin Wallace Tech Corporation**
1403-728 Yates Street, Victoria, BC V8W 0C8
austin@solsticeapp.ca | 604-603-8668
