.PHONY: setup seed local build deploy deploy-firebase

PROJECT_ID ?= $(shell gcloud config get-value project)

setup:
	pip install -r requirements.txt
	gcloud auth application-default login
	firebase login

seed:
	bq query --use_legacy_sql=false < setup/seed_bigquery.sql

local:
	docker compose up --build

build:
	gcloud builds submit --tag gcr.io/$(PROJECT_ID)/your-ds-agent-backend -f Dockerfile.backend
	gcloud builds submit --tag gcr.io/$(PROJECT_ID)/your-ds-agent-frontend -f Dockerfile.frontend

deploy: build
	gcloud run deploy your-ds-agent-backend --image gcr.io/$(PROJECT_ID)/your-ds-agent-backend --allow-unauthenticated
	gcloud run deploy your-ds-agent-frontend --image gcr.io/$(PROJECT_ID)/your-ds-agent-frontend --allow-unauthenticated

deploy-firebase:
	firebase deploy --only hosting
