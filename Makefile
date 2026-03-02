.PHONY: setup seed local deploy-backend deploy-frontend deploy-all

# Load .env file automatically if it exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

# Clean quotes from variables if they exist (Make includes quotes from .env)
GOOGLE_API_KEY := $(subst ",,$(GOOGLE_API_KEY))
GOOGLE_CLOUD_PROJECT := $(subst ",,$(GOOGLE_CLOUD_PROJECT))

# Use GOOGLE_CLOUD_PROJECT from .env if set, otherwise fallback or gcloud config
PROJECT_ID ?= $(GOOGLE_CLOUD_PROJECT)
ifeq ($(PROJECT_ID),)
    PROJECT_ID := $(shell gcloud config get-value project)
endif

REGION ?= us-central1
API_KEY ?= $(GOOGLE_API_KEY)

setup:
	pip install -r requirements.txt
	gcloud auth application-default login
	firebase login

seed:
	bq query --use_legacy_sql=false < setup/seed_bigquery.sql

local:
	docker compose up --build

deploy-backend:
	@echo "🚀 Deploying Backend..."
	gcloud builds submit --config cloudbuild.backend.yaml .
	gcloud run deploy ds-agent-backend \
		--image gcr.io/$(PROJECT_ID)/ds-agent-backend \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--set-env-vars GOOGLE_CLOUD_PROJECT=$(PROJECT_ID),GOOGLE_API_KEY=$(API_KEY)

deploy-frontend:
	@echo "🔍 Fetching Backend URL..."
	$(eval BACKEND_URL := $(shell gcloud run services describe ds-agent-backend --platform managed --region $(REGION) --format 'value(status.url)'))
	@echo "✅ Backend URL: $(BACKEND_URL)"
	@echo "🚀 Building Frontend (injecting API URL)..."
	gcloud builds submit --config cloudbuild.frontend.yaml --substitutions=_API_URL=$(BACKEND_URL) .
	@echo "🚀 Deploying Frontend..."
	gcloud run deploy ds-agent-frontend \
		--image gcr.io/$(PROJECT_ID)/ds-agent-frontend \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--set-env-vars NEXT_PUBLIC_API_URL=$(BACKEND_URL)

deploy-firebase:
	@echo "🌍 Configuring Firebase Hosting (Pretty URL)..."
	firebase deploy --only hosting --project $(PROJECT_ID)

deploy-all: deploy-backend deploy-frontend deploy-firebase
	@echo "🎉 Deployment Complete!"
