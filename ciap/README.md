# KSP Crime Intelligence & Analytics Platform (CIAP)

CIAP is a Zoho Catalyst-based crime intelligence platform for Karnataka Police.
It combines an operational FIR backbone with analytics, forecasting, alerts, AI copilot workflows, and geospatial intelligence.

## What Is In This Repo

- `src/` - React + TypeScript frontend
- `backend/functions/` - Catalyst Functions / Express backend
- `database/schema.sql` - Catalyst Data Store schema extension
- `database/nosql-collections.json` - Catalyst NoSQL collection definitions
- `backend/smartbrowz-templates/` - report templates for PDF generation
- `.github/workflows/` - CI/CD pipeline for Catalyst deployment

## Core Design Rules

- The Karnataka Police FIR ERD is the operational source of truth.
- Existing FIR entities, relationships, foreign keys, and business rules must remain intact.
- Analytics features are added as extension tables and NoSQL collections.
- Stratus is used for files, scans, media, and generated documents.
- Catalyst Cache is intended for dashboards, KPIs, heatmaps, and AI response caching.

## Functional Areas

- Command Center
- Geo Heatmap
- Crime Pattern Discovery
- Risk Analysis
- Forecasting
- Link Analysis
- Repeat Offender Intelligence
- Modus Operandi Intelligence
- Anomaly Detection
- Investigation Timeline
- Alerts Center
- SCRB Reports
- AI Copilot
- Administration
- Settings

## Backend Overview

The backend is organized as Catalyst Functions with Express route modules:

- `auth`
- `crime` - read-only intelligence access over official `CaseMaster` FIR records
- `alerts`
- `forecasting`
- `risk`
- `ingestion`
- `reports`
- `ai`
- `admin`

## Data Layers

### Catalyst Data Store

Operational FIR and analytics tables live here. The repo currently includes:

- official FIR ERD entities: `CaseMaster`, `ComplainantDetails`, `Victim`, `Accused`, `ArrestSurrender`, `Act`, `Section`, `CrimeHead`, `CrimeSubHead`, `District`, `State`, `Unit`, `Employee`, `Court`, `ChargesheetDetails`, and related masters
- extension tables for predictions, forecasts, hotspots, explanations, patrol recommendations, resource allocation, audit, and model history

### Catalyst NoSQL

Used for:

- link-analysis graphs
- copilot conversations
- investigation timelines
- AI explanations
- signal inbox records

### Catalyst Stratus

Used for:

- evidence
- CCTV
- images
- videos
- FIR scans
- OCR outputs
- SmartBrowz-generated PDFs
- attachments

## Local Development

```bash
npm install
npm run dev
```

Backend function package:

```bash
cd backend/functions
npm install
npm start
```

## Deployment

The repository includes a Catalyst CI/CD workflow at:

- `.github/workflows/catalyst-deploy.yml`

## Notes

- The current codebase is still a scaffold, not a finished production deployment.
- Several backend modules already exist and should be wired to the final Catalyst services and the official FIR ERD.
- The schema extension is intentionally additive so the operational database can remain stable.
