output "webapp_url" {
  description = "Webapp URL"
  value       = format("http://%s", aws_s3_bucket_website_configuration.site.website_endpoint)
}

output "api_url" {
  description = "API Gateway HTTP API base URL"
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "cognito" {
  description = "Cognito config used by the frontend"
  value = {
    issuer                = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    clientId              = aws_cognito_user_pool_client.frontend.id
    redirectUri           = format("http://%s", aws_s3_bucket_website_configuration.site.website_endpoint)
    postLogoutRedirectUri = format("http://%s", aws_s3_bucket_website_configuration.site.website_endpoint)
    scope                 = join(" ", aws_cognito_user_pool_client.frontend.allowed_oauth_scopes)
  }
}
