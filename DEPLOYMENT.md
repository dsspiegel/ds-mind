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

## Step 3: Deploy All
The project includes a `Makefile` to automate building and deploying. It handles:
1. Building & Deploying Backend.
2. Getting the live Backend URL.
3. Building & Deploying Frontend (with the Backend URL baked in).

Run this single command:
```bash
# Ensure your API Key is loaded
source .env

# Deploy everything
make deploy-all
```

*Note: The first run might take a few minutes as it builds containers.*

## Step 5: Access
Open the **Frontend URL** provided by the command output.
