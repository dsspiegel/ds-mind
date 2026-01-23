# Deployment Guide

## Prerequisites
1. **Google Cloud Project**: You need a project with billing enabled.
2. **Tools**: `gcloud` CLI installed and authenticated (`gcloud auth login`).

## Step 1: Firebase Console Setup
Yes, you need to go to [Firebase Console](https://console.firebase.google.com/):
1. **Create a Project** (or use existing).
2. **Build > Firestore Database**: Check if it's initialized.
   - If you see "Create Database", click it. Choose **Production mode** and a location (e.g., `us-central1`).
   - If you see a list of data/collections, **you are good to go**.
3. **Build > Store > Get Started**: (Optional) if you need file uploads later, but Firestore is critical.
4. **Project Settings**: Get your **Project ID**.

## Step 2: Enable APIs
Run these commands in your terminal:
```bash
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    firestore.googleapis.com \
    aiplatform.googleapis.com \
    bigquery.googleapis.com
```

## Step 3: Deploy Backend
```bash
# Set your project ID
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# Deploy Backend
gcloud run deploy ds-agent-backend \
  --source . \
  --dockerfile Dockerfile.backend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_API_KEY=your_gemini_api_key
```
*Note details: check the URL output.*

## Step 4: Deploy Frontend
1. Update `frontend/src/lib/api.ts` or environment variable to point to the **Backend URL** from Step 3.
   - Ideally set `NEXT_PUBLIC_API_URL` during build time.

```bash
# Deploy Frontend
gcloud run deploy ds-agent-frontend \
  --source . \
  --dockerfile Dockerfile.frontend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL=https://your-backend-url.run.app
```

## Step 5: Access
Open the **Frontend URL** provided by the command output.
