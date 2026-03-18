output "webapp_url" {
  description = "Webapp URL"
  value       = local.webapp_url
}

output "api_url" {
  description = "API Gateway HTTP API base URL"
  value       = aws_apigatewayv2_api.http.api_endpoint
}