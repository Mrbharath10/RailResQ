# RailResQ API Documentation

## Base URLs
- Local Development: `http://127.0.0.1:8000/api`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc Explorer: `http://127.0.0.1:8000/redoc`

---

## 1. Authentication Endpoints (`/api/auth`)
- `POST /register`: Register passenger or operator account.
- `POST /login`: Authenticate and receive JWT bearer token.
- `GET /me`: Retrieve profile of currently authenticated user.

---

## 2. Emergency Incident Endpoints (`/api/incidents`)
- `POST /`: Submit new emergency report. Triggers multi-agent pipeline (AI understanding, priority rules, duplicate detection, station handover).
- `GET /`: List all incidents with priority, category, status, and train filters.
- `GET /{id}`: Retrieve detailed incident record including handover recommendations and assigned squads.
- `PATCH /{id}`: Operator updates priority or category with audit explanation.
- `PATCH /{id}/status`: Transition incident status (TRIAGED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED).

---

## 3. Response Resources (`/api/resources`)
- `GET /`: List registered emergency teams with capability tags and availability status.
- `POST /`: Admin registers a new response resource at a station.
- `PATCH /{id}`: Modify resource availability (AVAILABLE, DISPATCHED, OFFLINE).

---

## 4. Resource Assignments & Acknowledgement (`/api/assignments`)
- `POST /`: Operator dispatches resource to an incident with configurable deadline (minutes).
- `GET /`: List active assignments.
- `PATCH /{id}/acknowledge`: Record team dispatch acknowledgement.
- `POST /check-deadlines`: Background agent check to flag overdue responses and trigger escalation alerts.

---

## 5. Intelligent Station Handover (`/api/handover`)
- `POST /recommend/{incident_id}`: Generate handover plan based on train context and hospital infrastructure.
- `GET /{incident_id}`: Retrieve current handover plan.
- `PATCH /{recommendation_id}/approve`: Operator approves or rejects the handover recommendation.

---

## 6. Duplicate Detection (`/api/duplicates`)
- `GET /`: List flagged duplicate reports with similarity score and explanation.
- `POST /review`: Operator confirms or rejects the duplicate match (never auto-merges).

---

## 7. Emergency Scenario Simulator (`/api/simulator`)
- `GET /scenarios`: List 9 pre-configured academic demonstration scenarios.
- `POST /run`: Execute full multi-agent pipeline and return stage-by-stage outputs.
