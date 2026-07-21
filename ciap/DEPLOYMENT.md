# KSP CIAP Deployment Guide

This guide details the deployment process for the Karnataka State Police Crime Intelligence & Analytics Platform (CIAP) using Zoho Catalyst Serverless infrastructure.

## Prerequisites

1. **Node.js** (v18.x)
2. **Zoho Catalyst CLI** (`npm install -g zcatalyst-cli`)
3. A Catalyst Account with a configured Project (`CIAP_KSP_PROD`)
4. Catalyst API token for automated deployments.

## CI/CD Architecture

The application utilizes **GitHub Actions** (`.github/workflows/catalyst-deploy.yml`) to automatically test, build, and deploy to Catalyst whenever code is merged to the `main` branch.

### Secrets Configuration in GitHub

Ensure the following secrets are added to the repository settings:
- `CATALYST_CLI_TOKEN`: The access token generated from the Catalyst Console.
- `CATALYST_ORG_ID`: The KSP organization ID within Catalyst.

## Manual Deployment

If you need to deploy manually from a local machine:

1. **Login to Catalyst CLI:**
   ```bash
   zcatalyst login
   ```
2. **Install all dependencies and build frontend:**
   ```bash
   npm install
   npm run build
   ```
3. **Deploy entirely to production:**
   ```bash
   zcatalyst deploy
   ```

## Infrastructure Components

When running `zcatalyst deploy`, the CLI references `catalyst.json` to deploy the following services:

1. **Frontend (`client`)**: The Vite + React single-page application is uploaded to Catalyst Web Client Hosting.
2. **Backend APIs (`functions`)**: The Node.js Express application inside `backend/functions` is deployed as a Catalyst Advanced I/O function.
3. **Workflows (`circuits`)**: Event-driven triggers mapped in `backend/circuits/index.js`.
4. **Scheduled Tasks (`cron`)**: Background processes mapped in `backend/cron/index.js`.

## Database Schema Initialization

Before the first run, the SQL database schema must be initialized:
1. Open the Catalyst Console → Data Store.
2. Ensure you are in the `Production` environment.
3. Execute the SQL definitions found in `database/schema.sql` to generate the 13 tables and seed data.
4. Execute the NoSQL definitions found in `database/nosql-collections.json`.

## Catalyst ML Services Configuration

Ensure the AI services are configured per `backend/ml-config.json`:
1. **QuickML**: Create the `model_quickml_rag_ksp_v1` using Llama-3-8B.
2. **Zia AutoML**: Configure the Time-Series forecasting model targeting the `FIR` table incident counts.
3. **SmartBrowz**: Ensure the `/report-template` route is accessible, which renders the `backend/smartbrowz-templates/monthly-report.html`.

## Monitoring and Logs

- Logs for backend API failures can be monitored in the Catalyst Console under **Logs**.
- API performance metrics are available in Catalyst APM.
