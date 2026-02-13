output "api_url" {
  description = "API Gateway HTTP API base URL"
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "s3_website_url" {
  description = "S3 static website endpoint URL"
  value       = format("http://%s", aws_s3_bucket_website_configuration.site.website_endpoint)
}