resource "local_file" "webapp_config_dev" {
  filename = abspath("${path.module}/../frontend/src/assets/config.auto.json")
  content = jsonencode({
    issuer                = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    clientId              = aws_cognito_user_pool_client.frontend.id
    redirectUri           = "http://localhost:4200"
    postLogoutRedirectUri = "http://localhost:4200"
    scope                 = "openid profile email"
  })
}
