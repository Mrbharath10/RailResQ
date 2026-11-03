# RailResQ System Architecture

## 1. High-Level Concept
RailResQ is structured as an **Agentic Decision-Support Architecture** for railway emergency management.

```mermaid
graph TD
    Passenger[Passenger Portal] -->|Report Submission| API[FastAPI Gateway]
    API --> Orchestrator[Coordination Orchestrator]
    
    subgraph AI & Deterministic Engines
        Orchestrator --> Agent1[Incident Understanding Agent]
        Orchestrator --> Agent2[Priority Assessment Engine]
        Orchestrator --> Agent3[Duplicate Detection Engine]
        Orchestrator --> Agent4[Resource Coordination Agent]
        Orchestrator --> Agent5[Handover Recommendation Agent]
        Orchestrator --> Agent6[Acknowledgement Monitor]
    end

    subgraph Data & Context Providers
        Agent5 --> TrainProvider[Railway Context Provider]
        TrainProvider --> MockTrain[Simulated Schedule Dataset]
        TrainProvider --> LiveTrain[Live Railway API Adapter]
    end

    Orchestrator --> Operator[Control-Room Operator Dashboard]
    Operator -->|Human Approval| Action[Resource Dispatch & Station Handover]
    Action --> Audit[Audit Trail & Event Log]
```

## 2. Key Architecture Principles
1. **Human-in-the-Loop:** AI agents extract information, compute priority scores, and recommend handover plans, but human operators must review and confirm consequential actions.
2. **Deterministic Rules Over Blind LLMs:** Urgency calculation and priority rules are strictly deterministic. LLM outputs are structured and validated before ingestion.
3. **Dual Railway Context:** Explicitly separates **SIMULATED** mock data from **LIVE** external railway telemetry.
4. **Resilient Failover:** If an AI provider or external railway API is unavailable, the system fails over safely with clear indicator badges.
