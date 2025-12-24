# Example RFP Response - Storage Subsystem Replacement

## Workers' Compensation Board - Alberta, RFP 1209BB

> **Note:** This is a sample excerpt from a real RFP response for a storage subsystem replacement project. It demonstrates the structure, tone, and level of detail expected in government/enterprise RFP responses.

---

## 1. INTRODUCTION

Interdynamix Systems (IDX) and Hitachi Data Systems (HDS) welcome the opportunity to respond to the Workers' Compensation Board – Alberta (WCB) Request for Proposal (RFP) for a Storage Subsystem replacement.

The following response is respectfully submitted. In an effort to minimize the effort required to evaluate this response, the format follows the WCB's requested response format. To better facilitate the evaluation process, we would like to also point out the following:

- To maintain the WCB's section numbering schema, placeholders for sections not requested in the response are identified with 'INTENTIONALLY BLANK'.
- WCB RFP original content or Addendum/Clarification content is included in this response, in each section, and is distinguishable by being presented in BLUE.

---

## 2. EXECUTIVE SUMMARY

Hitachi Data Systems and Interdynamix System are pleased to respond to Worker's Compensation Board Storage Subsystem Replacement RFP #1209BB. Both organizations believe a company's information is a strategic asset. That's why we continue to develop and improve storage solutions with the performance, availability, and scalability you need to maximize ROI and minimize risk.

### Key Highlights

**TCO:** We believe we will save WCB costs by selecting our solution. Based on our initial assessment, our calculations indicate that we could easily save WCB costs taking into consideration key factors such as Performance, Floor Space Efficiency, Power/Cooling Efficiency, Capacity Improvements, etc.

**Price Does Not Equal Cost:** The total cost of acquisition (TCA) for storage is roughly only 20% of TCO. Over time, the TCA will become less and less significant. Labor, maintenance, power and cooling currently drive a higher cost (some 3 to 4 times higher) than acquisition alone.

**Initial Investment:** HDS executive management and Interdynamix see WCB as a Key Strategic account. We have leveraged funds to deliver a onetime initial purchase discount in the range of over $200,000 off list price.

**Technology:** HDS has proven, reliable, and award winning technology with key focus on scalability, migration, and dynamic provisioning. Key ingredients include:

- Storage virtualization
- Thin provisioning
- Dynamically tiered storage
- Common storage management
- Capacity efficiency
- Efficient migration
- Integrated archive

### Our Proposed Solution

Based on your defined requirements and information we've gathered in conversation from your teams previously we are proud to offer the Hitachi Adaptable Modular Storage 2300 platform. This is a highly available solution that will provide a reliable and cost-effective tier 2 platform for WCB while delivering all the performance and reliability you would expect from a tier 1 solution.

---

## 5. VENDOR CAPABILITIES

### 5.4.1 Corporate Profile

**Hitachi Data Systems**

Hitachi Data Systems is a wholly owned subsidiary of Hitachi Ltd.

- Hitachi Ltd. is one of the world's largest integrated electronics companies
- Founded in 1910
- Manufactures over 20,000 products
- 390,000 employees; over 2000 PhDs
- Total FY07 sales of $112.2B
- FY07 R&D Investment: $4.3B

**Interdynamix Systems**

Interdynamix Systems is western Canada's leading high-end Enterprise Infrastructure and Integration Services firm. Operating as a privately held, self-funded organization, Interdynamix has experienced year over year growth in revenue and profit since its inception in 1995.

The Interdynamix Center of Excellence represents a multi-million dollar enterprise infrastructure technology investment, contributing to customer success through:

- Skills Development
- Simulation of Customer Environments
- Project Implementation Planning and Testing

### 5.4.2 Project Team

| Name           | Position                       | Experience          | Home Base     | Role                               |
| -------------- | ------------------------------ | ------------------- | ------------- | ---------------------------------- |
| John Antonio   | Supplier Project Manager       | 25 Years in IT      | Edmonton, AB  | Delivery Oversight                 |
| Artur Kusiak   | Storage Engineer               | 13 Years in IT      | Edmonton, AB  | SAN and Open System Implementation |
| Eric Treptow   | Principal Technical Consultant | 30 years in IT      | St. Louis, MO | Hitachi Mainframe Specialist       |
| Richard Lebeuf | Sr. Technical Engineer         | 25 years experience | Edmonton      | Hitachi Product Specialist         |

### 5.4.3 References

**TELUS**

- Contact: Brian Lakey, Vice President, TELUS Technical Strategy
- Project: Multi-Site Consolidated Enterprise Storage Infrastructure
- Description: Interdynamix has worked with TELUS Network Operations to consolidate their mission critical data on to the Hitachi Data storage platform as part of a larger data management and protection strategy.
- Relationship: TELUS has been an Interdynamix Customer for over 14 years.

---

## 6. MIDRANGE STORAGE SUBSYSTEM REQUIREMENTS

### 6.1 CRITICAL REQUIREMENTS

The requirements and specifications listed in this section are considered critical to procuring a Midrange Storage Subsystem replacement solution. All items included in this section Must be part of the proposed solution.

#### 6.1.1 Formatted Disk Capacity

Storage sizes are expressed as 1 GB is 1,073,741,824 bytes and 1 TB is 1,099,511,627,776 bytes.

**Table 5: Five Year Capacity Projection – Midrange Storage Subsystem**

| Year                    | Current | 2012 | 2013 | 2014 | 2015 | 2016 |
| ----------------------- | ------- | ---- | ---- | ---- | ---- | ---- |
| Formatted Capacity (TB) | 46.7    | 46.7 | 56.0 | 67.2 | 80.7 | 96.8 |
| Capacity Increase/Year  | -       | -    | 9.3  | 11.2 | 13.5 | 16.1 |

**Option One Capacity - 2012:**

- Disk Type: 600 GB SAS 15k RPM Drives
- Number of Disks: 136
- Raid Sets: Qty 17 RAID 6 (6 data + 2 parity) Sets
- Raw Storage Capacity: 75.94 TB
- Usable Storage Capacity (Base 2): 51.8 TB

#### 6.1.2 RAID Arrays

We have selected a 600 GB size drive to match capacity with performance characteristics. The choice of RAID 6 was determined based on reliability aspects:

- R5: 100% data loss on double drive failure
- R6 and R10: 0% data loss on double drive failure

From a reliability perspective, RAID 6 is obviously preferable over RAID 5.

#### 6.1.7 Redundancy

The AMS 2300 has been designed as a completely redundant and highly available solution with no single point of failure. All components are hot swappable including:

- Controllers
- Disks
- Power Supplies
- Cache
- Fans
- Batteries
- Disk Enclosures

---

## 6.4.10 Point-in-Time Copy Replication Services

**Requirements:**

- Describe and justify the copy replication services for the proposed solution
- State compliance on ability to provide copy replication services to duplicate a volume within two seconds
- Confirm FlashCopy Version 2 compliance

**Response:**

Using Copy-On-Write (PIT copy software) a snapshot can be taken and a volume accessed within 2 seconds. The software included in the proposed solution can easily satisfy this requirement providing complete full volume clones and multiple point in time copies.

Our proposed solution includes our In-System replication bundle:

- **ShadowImage**: Full volume clones - provides non-disruptive, high-speed data replication for decision support, software testing, or backup operations
- **Copy-On-Write**: Snapshot/PIT copies - rapidly creates up to 32 point-in-time copies of any data volume without impacting host service or performance levels

---

## 7. PRICING RESPONSE

### 7.1 PRICING REQUIREMENTS

- All prices Must be quoted in Canadian dollars
- The Federal Government has exempted the WCB from GST and HST (exemption number R124072513)
- The WCB reserves the right to conduct periodic cost/price audits
- Any costs not identified in Section 7 will be the responsibility of the Vendor

### 7.1.1 Pricing Evaluation Overview

The pricing evaluation will be based on a fixed five (5) year pricing proposal. A Total Cost of Ownership ("TCO") over five (5) years calculation will be performed to determine the total price for each Proposal.

### 7.5 ADDITIONAL FEATURES/VALUE ADDED

| Item                                  | Value          |
| ------------------------------------- | -------------- |
| Installation Services (3 days)        | $6,000.00      |
| Trade-In Value for Existing Equipment | $5,000.00      |
| Disposal Services                     | $3,000.00      |
| **TOTAL VALUE ADDED**                 | **$14,000.00** |

---

## APPENDICES

### Appendix A – Addenda/Clarifications

The following Addenda/Clarifications have been received. The modifications to the RFP documents noted therein have been considered and the effects are included in the Proposal prices.

- Addendum/Clarification #1: Received March 15, 2012
- Addendum/Clarification #2: Received March 21, 2012

### Appendix B – Agreement

The following files form part of this RFP:

- Purchase Order Terms and Conditions (for equipment purchases)
- Performance Based Services Agreement (for service engagements)
- Standard Terms & Conditions of Performance Based Services Agreement

### Appendix C – Consent Form

Enclosed is our Proposal submitted in response to RFP 0908BB – Storage Subsystem Replacement. The Vendor consents to the use of the information in the Proposal by the WCB or its agents to enable evaluation and other program purposes.

**Vendor:** Interdynamix Systems
**Contact:** Devin Vandenberg
**Authorized Signature:** Sandro Torrieri, President

---

_This sample demonstrates the structure and content expected in enterprise RFP responses, including executive summaries, technical specifications, pricing breakdowns, and formal appendices._
