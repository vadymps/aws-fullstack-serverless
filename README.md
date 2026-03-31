# AWS Fullstack Serverless Movie Catalog Demo

This repo will host a minimal AWS serverless demo with:
- Angular frontend hosted on S3
- API Gateway HTTP API + AWS Lambda (Python)
- MongoDB Atlas free tier
- Terraform for AWS infrastructure
- GitHub Actions CI/CD (OIDC, no long-lived keys)

## About
AWS Fullstack Serverless Movie Catalog: a lightweight Angular SPA backed by a
serverless API, built to showcase a clean frontend experience with secure,
scalable AWS services.

![AWS movie catalog architecture](frontend/src/assets/aws-movie-catalog-architecture)

### Architecture Summary
- Frontend delivery: S3 static website with CloudFront acceleration. All non-API
  routes are served by the S3 origin.
- API layer: CloudFront routes `/api*` requests to an HTTP API in API Gateway,
  with a Lambda function that strips the prefix before forwarding.
- Auth & data: Cognito issues JWTs for protected routes. The Lambda function
  uses a MongoDB connection string to fetch movie data. Favorites require a
  valid token.

## Structure
- `frontend/` Angular app (placeholder)
- `backend/` Python Lambda (placeholder)
- `infra/` Terraform configuration
- `.github/workflows/` CI/CD workflows

## Status
Scaffold only. No detailed code yet.

## Local Backend (AWS SAM)
- `cd backend`
- `sam build --use-container --cached --skip-pull-image`
- `sam local start-api`

Default local API URL is `http://127.0.0.1:3000`.

## Frontend Build + S3 Upload
- `npm run build -- --configuration production`
- `aws s3 sync dist/ s3://YOUR_BUCKET_NAME/ --delete --exclude "assets/config.json"`

## CI/CD prerequisites (planned)
- GitHub repo secrets:
  - `AWS_OIDC_ROLE_ARN`: IAM role ARN for GitHub OIDC
  - `AWS_REGION`: AWS region (e.g. `us-east-1`)

## Terraform outputs (planned)
- `api_url`: API Gateway HTTP API base URL
- `s3_website_url`: S3 static website endpoint URL
