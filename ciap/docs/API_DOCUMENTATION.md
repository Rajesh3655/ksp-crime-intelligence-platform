# CIAP API Documentation

Base path: `/api`

## Intelligence

- `POST /intelligence/analyze/:caseMasterId` computes risk, severity, repeat-offender, gang, MO cluster, hotspot, prediction, anomaly, and confidence scores.
- `POST /intelligence/analyze-recent` computes intelligence for recent FIRs.
- `GET /intelligence/explain/:caseMasterId` returns explainable AI factors and recommended action.
- `GET /intelligence/graph/:caseMasterId` returns generated nodes and edges for link analysis.
- `POST /intelligence/repeat-offenders/recompute` refreshes repeat offender profiles from `Accused`.
- `GET /intelligence/geo-replay` returns weekly/monthly hotspot and prediction layers.
- `GET /intelligence/scrb-briefing` returns SCRB summary, trends, rankings, predictions, and deployment guidance.

## ML Lifecycle

- `POST /ml/datasets/build` creates a training snapshot.
- `POST /ml/train` trains a candidate model through the AI service.
- `GET /ml/registry` lists model versions.
- `POST /ml/promote/:modelId` promotes a model after approval.
- `POST /ml/drift` records drift checks.
- `POST /ml/feedback` stores human feedback for continuous learning.
- `POST /ml/embeddings/index` indexes FIR embeddings.
- `POST /ml/vector-search` finds similar FIR descriptions.
- `GET /ml/dashboard` returns registry, drift, feedback, and model health.

## Monitoring

- `GET /monitoring/health` checks Functions, data access, cache, AI service, and model registry status.
