# AI Model Documentation

## Intelligence Scores

Every FIR produces risk, severity, repeat-offender, gang probability, MO cluster, hotspot cluster, prediction, anomaly, and confidence scores. These are stored in NoSQL `CrimeIntelligence` and mirrored into audit/history tables.

## Models

- DBSCAN: identifies geospatial crime hotspots from CaseMaster latitude and longitude.
- Isolation Forest: flags unusual FIRs, suspicious officer workload, and rare crime patterns.
- XGBoost: produces short-range crime prediction scores.
- Sentence Transformers: clusters FIR descriptions and finds similar modus operandi.
- NetworkX: computes community detection, PageRank, centrality, and gang discovery.

## Explainability

Predictions include feature weights, historical evidence, confidence, and recommended action. Model lifecycle data is stored in `MLModelRegistry`, `MLPredictionAudit`, `MLDriftEvent`, and `HumanFeedback`.
