# Phase 4 ML Lifecycle

CIAP now has the structure of a continuously learning AI platform.

## Training Pipeline

Training data is generated from the official FIR schema:

- `CaseMaster`
- `Victim`
- `Accused`
- `ComplainantDetails`
- `ArrestSurrender`
- `CrimeHead`
- `CrimeSubHead`
- `District`
- `Unit`
- `Employee`
- `ChargesheetDetails`
- `Act`
- `Section`

The Functions route `POST /api/ml/datasets/build` extracts features, versions the dataset, caches it, and stores the dataset artifact in Stratus when available.

## Feature Engineering

Feature rows include:

- crime frequency inputs
- district and station identifiers
- geo coordinates
- temporal vectors
- case duration inputs
- accused/victim counts
- legal act/section complexity
- repeat offender signal placeholder
- MO text source for embeddings

Feature vectors are stored in `AIFeatureStore` and semantic vectors are stored in NoSQL `EmbeddingStore`.

## Model Registry

`MLModelRegistry` tracks:

- model ID and version
- algorithm
- hyperparameters
- accuracy, precision, recall, F1, AUC
- training dataset version
- deployment status
- approval status
- artifact path
- supported tasks

Candidate models default to `shadow`; promotion is done through `POST /api/ml/registry/:id/promote`.

## AppSail AI Training Service

`backend/appsail/ai-service` exposes:

- `POST /train`
- `POST /evaluate`
- `POST /drift`
- `POST /shadow-compare`
- `POST /analyze`
- `POST /similarity`

Inference no longer needs to fit from a single request payload. The lifecycle APIs build datasets and register model artifacts first, while request-time inference consumes versioned metadata and cached features.

## Drift And Continuous Learning

Nightly cron performs:

1. build recent training features
2. detect data/concept/prediction/feature drift
3. index embeddings
4. train a candidate model
5. place candidate into shadow deployment

Drift events are written to `MLDriftEvent`. Drift circuits queue approval workflows.

## Audit Trail

Every prediction can be stored in:

- `MLPredictionAudit` for model/version/input/output history
- `ImmutableIntelligenceHistory` for append-only intelligence events

History is never overwritten.

## Vector Search

`GET /api/ml/vector-search?q=...` performs semantic retrieval over `EmbeddingStore`, supporting:

- similar FIR search
- similar MO search
- related robbery/cyber fraud pattern search
- natural-language retrieval for AI Copilot RAG

## Demo Story

1. Historical FIRs are extracted into a versioned dataset.
2. A candidate risk model is trained and registered.
3. Artifacts are recorded in Stratus manifests.
4. Drift check runs and queues retraining if needed.
5. A new FIR triggers the intelligence Circuit.
6. Persisted features and registered model metadata produce predictions.
7. Explainable AI shows SHAP-style weights, confidence, uncertainty, and recommendation.
8. Graph, map, SCRB briefing, Copilot, SmartBrowz, and Push Notifications update.
