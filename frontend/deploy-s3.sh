#!/bin/bash
# Deploy the build folder to S3 using the dev profile
npm run build -- --configuration production
aws s3 sync dist/ s3://aws-fullstack-serverless-webapp --delete --exclude "assets/config.json" --profile dev