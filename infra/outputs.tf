output "webapp_url" {
  description = "Webapp URL"
  value       = local.webapp_url
}

output "api_url" {
  description = "API Gateway HTTP API base URL"
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "cognito" {
  description = "Cognito config used by the frontend"
  value = {
    issuer                = local.cognito_issuer_url
    clientId              = local.cognito_client_id
    redirectUri           = local.webapp_url
    postLogoutRedirectUri = local.webapp_url
    scope                 = local.cognito_scopes
  }
}
