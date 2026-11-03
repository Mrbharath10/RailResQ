# RailResQ User & Demonstrator Guide

## Demonstration Credentials
For easy academic project defense, pre-seeded accounts are provided:

| Role | Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- |
| **Control-Room Operator** | `operator@railresq.gov.in` | `operator123` | Triage incidents, approve handover, dispatch squads |
| **Passenger** | `passenger@railresq.gov.in` | `passenger123` | Submit emergency reports, track response |
| **Administrator** | `admin@railresq.gov.in` | `admin123` | Configure priority rules, manage stations |

> **Tip:** You can also click the 1-Click Demo buttons on the Login page (`/login`) to sign in instantly!

---

## 1. Passenger Emergency Workflow
1. Navigate to `/passenger/report` or click **"Report Emergency"** on the sidebar.
2. Enter the train number (`12301`), coach (`B4`), and seat (`42`).
3. Select reporting language (e.g. English, Hindi, Tamil) and type the emergency description.
4. Click **"Submit Emergency Report Now"**.
5. Observe the instant AI triage summary, calculated priority, and recommended station handover.

---

## 2. Operator Control-Room Workflow
1. Navigate to `/operator/dashboard`.
2. Inspect incoming incidents sorted by priority.
3. Click **"Manage & Triage"** on any incident to open the Command Drawer:
   - Review AI Extracted Entities (symptoms, hazards, missing information).
   - Review Deterministic Safety Rules triggered.
   - Override or confirm priority (CRITICAL, HIGH, MEDIUM, LOW).
   - Review Intelligent Station Handover recommendation & click **"Approve Station Handover"**.
   - Dispatch an available Response Squad with a 5-minute acknowledgement deadline.
   - Click **"Record Ack"** to simulate team acknowledgement.
   - Click **"Mark Completed"** to resolve the incident and free the squad.

---

## 3. Academic Scenario Simulator Workflow (Evaluation Testbed)
1. Navigate to `/simulator`.
2. Select any of the 9 built-in emergency scenarios (e.g., *Cardiac Emergency*, *Smoke in AC Coach*, *Armed Threat*, *Duplicate Reports*, *Overdue Escalation*).
3. Click **"Execute Scenario Simulation"**.
4. Watch the multi-agent pipeline execute live through all 7 stages:
   - Stage 1: Emergency Report Ingestion
   - Stage 2: AI Understanding & Multilingual Extraction
   - Stage 3: Deterministic Safety Priority Engine
   - Stage 4: Duplicate Incident Detection
   - Stage 5: Station Handover Recommendation
   - Stage 6: Response Resource Matching
   - Stage 7: Acknowledgement Monitoring & Escalation
