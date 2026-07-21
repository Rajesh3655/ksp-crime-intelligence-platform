# CIAP AI Service

Catalyst AppSail service for production AI inference.

## Endpoints

- `GET /health`
- `POST /analyze` - DBSCAN hotspot, Isolation Forest anomaly, XGBoost-compatible prediction output, MO similarity, NetworkX metrics, explainability
- `POST /similarity` - Crime DNA comparison between two FIR feature records

The service accepts FIR-derived features from Catalyst Functions and returns model outputs with confidence, feature importance, historical comparison, and recommendations.

## Local Run

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8080
```
