# Backend (Lambda)

Python Lambda handler with MongoDB Atlas access.

Layout:
- `src/app.py` Lambda handler
- `requirements.txt` runtime dependencies for SAM local build
- `template.yaml` AWS SAM template for local API emulation
- `env.json` local environment variables for SAM (`MONGODB_URI`, `MONGODB_DB`)
- `build.sh` creates Terraform deployment zip for `infra/lambda.zip`

## Local dev (AWS SAM only)

Requirements:
- Docker running
- AWS SAM CLI installed

From `backend/`:
- `sam build --use-container`
- `sam local start-api --template-file .aws-sam/build/template.yaml --env-vars env.json`

For faster local iterations (keep Lambda container warm / "hot state"):
- `sam local start-api --host 0.0.0.0 --template-file .aws-sam/build/template.yaml --env-vars env.json --warm-containers EAGER`
- Use `LAZY` instead of `EAGER` if you want lower resource usage while still reducing repeated cold starts:
- `sam local start-api --host 0.0.0.0 --template-file .aws-sam/build/template.yaml --env-vars env.json --warm-containers LAZY`

Local API URL:
- `http://127.0.0.1:3000`

Example:
- `curl "http://127.0.0.1:3000/movies?page=1"`

Notes:
- Keep Lambda runtime aligned across `template.yaml` and `infra/variables.tf`.
