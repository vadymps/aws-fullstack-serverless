resource "local_file" "webapp_config_dev" {
  filename = abspath("${path.module}/../frontend/src/assets/config.auto.json")
  content = jsonencode({
    apiUrl = aws_apigatewayv2_api.http.api_endpoint,
    auth = {
      clientId              = local.cognito_client_id
      issuer                = local.cognito_issuer_url
      redirectUri           = local.webapp_url
      postLogoutRedirectUri = local.webapp_url
      scope                 = local.cognito_scopes
    }
  })
}
