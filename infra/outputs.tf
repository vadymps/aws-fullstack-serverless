output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = local.cloudfront_url
}

output "apigatewayv2_api" {
  description = "API Gateway HTTP API base URL"
  value       = local.apigatewayv2_api
}

output "s3_website" {
  description = "S3 bucket website"
  value       = local.s3_website
}

output "s3_avatars_bucket" {
  description = "Avatars S3 bucket name"
  value       = local.s3_avatars_bucket
}

output "cognito_issuer_url" {
  description = "Cognito issuer URL"
  value       = local.cognito_issuer_url
}

output "cognito_client_id" {
  description = "Cognito client ID"
  value       = local.cognito_client_id
}

output "cognito_scopes" {
  description = "Cognito OAuth scopes"
  value       = local.cognito_scopes
}

