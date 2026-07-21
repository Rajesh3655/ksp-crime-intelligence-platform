# Phase 3 Production Readiness

## Catalyst Architecture

- Frontend: React/Vite hosted from Catalyst client/AppSail target.
- API: Catalyst Functions behind API Gateway with JWT auth, rate limiting, request logging, RBAC, and audit logging.
- AI Service: `backend/appsail/ai-service`, a Python FastAPI AppSail service.
- Data Store: official FIR ERD plus `AIFeatureStore`, `IntelligenceFinding`, `ImmutableIntelligenceHistory`, and generated report metadata.
- NoSQL: `CrimeIntelligence`, `InvestigationGraph`, `InvestigationTimeline`, `RepeatOffenderProfile`, `GeoIntelligenceLayer`, `CopilotConversation`, `SignalInbox`.
- Cache: feature/output cache for FIR intelligence, dashboards, graphs, hotspots, reports, and repeat offender profiles.
- Signals/Circuits/Cron: event driven intelligence pipeline and scheduled recomputation.
- SmartBrowz: executive, SCRB, district, officer, map snapshot, and investigation report generation.
- Push Notifications: critical intelligence alerts to officers.

## AI Pipeline

1. Signal receives new or updated CaseMaster event.
2. Catalyst Circuit calls the intelligence pipeline.
3. Feature extraction reads CaseMaster, Victim, Accused, ComplainantDetails, ActSectionAssociation, ArrestSurrender, and ChargesheetDetails.
4. Feature hash is checked against Catalyst Cache and `AIFeatureStore`.
5. Catalyst Functions call the AppSail AI service when `AI_SERVICE_URL` is configured.
6. AppSail returns DBSCAN hotspot, Isolation Forest anomaly, XGBoost-compatible prediction, MO similarity, NetworkX graph metrics, confidence, and explainability.
7. Functions persist NoSQL intelligence, graph, timeline, feature-store vectors, immutable history, and `IntelligenceFinding` outputs.
8. Push Notifications and SCRB update signals fire when thresholds are crossed.

## Model Endpoints

- `POST /analyze`
  - DBSCAN hotspot clustering
  - Isolation Forest anomaly scoring
  - XGBoost-compatible prediction output
  - Sentence-transformer-ready MO similarity fallback
  - NetworkX PageRank, betweenness, community detection
  - Explainability including SHAP-style feature weights
- `POST /similarity`
  - Crime DNA score across MO, language, location, time, and crime type.

## API Gateway And Security

All `/api/*` routes are protected by:

- Catalyst Authentication/JWT middleware
- RBAC hierarchy: Administrator, DGP, ADGP, IGP, DIG, SP, DSP, Inspector, Constable, SCRB Analyst
- District visibility enforcement
- Rate limiting
- Helmet security headers
- Request logging and audit logging for writes
- Joi validation on write-heavy routes

## Monitoring

`GET /api/monitoring/health` returns:

- API latency
- AI inference mode
- Cron status
- Signals/Circuits identifiers
- Cache health
- Prediction accuracy placeholder from model registry
- Model health
- Storage counters
- Error rate

## Demo Scenario

1. New FIR/CaseMaster event triggers `intelligencePipeline`.
2. Features are extracted and cached.
3. AI service computes risk, anomaly, MO similarity, prediction, hotspot, and graph metrics.
4. NoSQL documents update `CrimeIntelligence`, `InvestigationGraph`, `InvestigationTimeline`, and `RepeatOffenderProfile`.
5. Geo map consumes replay/hotspot APIs.
6. Link Analysis loads the graph.
7. SCRB briefing reads `IntelligenceFinding`.
8. Copilot answers with evidence and related intelligence outputs.
9. SmartBrowz report generation can export the executive intelligence bundle.
10. Push Notifications alert officers for critical risk.
