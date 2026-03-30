output "webapp_url" {
  description = "Webapp URL"
  value       = local.webapp_url
}

output "apigatewayv2_api" {
  description = "API Gateway HTTP API base URL"
  value       = local.apigatewayv2_api
}

output "s3_bucket_website" {
  description = "S3 bucket website endpoint"
  value       = local.s3_bucket_website
}

output "cognito_issuer_url" {
  description = "Cognito issuer URL"
  value       = local.cognito_issuer_url
}
