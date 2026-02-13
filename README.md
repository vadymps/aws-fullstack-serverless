# AWS Serverless Demo (Cheap + Minimal)

This repo will host a minimal AWS serverless demo with:
- Angular frontend hosted on S3
- API Gateway HTTP API + AWS Lambda (Python)
- MongoDB Atlas free tier
- Terraform for AWS infrastructure
- GitHub Actions CI/CD (OIDC, no long-lived keys)

## Structure
- `frontend/` Angular app (placeholder)
- `backend/` Python Lambda (placeholder)
- `infra/` Terraform configuration
- `.github/workflows/` CI/CD workflows

## Status
Scaffold only. No detailed code yet.

## CI/CD prerequisites (planned)
- GitHub repo secrets:
  - `AWS_OIDC_ROLE_ARN`: IAM role ARN for GitHub OIDC
  - `AWS_REGION`: AWS region (e.g. `us-east-1`)

## Terraform outputs (planned)
- `api_url`: API Gateway HTTP API base URL
- `s3_website_url`: S3 static website endpoint URL
