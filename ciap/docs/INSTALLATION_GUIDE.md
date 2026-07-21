# Installation Guide

```bash
npm install
cd backend/functions && npm install
cd ../..
npm run demo:seed -- --count=50000
npm run build
cd backend/functions && npm test -- --runInBand
```

Run the frontend:

```bash
npm run dev
```

Run the AppSail AI service locally:

```bash
cd backend/appsail/ai-service
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 9000
```
